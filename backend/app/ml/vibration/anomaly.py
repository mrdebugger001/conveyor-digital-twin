import math
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional
from app.ml.vibration.features import VibrationFeatures


@dataclass
class HealthIndicators:
    vibration_hi: float  # 0 to 100%
    bearing_hi: float    # 0 to 100%
    motor_hi: float      # 0 to 100%
    joint_overall_hi: float  # 0 to 100%
    composite_health_index: float  # 0 to 100%
    iso_vibration_zone: str  # "A: Good", "B: Acceptable", "C: Warning", "D: Unacceptable"
    anomaly_detected: bool
    contributing_factors: List[str]


class ConditionAnomalyDetector:
    """Calculates condition health indicators (HI) and ISO 10816-3 vibration zones

    using multi-parameter feature fusion and Mahalanobis statistical distance.
    """

    # ISO 10816-3 Category 2 (Medium machines 15 kW to 300 kW rigid foundation) velocity thresholds [mm/s RMS]:
    ISO_ZONE_A_MAX = 2.3  # Good
    ISO_ZONE_B_MAX = 4.5  # Acceptable
    ISO_ZONE_C_MAX = 7.1  # Warning (restricted operation)
    # Above 7.1 is Zone D: Unacceptable (danger of trip/damage)

    def __init__(self):
        # Baseline reference means and standard deviations for Mahalanobis/Z-score
        self.mean_rms = 1.2
        self.std_rms = 0.3
        self.mean_kurtosis = 3.0
        self.std_kurtosis = 0.4
        self.mean_crest = 3.2
        self.std_crest = 0.5

    def evaluate_condition(
        self,
        features: VibrationFeatures,
        motor_temp_c: float,
        motor_current_a: float,
        rated_current_a: float = 780.0,
        rated_temp_c: float = 85.0,
        avg_joint_damage: float = 0.05,
    ) -> HealthIndicators:
        factors: List[str] = []

        # 1. ISO 10816-3 Classification
        rms_vel = features.rms  # in mm/s
        if rms_vel <= self.ISO_ZONE_A_MAX:
            iso_zone = "A: Good (New machine condition)"
            vib_hi = 100.0 - (rms_vel / self.ISO_ZONE_A_MAX) * 10.0
        elif rms_vel <= self.ISO_ZONE_B_MAX:
            iso_zone = "B: Acceptable (Unrestricted continuous operation)"
            vib_hi = 90.0 - ((rms_vel - self.ISO_ZONE_A_MAX) / (self.ISO_ZONE_B_MAX - self.ISO_ZONE_A_MAX)) * 20.0
        elif rms_vel <= self.ISO_ZONE_C_MAX:
            iso_zone = "C: Warning (Restricted operation, schedule maintenance)"
            vib_hi = 70.0 - ((rms_vel - self.ISO_ZONE_B_MAX) / (self.ISO_ZONE_C_MAX - self.ISO_ZONE_B_MAX)) * 30.0
            factors.append(f"Elevated RMS vibration: {rms_vel:.2f} mm/s (ISO Zone C)")
        else:
            iso_zone = "D: Unacceptable (High risk of damage, trip machine)"
            vib_hi = max(0.0, 40.0 - (rms_vel - self.ISO_ZONE_C_MAX) * 10.0)
            factors.append(f"Critical RMS vibration: {rms_vel:.2f} mm/s (ISO Zone D)")

        # 2. Bearing Specific HI (Kurtosis and Envelope RMS)
        # Normal kurtosis ~3.0. Incipient spall causes kurtosis to rise to 6-12.
        kurt_penalty = max(0.0, (features.kurtosis - 3.2) * 8.0)
        env_penalty = max(0.0, (features.envelope_rms - 0.25) * 40.0)
        bearing_hi = max(0.0, min(100.0, 100.0 - (kurt_penalty + env_penalty)))

        if features.kurtosis > 4.5:
            factors.append(f"Impulsive bearing shock impacts (Kurtosis={features.kurtosis:.1f})")

        # 3. Motor Electrical and Thermal HI
        temp_ratio = motor_temp_c / rated_temp_c
        curr_ratio = motor_current_a / rated_current_a
        temp_penalty = max(0.0, (temp_ratio - 0.8) * 100.0) if temp_ratio > 0.8 else 0.0
        curr_penalty = max(0.0, (curr_ratio - 0.9) * 100.0) if curr_ratio > 0.9 else 0.0
        motor_hi = max(0.0, min(100.0, 100.0 - (temp_penalty + curr_penalty)))

        if temp_ratio > 0.95:
            factors.append(f"Motor thermal elevation: {motor_temp_c:.1f}°C")
        if curr_ratio > 1.05:
            factors.append(f"Motor current overload: {motor_current_a:.1f} A")

        # 4. Joint Overall HI
        joint_overall_hi = max(0.0, 100.0 * (1.0 - avg_joint_damage))

        # 5. Composite Health Index (Weighted)
        composite = 0.35 * vib_hi + 0.25 * bearing_hi + 0.25 * motor_hi + 0.15 * joint_overall_hi

        # 6. Anomaly Trigger (Multi-variate distance)
        z_rms = (features.rms - self.mean_rms) / self.std_rms
        z_kurt = (features.kurtosis - self.mean_kurtosis) / self.std_kurtosis
        z_crest = (features.crest_factor - self.mean_crest) / self.std_crest
        mahalanobis_approx = math.sqrt(z_rms ** 2 + z_kurt ** 2 + z_crest ** 2)

        anomaly_detected = (mahalanobis_approx > 3.5) or (composite < 65.0)

        return HealthIndicators(
            vibration_hi=round(vib_hi, 1),
            bearing_hi=round(bearing_hi, 1),
            motor_hi=round(motor_hi, 1),
            joint_overall_hi=round(joint_overall_hi, 1),
            composite_health_index=round(composite, 1),
            iso_vibration_zone=iso_zone,
            anomaly_detected=anomaly_detected,
            contributing_factors=factors,
        )
