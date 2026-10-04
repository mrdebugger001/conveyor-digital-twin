import math
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum


class SensorHealthStatus(str, Enum):
    NORMAL = "NORMAL"
    NOISY = "NOISY"
    STUCK = "STUCK"
    OUT_OF_RANGE = "OUT_OF_RANGE"
    MISSING = "MISSING"
    SENSOR_FAULT = "SENSOR_FAULT"
    MECHANICAL_ANOMALY = "MECHANICAL_ANOMALY"


@dataclass
class ResidualMetric:
    metric_name: str
    unit: str
    measured_value: Optional[float]
    predicted_value: float
    residual: float  # measured - predicted
    normalized_residual_z: float  # residual / std_dev
    health_status: SensorHealthStatus
    fault_hypothesis: str


@dataclass
class TwinResidualState:
    tension_residual: ResidualMetric
    power_residual: ResidualMetric
    current_residual: ResidualMetric
    temperature_residual: ResidualMetric
    vibration_residual: ResidualMetric
    rmse: float
    mae: float
    sensor_faults_detected: List[str]
    mechanical_faults_detected: List[str]


class PhysicsResidualEngine:
    """Computes physics residuals epsilon = y_measured - y_predicted to isolate

    sensor hardware failures (stuck, drifting, out-of-range) from true physical
    machine degradation (jam, bearing seizure, motor overload).
    """

    # Sensor noise standard deviations under normal steady-state operation
    STD_TENSION_N = 2500.0  # ~2.5 kN
    STD_POWER_KW = 12.0  # ~12 kW
    STD_CURRENT_A = 6.0  # ~6 A
    STD_TEMP_C = 1.5  # ~1.5 deg C
    STD_VIB_MM_S = 0.35  # ~0.35 mm/s

    def __init__(self):
        # Rolling window history for stuck-value detection (last 10 samples)
        self.history_tension: List[float] = []
        self.history_power: List[float] = []
        self.history_current: List[float] = []
        self.history_temp: List[float] = []

    def _check_stuck(self, history: List[float], new_val: float, max_len: int = 10) -> bool:
        history.append(new_val)
        if len(history) > max_len:
            history.pop(0)
        if len(history) >= max_len:
            # If standard deviation is virtually zero across 10 samples under running operation
            return bool(np.std(history) < 1.0e-5)
        return False

    def evaluate_residuals(
        self,
        measured_tension_n: Optional[float],
        predicted_tension_n: float,
        measured_power_kw: Optional[float],
        predicted_power_kw: float,
        measured_current_a: Optional[float],
        predicted_current_a: float,
        measured_temp_c: Optional[float],
        predicted_temp_c: float,
        measured_vib_mm_s: Optional[float],
        predicted_vib_mm_s: float,
        belt_speed_m_s: float,
    ) -> TwinResidualState:
        residuals: List[ResidualMetric] = []
        sensor_faults: List[str] = []
        mechanical_faults: List[str] = []

        # 1. Tension Residual
        res_t, z_t, status_t, hyp_t = self._eval_single(
            val_measured=measured_tension_n,
            val_predicted=predicted_tension_n,
            std_dev=self.STD_TENSION_N,
            valid_range=(0.0, 300000.0),
            is_stuck=self._check_stuck(self.history_tension, measured_tension_n if measured_tension_n else 0.0) if belt_speed_m_s > 0.5 else False,
            metric_name="Belt Tension",
        )
        t_metric = ResidualMetric("tension", "N", measured_tension_n, predicted_tension_n, res_t, z_t, status_t, hyp_t)
        residuals.append(t_metric)

        # 2. Motor Power Residual
        res_p, z_p, status_p, hyp_p = self._eval_single(
            val_measured=measured_power_kw,
            val_predicted=predicted_power_kw,
            std_dev=self.STD_POWER_KW,
            valid_range=(0.0, 600.0),
            is_stuck=self._check_stuck(self.history_power, measured_power_kw if measured_power_kw else 0.0) if belt_speed_m_s > 0.5 else False,
            metric_name="Motor Power",
        )
        p_metric = ResidualMetric("power", "kW", measured_power_kw, predicted_power_kw, res_p, z_p, status_p, hyp_p)
        residuals.append(p_metric)

        # 3. Motor Current Residual
        res_i, z_i, status_i, hyp_i = self._eval_single(
            val_measured=measured_current_a,
            val_predicted=predicted_current_a,
            std_dev=self.STD_CURRENT_A,
            valid_range=(0.0, 1000.0),
            is_stuck=self._check_stuck(self.history_current, measured_current_a if measured_current_a else 0.0) if belt_speed_m_s > 0.5 else False,
            metric_name="Motor Current",
        )
        i_metric = ResidualMetric("current", "A", measured_current_a, predicted_current_a, res_i, z_i, status_i, hyp_i)
        residuals.append(i_metric)

        # 4. Temperature Residual
        res_temp, z_temp, status_temp, hyp_temp = self._eval_single(
            val_measured=measured_temp_c,
            val_predicted=predicted_temp_c,
            std_dev=self.STD_TEMP_C,
            valid_range=(-10.0, 160.0),
            is_stuck=self._check_stuck(self.history_temp, measured_temp_c if measured_temp_c else 0.0) if belt_speed_m_s > 0.5 else False,
            metric_name="Motor Temperature",
        )
        temp_metric = ResidualMetric("temperature", "degC", measured_temp_c, predicted_temp_c, res_temp, z_temp, status_temp, hyp_temp)
        residuals.append(temp_metric)

        # 5. Vibration Residual
        res_vib = (measured_vib_mm_s - predicted_vib_mm_s) if measured_vib_mm_s is not None else 0.0
        z_vib = res_vib / self.STD_VIB_MM_S
        status_vib = SensorHealthStatus.NORMAL
        hyp_vib = "Normal vibration levels"
        if measured_vib_mm_s is None:
            status_vib = SensorHealthStatus.MISSING
            hyp_vib = "Vibration sensor telemetry dropped"
        elif measured_vib_mm_s > 15.0 or measured_vib_mm_s < 0.0:
            status_vib = SensorHealthStatus.OUT_OF_RANGE
            hyp_vib = "Sensor saturation or disconnect"
        elif z_vib > 3.0:
            status_vib = SensorHealthStatus.MECHANICAL_ANOMALY
            hyp_vib = "Elevated mechanical vibration (bearing/imbalance)"
        vib_metric = ResidualMetric("vibration", "mm/s", measured_vib_mm_s, predicted_vib_mm_s, res_vib, z_vib, status_vib, hyp_vib)
        residuals.append(vib_metric)

        # Cross-sensor analytical redundancy checks:
        # If Current is 0 or stuck but Power is high and speed > 0 -> Current Sensor Fault!
        if (measured_current_a is not None and measured_current_a < 5.0) and (measured_power_kw is not None and measured_power_kw > 50.0):
            i_metric.health_status = SensorHealthStatus.SENSOR_FAULT
            i_metric.fault_hypothesis = "Current transducer disconnect; power indicates running drive"
            sensor_faults.append("Current transducer sensor fault")

        # If both Power and Current are elevated together (e.g. +3 sigma) but tension is also high -> true mechanical resistance overload
        if z_p > 2.5 and z_i > 2.5:
            p_metric.health_status = SensorHealthStatus.MECHANICAL_ANOMALY
            i_metric.health_status = SensorHealthStatus.MECHANICAL_ANOMALY
            mechanical_faults.append("Drive electrical overload matching high mechanical resistance")

        for m in residuals:
            if m.health_status in (SensorHealthStatus.SENSOR_FAULT, SensorHealthStatus.STUCK, SensorHealthStatus.OUT_OF_RANGE):
                if m.fault_hypothesis not in sensor_faults:
                    sensor_faults.append(f"{m.metric_name}: {m.fault_hypothesis}")
            elif m.health_status == SensorHealthStatus.MECHANICAL_ANOMALY:
                if m.fault_hypothesis not in mechanical_faults:
                    mechanical_faults.append(f"{m.metric_name}: {m.fault_hypothesis}")

        # Compute summary RMSE and MAE across available continuous metrics
        valid_z = [abs(m.normalized_residual_z) for m in residuals if m.measured_value is not None]
        mae = float(np.mean(valid_z)) if valid_z else 0.0
        rmse = float(np.sqrt(np.mean([z ** 2 for z in valid_z]))) if valid_z else 0.0

        return TwinResidualState(
            tension_residual=t_metric,
            power_residual=p_metric,
            current_residual=i_metric,
            temperature_residual=temp_metric,
            vibration_residual=vib_metric,
            rmse=round(rmse, 3),
            mae=round(mae, 3),
            sensor_faults_detected=sensor_faults,
            mechanical_faults_detected=mechanical_faults,
        )

    def _eval_single(
        self,
        val_measured: Optional[float],
        val_predicted: float,
        std_dev: float,
        valid_range: tuple,
        is_stuck: bool,
        metric_name: str,
    ) -> tuple:
        if val_measured is None:
            return 0.0, 0.0, SensorHealthStatus.MISSING, f"{metric_name} data missing"

        if val_measured < valid_range[0] or val_measured > valid_range[1]:
            return (
                val_measured - val_predicted,
                (val_measured - val_predicted) / std_dev,
                SensorHealthStatus.OUT_OF_RANGE,
                f"{metric_name} reading outside hardware limit [{valid_range[0]}, {valid_range[1]}]",
            )

        if is_stuck:
            return (
                val_measured - val_predicted,
                (val_measured - val_predicted) / std_dev,
                SensorHealthStatus.STUCK,
                f"{metric_name} transducer frozen/stuck constant value",
            )

        residual = val_measured - val_predicted
        z = residual / std_dev

        if abs(z) <= 2.0:
            return residual, z, SensorHealthStatus.NORMAL, "Healthy within 2-sigma noise band"
        elif abs(z) <= 3.0:
            return residual, z, SensorHealthStatus.NOISY, "Slight deviation within 3-sigma"
        else:
            return residual, z, SensorHealthStatus.MECHANICAL_ANOMALY, f"Significant model discrepancy (|Z|={abs(z):.1f})"
