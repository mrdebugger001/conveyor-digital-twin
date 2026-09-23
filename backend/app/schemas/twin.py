from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional, Dict
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
    tension: float
    status: Literal["NORMAL", "WARNING", "CRITICAL", "STOPPED", "MAINTENANCE", "UNKNOWN"]
    failure_probability: float


class MotorState(CamelModel):
    id: str
    rpm: float
    temperature: float
    vibration: float
    current: float
    power: float
    status: Literal["NORMAL", "WARNING", "CRITICAL", "STOPPED", "MAINTENANCE", "UNKNOWN"]


class ConveyorState(CamelModel):
    id: str
    run_state: Literal["RUNNING", "STOPPED", "FAULTED", "STARTING", "STOPPING"]
    speed: float
    target_speed: float
    load: float
    ore_flow: float
    tension: float
    tracking: float
    belt_health: float
    joint_health: Dict[str, JointState]
    motor: MotorState
    mode: Literal["LIVE", "SIMULATION", "PLAYBACK"]
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


class ModeCommand(CamelModel):
    mode: Literal["LIVE", "SIMULATION", "PLAYBACK"]


class PredictionResult(CamelModel):
    asset_id: str
    failure_probability: float
    health_score: float
    contributing_factors: list[str]
    risk_horizon_hours: Optional[float] = None
