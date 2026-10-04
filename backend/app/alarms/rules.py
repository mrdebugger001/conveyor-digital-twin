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
                        f"Stress: {j.stress_mpa:.1f} MPa, Vibration: {j.vibration:.1f} mm/s"
                    ),
                    timestamp=datetime.now(timezone.utc),
                    acknowledged=False,
                )
            )

        # Splice stress overload alarm
        if j.stress_mpa > config.STRESS_WARNING_MAX_MPA:
            sev = "CRITICAL" if j.stress_mpa > config.STRESS_CRITICAL_MPA else "WARNING"
            alarms.append(
                Alarm(
                    id=str(uuid.uuid4()),
                    asset_id=f"joint-{jid}",
                    type="SPLICE_STRESS_OVERLOAD",
                    severity=sev,
                    value=j.stress_mpa,
                    threshold=config.STRESS_WARNING_MAX_MPA,
                    message=(
                        f"Joint {jid} multi-axis stress {j.stress_mpa:.1f} MPa exceeds DIN limit "
                        f"{config.STRESS_WARNING_MAX_MPA} MPa. High splice peeling risk!"
                    ),
                    timestamp=datetime.now(timezone.utc),
                    acknowledged=False,
                )
            )

        # Miner's cumulative fatigue alarm
        if j.miner_damage > config.MINER_DAMAGE_WARNING:
            sev = "CRITICAL" if j.miner_damage > config.MINER_DAMAGE_CRITICAL else "WARNING"
            alarms.append(
                Alarm(
                    id=str(uuid.uuid4()),
                    asset_id=f"joint-{jid}",
                    type="SPLICE_FATIGUE_CRITICAL",
                    severity=sev,
                    value=round(j.miner_damage * 100, 1),
                    threshold=round(config.MINER_DAMAGE_WARNING * 100, 1),
                    message=(
                        f"Joint {jid} cumulative Miner fatigue damage D = {j.miner_damage:.2f} "
                        f"exceeds endurance limit. Splice failure imminent."
                    ),
                    timestamp=datetime.now(timezone.utc),
                    acknowledged=False,
                )
            )

    # Belt catenary sag check
    if state.belt_sag_mm > 24.0:
        alarms.append(
            Alarm(
                id=str(uuid.uuid4()),
                asset_id="belt-B01",
                type="EXCESSIVE_BELT_SAG",
                severity="WARNING" if state.belt_sag_mm < 35.0 else "CRITICAL",
                value=state.belt_sag_mm,
                threshold=24.0,
                message=(
                    f"Belt catenary sag {state.belt_sag_mm:.1f} mm exceeds 2% CEMA allowance (24 mm). "
                    f"Check take-up carriage travel and load mass."
                ),
                timestamp=datetime.now(timezone.utc),
                acknowledged=False,
            )
        )

    return alarms
