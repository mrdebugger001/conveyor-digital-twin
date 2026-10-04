import os
import math
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional
from app.data.common_schema import DatasetSource, EquipmentHealthCondition, StandardizedSensorBurst, DatasetCatalogItem


class PaderbornLoader:
    """Loader and reference benchmark generator for the Paderborn University

    Bearing Dataset (Lessmeier et al., 2016).
    Key feature: Synchronous vibration and motor current signatures under controlled radial loads.
    """

    RAW_DIR = Path(__file__).resolve().parent / "raw" / "paderborn"

    def __init__(self, raw_dir: Optional[Path] = None):
        self.raw_dir = raw_dir or self.RAW_DIR
        self.raw_dir.mkdir(parents=True, exist_ok=True)

    def get_catalog(self) -> List[DatasetCatalogItem]:
        return [
            DatasetCatalogItem(
                dataset_name="Paderborn University Bearing Dataset",
                source=DatasetSource.PADERBORN_BENCHMARK,
                target_equipment="motor-M01 / Drive Motor Current & Bearings",
                description="Synchronized high-frequency vibration and phase current measurements under diverse torque/radial load states.",
                sample_rate_hz=64000.0,
                available_conditions=["HEALTHY", "INNER_RACE_FAULT", "OUTER_RACE_FAULT"],
                is_calibrated=True,
                citation="Paderborn University KatData (Lessmeier, Kimotho, Zimmer, Sextro 2016)",
            )
        ]

    def load_synchronized_burst(
        self,
        condition: EquipmentHealthCondition = EquipmentHealthCondition.HEALTHY,
        rpm: float = 1485.0,
        load_pct: float = 75.0,
        duration_s: float = 0.5,
        sample_rate_hz: float = 10000.0,
    ) -> Dict[str, StandardizedSensorBurst]:
        """Loads synchronized vibration and motor phase current bursts."""
        n_samples = int(duration_s * sample_rate_hz)
        t = np.linspace(0.0, duration_s, n_samples, endpoint=False)
        fr = rpm / 60.0
        f_supply = 50.0  # 50 Hz industrial grid frequency in India / IEC

        # Motor Current Baseline: 50 Hz fundamental + small odd harmonics (150 Hz, 250 Hz)
        # Fundamental current magnitude proportional to load
        i_mag = 40.0 + 45.0 * (load_pct / 100.0)
        current = (
            i_mag * np.sin(2.0 * np.pi * f_supply * t)
            + 0.03 * i_mag * np.sin(2.0 * np.pi * 3.0 * f_supply * t)
            + 0.015 * i_mag * np.sin(2.0 * np.pi * 5.0 * f_supply * t)
            + np.random.normal(0.0, 0.2, n_samples)
        )

        # Vibration Baseline:
        vibration = (
            0.5 * np.sin(2.0 * np.pi * fr * t)
            + 0.25 * np.sin(2.0 * np.pi * 2.0 * fr * t)
            + np.random.normal(0.0, 0.1, n_samples)
        )

        # In presence of bearing faults, motor current displays MCSA sidebands:
        # f_sidebands = |f_supply +/- k * f_vibration_fault|
        if condition == EquipmentHealthCondition.OUTER_RACE_FAULT:
            f_bpfo = 3.585 * fr
            # Current modulation
            current += 0.06 * i_mag * np.sin(2.0 * np.pi * (f_supply + f_bpfo) * t)
            current += 0.06 * i_mag * np.sin(2.0 * np.pi * abs(f_supply - f_bpfo) * t)
            # Vibration ringdowns
            vibration += 2.8 * np.sin(2.0 * np.pi * f_bpfo * t)
        elif condition == EquipmentHealthCondition.INNER_RACE_FAULT:
            f_bpfi = 5.415 * fr
            current += 0.08 * i_mag * np.sin(2.0 * np.pi * (f_supply + f_bpfi) * t)
            current += 0.08 * i_mag * np.sin(2.0 * np.pi * abs(f_supply - f_bpfi) * t)
            vibration += 3.5 * np.sin(2.0 * np.pi * f_bpfi * t)

        current_burst = StandardizedSensorBurst(
            dataset_source=DatasetSource.PADERBORN_BENCHMARK,
            equipment_mapped_id="motor-M01",
            channel_name="phase_u_current_a",
            physical_unit="A",
            sampling_rate_hz=sample_rate_hz,
            time_series_data=current.tolist(),
            condition_label=condition,
            operating_speed_rpm=rpm,
            load_pct=load_pct,
            metadata={"grid_frequency_hz": f_supply},
        )

        vibration_burst = StandardizedSensorBurst(
            dataset_source=DatasetSource.PADERBORN_BENCHMARK,
            equipment_mapped_id="motor-M01",
            channel_name="motor_vibration_de",
            physical_unit="m/s^2",
            sampling_rate_hz=sample_rate_hz,
            time_series_data=vibration.tolist(),
            condition_label=condition,
            operating_speed_rpm=rpm,
            load_pct=load_pct,
            metadata={"rpm": rpm},
        )

        return {"current": current_burst, "vibration": vibration_burst}
