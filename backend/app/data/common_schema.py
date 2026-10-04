from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum
from datetime import datetime


class DatasetSource(str, Enum):
    CWRU_BENCHMARK = "CWRU_BENCHMARK"
    PADERBORN_BENCHMARK = "PADERBORN_BENCHMARK"
    MENDELEY_BELT_DRIVE = "MENDELEY_BELT_DRIVE"
    NASA_IMS = "NASA_IMS"
    CONVEYOR_C01_SIMULATED = "CONVEYOR_C01_SIMULATED"
    REAL_MEASURED = "REAL_MEASURED"


class EquipmentHealthCondition(str, Enum):
    HEALTHY = "HEALTHY"
    INNER_RACE_FAULT = "INNER_RACE_FAULT"
    OUTER_RACE_FAULT = "OUTER_RACE_FAULT"
    BALL_ROLLER_FAULT = "BALL_ROLLER_FAULT"
    CAGE_FAULT = "CAGE_FAULT"
    BELT_DAMAGE = "BELT_DAMAGE"
    MISALIGNMENT = "MISALIGNMENT"
    IMBALANCE = "IMBALANCE"
    OVERHEAT = "OVERHEAT"
    SENSOR_FAULT = "SENSOR_FAULT"


@dataclass
class StandardizedSensorBurst:
    """Standardized representation for high-frequency or windowed industrial telemetry."""

    dataset_source: DatasetSource
    equipment_mapped_id: str  # e.g. "motor-M01", "pulley-HP01", "joint-J023"
    channel_name: str  # e.g. "vibration_de", "vibration_fe", "phase_current_a"
    physical_unit: str  # e.g. "m/s^2", "mm/s", "A", "degC", "N"
    sampling_rate_hz: float
    time_series_data: List[float]
    condition_label: EquipmentHealthCondition
    operating_speed_rpm: float
    load_pct: float
    metadata: Dict[str, Any] = field(default_factory=dict)
    recorded_at: Optional[datetime] = None


@dataclass
class DatasetCatalogItem:
    dataset_name: str
    source: DatasetSource
    target_equipment: str
    description: str
    sample_rate_hz: float
    available_conditions: List[str]
    is_calibrated: bool
    citation: str
