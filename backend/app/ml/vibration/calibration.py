import numpy as np
from typing import Dict, List, Tuple, Optional
from scipy.optimize import minimize
from dataclasses import dataclass


@dataclass
class CalibrationResult:
    parameter_name: str
    nominal_value: float
    calibrated_value: float
    unit: str
    rmse_before: float
    rmse_after: float
    improvement_pct: float


class ModelCalibrator:
    """Calibrates physics parameters (DIN 22101 friction factor f, motor thermal resistance R_th)

    against empirical datasets and site telemetry.
    """

    @staticmethod
    def calibrate_friction_factor(
        measured_speeds_m_s: np.ndarray,
        measured_tph: np.ndarray,
        measured_motor_power_kw: np.ndarray,
        conveyor_length_m: float = 350.0,
        lift_height_m: float = 14.0,
        belt_mass_kg_m: float = 24.5,
        carrying_idler_mass_kg_m: float = 15.0,
        return_idler_mass_kg_m: float = 2.83,
        drive_efficiency: float = 0.88,
        initial_f: float = 0.020,
    ) -> CalibrationResult:
        """Calibrates the DIN 22101 global friction factor f by minimizing least-squares power prediction error."""
        g = 9.80665
        sin_theta = lift_height_m / conveyor_length_m
        cos_theta = np.cos(np.arcsin(sin_theta))

        def predict_power(f_val: float) -> np.ndarray:
            powers_kw = []
            for v, tph in zip(measured_speeds_m_s, measured_tph):
                qm = tph / (3.6 * max(0.1, v))
                q_carry = belt_mass_kg_m + carrying_idler_mass_kg_m + qm
                q_return = belt_mass_kg_m + return_idler_mass_kg_m

                f_h = f_val * conveyor_length_m * g * (q_carry * cos_theta + q_return * cos_theta)
                f_st = qm * g * lift_height_m
                f_sec = 0.08 * f_h
                f_u = f_h + f_sec + f_st

                p_mech_w = f_u * v
                p_elec_kw = (p_mech_w / drive_efficiency) / 1000.0
                powers_kw.append(p_elec_kw)
            return np.array(powers_kw)

        def objective(f_val: float) -> float:
            pred = predict_power(f_val[0])
            return float(np.mean((pred - measured_motor_power_kw) ** 2))

        # Initial RMSE
        pred_init = predict_power(initial_f)
        rmse_before = float(np.sqrt(np.mean((pred_init - measured_motor_power_kw) ** 2)))

        res = minimize(objective, [initial_f], bounds=[(0.010, 0.040)], method="L-BFGS-B")
        calibrated_f = float(res.x[0])

        pred_opt = predict_power(calibrated_f)
        rmse_after = float(np.sqrt(np.mean((pred_opt - measured_motor_power_kw) ** 2)))
        improvement = ((rmse_before - rmse_after) / max(1.0e-4, rmse_before)) * 100.0

        return CalibrationResult(
            parameter_name="din22101_friction_factor_f",
            nominal_value=initial_f,
            calibrated_value=round(calibrated_f, 5),
            unit="dimensionless",
            rmse_before=round(rmse_before, 3),
            rmse_after=round(rmse_after, 3),
            improvement_pct=round(max(0.0, improvement), 2),
        )

    @staticmethod
    def calibrate_thermal_resistance(
        measured_loss_power_w: np.ndarray,
        measured_temp_c: np.ndarray,
        ambient_temp_c: float = 32.0,
        initial_r_th: float = 0.00018,
    ) -> CalibrationResult:
        """Calibrates steady-state motor thermal resistance R_th: Delta_T = P_loss * R_th."""
        delta_t_meas = measured_temp_c - ambient_temp_c

        def objective(r_val: float) -> float:
            pred_delta = measured_loss_power_w * r_val[0]
            return float(np.mean((pred_delta - delta_t_meas) ** 2))

        rmse_before = float(np.sqrt(np.mean((measured_loss_power_w * initial_r_th - delta_t_meas) ** 2)))
        res = minimize(objective, [initial_r_th], bounds=[(0.00005, 0.00050)], method="L-BFGS-B")
        calibrated_r = float(res.x[0])
        rmse_after = float(np.sqrt(np.mean((measured_loss_power_w * calibrated_r - delta_t_meas) ** 2)))

        improvement = ((rmse_before - rmse_after) / max(1.0e-4, rmse_before)) * 100.0

        return CalibrationResult(
            parameter_name="motor_thermal_resistance_Rth",
            nominal_value=initial_r_th,
            calibrated_value=round(calibrated_r, 6),
            unit="K/W",
            rmse_before=round(rmse_before, 3),
            rmse_after=round(rmse_after, 3),
            improvement_pct=round(max(0.0, improvement), 2),
        )
