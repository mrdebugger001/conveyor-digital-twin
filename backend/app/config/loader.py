from pathlib import Path
from typing import Dict, Any, Optional
import yaml
from pydantic import BaseModel, Field

CONFIG_DIR = Path(__file__).parent
CONVEYOR_YAML_PATH = CONFIG_DIR / "conveyor.yaml"
PROVENANCE_YAML_PATH = CONFIG_DIR / "provenance.yaml"


class GeometryConfig(BaseModel):
    conveyor_horizontal_length_m: float
    conveyor_length_m: float
    lift_height_m: float
    inclination_deg: float
    carrying_angle_deg: float
    belt_width_m: float
    belt_thickness_m: float
    idler_spacing_m: float
    return_idler_spacing_m: float
    troughing_angle_deg: float
    total_loop_length_m: float


class BeltConfig(BaseModel):
    type: str
    mass_kg_per_m: float
    thickness_m: float
    top_cover_thickness_m: float
    bottom_cover_thickness_m: float
    core_thickness_m: float
    elastic_modulus_pa: float
    tensile_strength_pa: float
    splice_efficiency: float
    damping_coefficient: float
    max_allowable_sag_pct: float


class MaterialConfig(BaseModel):
    material_type: str
    density_kg_per_m3: float
    throughput_tph: float
    max_throughput_tph: float
    surcharge_angle_deg: float
    friction_coefficient: float
    moisture_pct_nominal: float
    lump_size_max_m: float


class DriveConfig(BaseModel):
    pulley_diameter_m: float
    pulley_wrap_deg: float
    pulley_friction_coefficient: float
    tail_pulley_diameter_m: float
    motor_power_kw: float
    motor_rated_rpm: float
    motor_efficiency: float
    gearbox_ratio: float
    gearbox_efficiency: float
    drive_mechanical_efficiency: float
    rated_voltage_v: float
    rated_power_factor: float
    thermal_resistance_k_per_w: float
    thermal_capacitance_j_per_k: float
    ambient_temperature_c: float


class TensionConfig(BaseModel):
    tail_tension_n: float
    takeup_type: str
    takeup_stiffness: float
    takeup_mass_kg: float
    minimum_allowable_tension_n: float
    warning_tension_n: float
    critical_tension_n: float


class IdlersConfig(BaseModel):
    carrying_mass_kg_per_idler: float
    return_mass_kg_per_idler: float
    roller_diameter_m: float
    rolling_resistance_f: float
    secondary_resistance_c: float


class JointsConfig(BaseModel):
    number_of_joints: int
    spacing_m: float
    nominal_splice_factor: float
    stress_concentration_factor_kt: float
    fatigue_exponent_m: float
    fatigue_endurance_limit_pa: float
    ultimate_splice_strength_pa: float
    fatigue_critical_damage: float
    fatigue_warning_damage: float
    stress_warning_pa: float
    stress_critical_pa: float


class ConveyorConfig(BaseModel):
    conveyor: Dict[str, Any]
    geometry: GeometryConfig
    belt: BeltConfig
    material: MaterialConfig
    drive: DriveConfig
    tension: TensionConfig
    idlers: IdlersConfig
    joints: JointsConfig


class ProvenanceItem(BaseModel):
    value: Any
    unit: str
    source: str
    classification: str
    confidence: str
    uncertainty_percent: float


class ProvenanceRegistry(BaseModel):
    parameters: Dict[str, ProvenanceItem]


_cached_conveyor_config: Optional[ConveyorConfig] = None
_cached_provenance: Optional[ProvenanceRegistry] = None


def load_conveyor_config() -> ConveyorConfig:
    global _cached_conveyor_config
    if _cached_conveyor_config is None:
        with open(CONVEYOR_YAML_PATH, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        _cached_conveyor_config = ConveyorConfig(**data)
    return _cached_conveyor_config


def load_provenance() -> ProvenanceRegistry:
    global _cached_provenance
    if _cached_provenance is None:
        with open(PROVENANCE_YAML_PATH, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        _cached_provenance = ProvenanceRegistry(**data)
    return _cached_provenance


def get_parameter_provenance(param_name: str) -> Optional[ProvenanceItem]:
    reg = load_provenance()
    return reg.parameters.get(param_name)
