from app.schemas.twin import ConveyorState, Alarm
from app import config
from datetime import datetime, timezone
import uuid


def check_tension(state: ConveyorState) -> list[Alarm]:
    alarms = []
    if state.tension > config.TENSION_WARNING_MAX:
        severity = (
            "CRITICAL"
            if state.tension > config.TENSION_WARNING_MAX + 10
            else "WARNING"
        )
        alarms.append(
            Alarm(
                id=str(uuid.uuid4()),
                asset_id="belt-B01",
                type="HIGH_TENSION",
                severity=severity,
                value=state.tension,
                threshold=config.TENSION_WARNING_MAX,
                message=(
                    f"Belt tension {state.tension:.1f} kN exceeds threshold "
                    f"{config.TENSION_WARNING_MAX} kN"
                ),
                timestamp=datetime.now(timezone.utc),
                acknowledged=False,
            )
        )
    return alarms


def check_tracking(state: ConveyorState) -> list[Alarm]:
    alarms = []
    dev = abs(state.tracking)
    if dev > config.TRACKING_WARNING_MAX:
        severity = "CRITICAL" if dev > config.TRACKING_CRITICAL else "WARNING"
        alarms.append(
            Alarm(
                id=str(uuid.uuid4()),
                asset_id="belt-B01",
                type="BELT_MISALIGNMENT",
                severity=severity,
                value=dev,
                threshold=config.TRACKING_WARNING_MAX,
                message=(
                    f"Belt tracking deviation {dev:.1f} mm exceeds "
                    f"{config.TRACKING_WARNING_MAX} mm"
                ),
                timestamp=datetime.now(timezone.utc),
                acknowledged=False,
            )
        )
    return alarms


def check_motor(state: ConveyorState) -> list[Alarm]:
    alarms = []
    if state.motor.temperature > config.TEMP_WARNING_MAX:
        severity = (
            "CRITICAL"
            if state.motor.temperature > config.TEMP_WARNING_MAX + 15
            else "WARNING"
        )
        alarms.append(
            Alarm(
                id=str(uuid.uuid4()),
                asset_id="motor-M01",
                type="MOTOR_OVERHEAT",
                severity=severity,
                value=state.motor.temperature,
                threshold=config.TEMP_WARNING_MAX,
                message=(
                    f"Motor temperature {state.motor.temperature:.1f}°C exceeds "
                    f"threshold {config.TEMP_WARNING_MAX}°C"
                ),
                timestamp=datetime.now(timezone.utc),
                acknowledged=False,
            )
        )
    return alarms


def check_joints(state: ConveyorState) -> list[Alarm]:
    alarms = []
    for jid, j in state.joint_health.items():
        if j.health < config.JOINT_HEALTH_CRITICAL:
            severity = (
                "CRITICAL" if j.health < config.JOINT_HEALTH_HIGH_RISK else "WARNING"
            )
            alarms.append(
                Alarm(
                    id=str(uuid.uuid4()),
                    asset_id=f"joint-{jid}",
                    type="JOINT_DEGRADATION",
                    severity=severity,
                    value=j.health,
                    threshold=config.JOINT_HEALTH_CRITICAL,
                    message=(
                        f"Joint {jid} health {j.health:.0f}% below threshold. "
                        f"Vibration: {j.vibration:.1f} mm/s, Tension: {j.tension:.1f} kN"
                    ),
                    timestamp=datetime.now(timezone.utc),
                    acknowledged=False,
                )
            )
    return alarms
