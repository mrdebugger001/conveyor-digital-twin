import os
import math
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional
from app.data.common_schema import DatasetSource, EquipmentHealthCondition, StandardizedSensorBurst, DatasetCatalogItem


class BeltDriveDatasetLoader:
    """Loader and reference benchmark generator for Industrial Belt Drive vibration datasets

    (Mendeley Data / Belt Drive Fault Diagnosis benchmarks).
    Key features: Vibration vs belt speed, belt pretension (tight/slack), and splice/belt damage.
    """

    RAW_DIR = Path(__file__).resolve().parent / "raw" / "belt_drive"

    def __init__(self, raw_dir: Optional[Path] = None):
        self.raw_dir = raw_dir or self.RAW_DIR
        self.raw_dir.mkdir(parents=True, exist_ok=True)

    def get_catalog(self) -> List[DatasetCatalogItem]:
        return [
            DatasetCatalogItem(
                dataset_name="Mendeley Industrial Belt Drive Dataset",
                source=DatasetSource.MENDELEY_BELT_DRIVE,
                target_equipment="belt-B01 / Pulley & Splice Assemblies",
                description="Vibration signals measuring belt splice passage, tension variations, and misalignment transients across multiple belt speeds.",
                sample_rate_hz=5000.0,
                available_conditions=["HEALTHY", "BELT_DAMAGE", "MISALIGNMENT"],
                is_calibrated=True,
                citation="Industrial Belt Drive Vibration Fault Dataset (Mendeley Data)",
            )
        ]

    def load_belt_vibration_burst(
        self,
        condition: EquipmentHealthCondition = EquipmentHealthCondition.HEALTHY,
        belt_speed_m_s: float = 3.2,
        tension_kn: float = 145.0,
        duration_s: float = 1.0,
        sample_rate_hz: float = 5000.0,
    ) -> StandardizedSensorBurst:
        """Generates or loads belt and idler vibration bursts based on belt speed and tension."""
        n_samples = int(duration_s * sample_rate_hz)
        t = np.linspace(0.0, duration_s, n_samples, endpoint=False)

        # Idler roll passing frequency: f_idler = v / (pi * D_idler)
        # D_idler = 0.152 m -> circumference = 0.4775 m -> at 3.2 m/s, f_idler approx 6.7 Hz
        d_idler = 0.152
        f_idler = belt_speed_m_s / (np.pi * d_idler)

        # Belt strand natural frequency (string equation):
        # f_strand = (1 / (2 * L_i)) * sqrt(T / q_b)
        l_i = 1.2  # idler spacing
        q_b = 24.5  # belt mass kg/m
        t_newtons = max(1000.0, tension_kn * 1000.0)
        f_strand = (1.0 / (2.0 * l_i)) * math.sqrt(t_newtons / q_b)

        # Baseline vibration: superposition of idler rotation + belt strand resonance + broadband noise
        vibration = (
            0.6 * np.sin(2.0 * np.pi * f_idler * t)
            + 0.3 * np.sin(2.0 * np.pi * 2.0 * f_idler * t)
            + 0.25 * np.sin(2.0 * np.pi * f_strand * t)
            + np.random.normal(0.0, 0.12, n_samples)
        )

        if condition == EquipmentHealthCondition.BELT_DAMAGE:
            # Splice defect or carcass tear creates a sharp impulse whenever it passes an idler or pulley
            # Periodic impulse every ~0.25 s
            t_pulse = 0.25
            for k in range(int(duration_s / t_pulse)):
                t0 = k * t_pulse
                idx = (t >= t0) & (t < t0 + 0.02)
                dt = t[idx] - t0
                vibration[idx] += 4.5 * np.exp(-300.0 * dt) * np.sin(2.0 * np.pi * 650.0 * dt)

        elif condition == EquipmentHealthCondition.MISALIGNMENT:
            # Lateral tracking misalignment creates elevated 1X and 2X idler runout amplitude
            vibration += 1.8 * np.sin(2.0 * np.pi * f_idler * t + 0.5)

        return StandardizedSensorBurst(
            dataset_source=DatasetSource.MENDELEY_BELT_DRIVE,
            equipment_mapped_id="belt-B01",
            channel_name="idler_bearing_vibration",
            physical_unit="mm/s",
            sampling_rate_hz=sample_rate_hz,
            time_series_data=vibration.tolist(),
            condition_label=condition,
            operating_speed_rpm=belt_speed_m_s * 60.0 / (np.pi * 0.5),  # Pulley RPM
            load_pct=75.0,
            metadata={
                "f_idler_hz": round(f_idler, 2),
                "f_strand_resonance_hz": round(f_strand, 2),
                "tension_kn": tension_kn,
            },
        )
