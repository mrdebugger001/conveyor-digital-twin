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


def joint_risk_score(j: JointReading) -> tuple[float, List[str]]:
    """Returns (risk_0_to_1, contributing_factors_list).

    Weighted linear combination of four sensor signals, each normalised to [0,1].
    Weights: tension 35 %, vibration 30 %, temperature 20 %, tracking 15 %.
    """
    factors: List[str] = []
    risk = 0.0

    tension_contrib = (
        clamp01((j.tension - config.TENSION_NORMAL_MAX) / config.TENSION_CRITICAL_SPAN)
        * 0.35
    )
    risk += tension_contrib
    if tension_contrib > 0.1:
        factors.append(f"High tension ({j.tension:.1f} kN)")

    vib_contrib = (
        clamp01((j.vibration - config.VIB_NORMAL_MAX) / config.VIB_CRITICAL_SPAN) * 0.30
    )
    risk += vib_contrib
    if vib_contrib > 0.1:
        factors.append(f"Excessive vibration ({j.vibration:.1f} mm/s)")

    temp_contrib = (
        clamp01((j.temperature - config.TEMP_NORMAL_MAX) / config.TEMP_CRITICAL_SPAN)
        * 0.20
    )
    risk += temp_contrib
    if temp_contrib > 0.1:
        factors.append(f"Elevated temperature ({j.temperature:.1f}°C)")

    track_contrib = (
        clamp01(abs(j.tracking_deviation) / config.TRACKING_CRITICAL) * 0.15
    )
    risk += track_contrib
    if track_contrib > 0.1:
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
