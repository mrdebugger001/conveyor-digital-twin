from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional, Dict, List
from datetime import datetime


def to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class JointState(CamelModel):
    id: str
    health: float
    temperature: float
    vibration: float
    tension: float  # Dynamic tension Tj (kN)
    stress_mpa: float  # Multi-axis bending + tensile stress sigma_total (MPa)
    load_kn: float  # Dynamic vertical reaction on idler station (kN)
    dynamic_sag_mm: float  # Local belt sag (mm)
    miner_damage: float  # Miner's cumulative fatigue index D (0.0 to 1.0)
    fea_color: str  # Hex or spectral identifier for FEA shader
    status: Literal["NORMAL", "WARNING", "CRITICAL", "STOPPED", "RUNNING", "MAINTENANCE", "UNKNOWN"]
    failure_probability: float


class MotorState(CamelModel):
    id: str
    rpm: float
    temperature: float
    vibration: float
    current: float
    power: float
    status: Literal["NORMAL", "WARNING", "CRITICAL", "STOPPED", "RUNNING", "MAINTENANCE", "UNKNOWN"]


class ConveyorState(CamelModel):
    id: str
    run_state: Literal["RUNNING", "STOPPED", "FAULTED", "STARTING", "STOPPING"]
    speed: float
    target_speed: float
    load: float
    ore_flow: float  # Legacy compatibility (TPH)
    coal_flow: float  # CEMA bulk coal rate (TPH)
    linear_mass_qm: float  # Coal linear payload q_m (kg/m)
    tension: float  # Head tension (kN)
    cema_head_tension: float  # CEMA DIN 22101 T_head (kN)
    cema_slack_tension: float  # CEMA T_slack (kN)
    belt_sag_mm: float  # Dynamic catenary belt sag (mm)
    peak_stress_mpa: float  # Highest stress among 24 splices
    avg_stress_mpa: float  # Mean splice stress
    tracking: float
    belt_health: float
    joint_health: Dict[str, JointState]
    motor: MotorState
    mode: Literal["LIVE", "SIMULATION", "PLAYBACK"]
    moisture_pct: float  # Coal moisture content (%)
    smart_throttle_enabled: bool  # AI Smart Throttle loop toggle
    smart_throttle_active: bool  # AI derating active
    smart_throttle_derate_pct: float  # % derated from nominal
    updated_at: datetime


class Alarm(CamelModel):
    id: str
    asset_id: str
    type: str
    severity: Literal["INFO", "WARNING", "CRITICAL", "EMERGENCY"]
    value: float
    threshold: float
    message: str
    timestamp: datetime
    acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None


class AcknowledgeRequest(CamelModel):
    acknowledged_by: str


class FaultInjectionConfig(CamelModel):
    misalignment: bool = False
    high_tension: bool = False
    high_vibration: bool = False
    motor_overheat: bool = False
    bearing_failure: bool = False
    joint_damage_id: Optional[str] = None
    joint_damage_enabled: bool = False
    belt_tear: bool = False
    conveyor_jam: bool = False


class ControlCommand(CamelModel):
    asset_id: str = "C01"


class SpeedCommand(CamelModel):
    target_speed: float


class SmartThrottleToggleCommand(CamelModel):
    enabled: bool


class ModeCommand(CamelModel):
    mode: Literal["LIVE", "SIMULATION", "PLAYBACK"]


class PredictionResult(CamelModel):
    asset_id: str
    failure_probability: float
    health_score: float
    contributing_factors: List[str]
    risk_horizon_hours: Optional[float] = None
    stress_mpa: Optional[float] = None
    miner_damage: Optional[float] = None


# --- What-If Digital Sandbox Schemas ---
class WhatIfRequest(CamelModel):
    coal_tph: float = 1200.0
    moisture_pct: float = 6.5
    belt_speed: float = 3.2
    friction_factor: float = 0.022


class WhatIfResponse(CamelModel):
    linear_mass_qm: float  # kg/m
    cema_head_tension: float  # kN
    cema_slack_tension: float  # kN
    cema_motor_power_kw: float  # kW
    peak_joint_stress_mpa: float  # MPa
    tensile_stress_mpa: float  # MPa
    bending_stress_mpa: float  # MPa
    belt_sag_mm: float  # mm
    cema_sag_pct: float  # %
    safety_factor: float
    estimated_splice_life_hours: float
    stress_status: Literal["OPTIMAL", "ACCEPTABLE", "WARNING", "CRITICAL"]
    recommendations: List[str]


# --- SAP / CMMS Maintenance Dispatch Schemas ---
class SapDispatchWorkOrderRequest(CamelModel):
    asset_id: str
    technician: str = "Lead Splice Specialist"
    downtime_window_hours: float = 4.5
    notes: Optional[str] = None


class SapDispatchWorkOrderResponse(CamelModel):
    work_order_id: str
    asset_id: str
    equipment_tag: str
    sap_status: str
    priority: str
    failure_mode: str
    required_spare_parts: List[str]
    downtime_window_hours: float
    cost_estimate_usd: float
    scheduled_start: datetime
    dispatched_at: datetime
    notification_msg: str


# --- Physics Profile & Real Data Analytics Schemas ---
class JointSpatialMarker(CamelModel):
    id: str
    position_s_m: float
    tension_kn: float
    zone: str
    total_stress_mpa: float
    tensile_stress_mpa: float
    bending_stress_mpa: float
    safety_factor: float
    health_pct: float
    cumulative_damage_d: float
    cycles_completed: int


class TensionProfileResponse(CamelModel):
    total_length_m: float
    head_tension_kn: float
    slack_tension_kn: float
    effective_tension_kn: float
    traction_margin: float
    is_slip_warning: bool
    spatial_s_m: List[float]
    tension_kn: List[float]
    joints: List[JointSpatialMarker]


class ResidualMetricModel(CamelModel):
    metric_name: str
    unit: str
    measured_value: Optional[float]
    predicted_value: float
    residual: float
    normalized_residual_z: float
    health_status: str
    fault_hypothesis: str


class TwinResidualsResponse(CamelModel):
    tension: ResidualMetricModel
    power: ResidualMetricModel
    current: ResidualMetricModel
    temperature: ResidualMetricModel
    vibration: ResidualMetricModel
    rmse: float
    mae: float
    sensor_faults_detected: List[str]
    mechanical_faults_detected: List[str]


class VibrationAnalyticsResponse(CamelModel):
    rms: float
    peak: float
    crest_factor: float
    kurtosis: float
    spectral_centroid_hz: float
    envelope_rms: float
    iso_zone: str
    vibration_hi: float
    bearing_hi: float
    motor_hi: float
    composite_health_index: float
    anomaly_detected: bool
    contributing_factors: List[str]
    bearing_frequencies_hz: Dict[str, float]


class CalibrationRequest(CamelModel):
    target_parameter: Literal["friction_factor", "thermal_resistance"]
    dataset_name: Optional[str] = "CEMA_FIELD_MEASURED"


class CalibrationResponse(CamelModel):
    parameter_name: str
    nominal_value: float
    calibrated_value: float
    unit: str
    rmse_before: float
    rmse_after: float
    improvement_pct: float

