from dataclasses import dataclass
from typing import List
from app import config


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


@dataclass
class JointReading:
    tension: float
    vibration: float
    temperature: float
    tracking_deviation: float
    stress_mpa: float = 11.0
    miner_damage: float = 0.1


def joint_risk_score(j: JointReading) -> tuple[float, List[str]]:
    """Returns (risk_0_to_1, contributing_factors_list).

    Multi-sensor fusion combining dynamic tension, vibration, temperature, tracking deviation,
    FEA multi-axis stress (MPa), and Miner's cumulative fatigue index D.
    """
    factors: List[str] = []
    risk = 0.0

    # Tension component (25%)
    tension_contrib = (
        clamp01((j.tension - config.TENSION_NORMAL_MAX) / config.TENSION_CRITICAL_SPAN)
        * 0.25
    )
    risk += tension_contrib
    if tension_contrib > 0.08:
        factors.append(f"High tension ({j.tension:.1f} kN)")

    # Vibration component (20%)
    vib_contrib = (
        clamp01((j.vibration - config.VIB_NORMAL_MAX) / config.VIB_CRITICAL_SPAN) * 0.20
    )
    risk += vib_contrib
    if vib_contrib > 0.06:
        factors.append(f"Excessive vibration ({j.vibration:.1f} mm/s)")

    # FEA Multi-Axis Stress component (25%)
    stress_span = config.STRESS_CRITICAL_MPA - config.STRESS_NORMAL_MAX_MPA
    stress_contrib = (
        clamp01((j.stress_mpa - config.STRESS_NORMAL_MAX_MPA) / max(1.0, stress_span))
        * 0.25
    )
    risk += stress_contrib
    if stress_contrib > 0.08:
        factors.append(f"Splice stress overload ({j.stress_mpa:.1f} MPa)")

    # Miner's cumulative fatigue component (15%)
    fatigue_contrib = clamp01(j.miner_damage / config.MINER_DAMAGE_CRITICAL) * 0.15
    risk += fatigue_contrib
    if j.miner_damage > config.MINER_DAMAGE_WARNING:
        factors.append(f"High splice fatigue damage (D = {j.miner_damage:.2f})")

    # Temperature component (10%)
    temp_contrib = (
        clamp01((j.temperature - config.TEMP_NORMAL_MAX) / config.TEMP_CRITICAL_SPAN)
        * 0.10
    )
    risk += temp_contrib
    if temp_contrib > 0.05:
        factors.append(f"Elevated temperature ({j.temperature:.1f}°C)")

    # Tracking deviation component (5%)
    track_contrib = (
        clamp01(abs(j.tracking_deviation) / config.TRACKING_CRITICAL) * 0.05
    )
    risk += track_contrib
    if track_contrib > 0.02:
        factors.append(f"Tracking deviation ({j.tracking_deviation:.1f} mm)")

    return clamp01(risk), factors


def joint_health(j: JointReading) -> float:
    """Return joint health as a percentage [0, 100]."""
    return 100.0 * (1.0 - joint_risk_score(j)[0])


def joint_status(health: float) -> str:
    """Map health percentage to a status string."""
    if health > config.JOINT_HEALTH_WARNING:
        return "NORMAL"
    elif health > config.JOINT_HEALTH_CRITICAL:
        return "WARNING"
    elif health > config.JOINT_HEALTH_HIGH_RISK:
        return "CRITICAL"
    else:
        return "CRITICAL"
