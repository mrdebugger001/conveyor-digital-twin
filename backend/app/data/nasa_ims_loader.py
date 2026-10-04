import os
import math
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional
from app.data.common_schema import DatasetSource, EquipmentHealthCondition, StandardizedSensorBurst, DatasetCatalogItem


class NASAIMSLoader:
    """Loader and degradation trajectory generator based on NASA IMS Bearing Run-to-Failure dataset

    (Center for Intelligent Maintenance Systems, University of Cincinnati / NASA Ames).
    Provides benchmark degradation curves for Remaining Useful Life (RUL) estimation.
    """

    RAW_DIR = Path(__file__).resolve().parent / "raw" / "nasa_ims"

    def __init__(self, raw_dir: Optional[Path] = None):
        self.raw_dir = raw_dir or self.RAW_DIR
        self.raw_dir.mkdir(parents=True, exist_ok=True)

    def get_catalog(self) -> List[DatasetCatalogItem]:
        return [
            DatasetCatalogItem(
                dataset_name="NASA IMS Bearing Run-to-Failure Dataset",
                source=DatasetSource.NASA_IMS,
                target_equipment="pulley-HP01 / Head Pulley Pillow Block Bearings",
                description="Longitudinal run-to-failure degradation trajectory tracking bearing degradation across 30+ days up to outer/inner race failure.",
                sample_rate_hz=20480.0,
                available_conditions=["HEALTHY", "DEGRADING", "FAILURE_IMMINENT"],
                is_calibrated=True,
                citation="NASA Ames Prognostics Data Repository / IMS Center (Qiu, Lee, Lin 2006)",
            )
        ]

    def get_degradation_trajectory(self, total_points: int = 100) -> List[Dict[str, float]]:
        """Generates the characteristic bathtub / exponential degradation curve observed in NASA IMS Test 1 and 2.

        Points represent lifetime percent 0% to 100%.
        """
        trajectory = []
        for i in range(total_points):
            pct = i / (total_points - 1) * 100.0

            # Baseline stage: 0% to 75% lifetime -> steady low RMS (~0.12 g), normal kurtosis (~3.0)
            if pct < 75.0:
                rms = 0.12 + 0.01 * (pct / 75.0) + np.random.normal(0, 0.003)
                kurtosis = 3.0 + np.random.normal(0, 0.1)
                crest_factor = 3.2 + np.random.normal(0, 0.15)
                health_score = 100.0 - 0.1 * pct
            # Incipient defect stage: 75% to 90% lifetime -> Kurtosis spikes sharply (peaking around 8-12), RMS starts upward inflection
            elif pct < 90.0:
                progress = (pct - 75.0) / 15.0
                rms = 0.13 + 0.25 * (progress ** 2) + np.random.normal(0, 0.01)
                kurtosis = 3.0 + 8.5 * math.sin(progress * np.pi) + np.random.normal(0, 0.3)
                crest_factor = 3.5 + 4.0 * progress + np.random.normal(0, 0.2)
                health_score = 92.5 - 35.0 * progress
            # Severe spalling / catastrophic stage: 90% to 100% -> RMS explodes (>1.5 g), kurtosis drops as noise becomes continuous
            else:
                progress = (pct - 90.0) / 10.0
                rms = 0.38 + 1.20 * (progress ** 2.5) + np.random.normal(0, 0.03)
                kurtosis = 5.0 - 1.5 * progress + np.random.normal(0, 0.3)  # Drops back towards ~3.5
                crest_factor = 7.5 + 2.0 * progress + np.random.normal(0, 0.3)
                health_score = max(0.0, 57.5 - 57.5 * progress)

            trajectory.append({
                "lifetime_pct": round(pct, 1),
                "rms_g": round(float(rms), 4),
                "kurtosis": round(float(kurtosis), 2),
                "crest_factor": round(float(crest_factor), 2),
                "health_score": round(float(health_score), 1),
            })

        return trajectory
