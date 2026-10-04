import asyncio
import math
import random
from collections import deque
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import numpy as np

from app import config
from app.schemas.twin import ConveyorState, JointState, MotorState, JointSpatialMarker
from app.twin.state_store import twin_store
from app.twin.fault_injection import apply_faults
from app.ml.rule_based_health import JointReading, joint_risk_score, joint_health, joint_status
from app.alarms.engine import alarm_engine

# Import First-Principles Physics & Calibrated Data Engines
from app.physics.material_flow import MaterialFlowModel
from app.physics.resistance import ConveyorResistanceModel
from app.physics.tension import DistributedTensionModel
from app.physics.drive_motor import DriveMotorModel
from app.physics.sag import BeltSagModel
from app.physics.joints import JointKinematicsModel
from app.physics.fatigue import SpliceFatigueEngine
from app.physics.residuals import PhysicsResidualEngine, SensorHealthStatus
from app.ml.vibration.features import VibrationFeatureExtractor
from app.ml.vibration.anomaly import ConditionAnomalyDetector
from app.ml.vibration.bearing_frequencies import BearingFrequencyCalculator
from app.data.cwru_loader import CWRULoader
from app.data.common_schema import EquipmentHealthCondition

_tick = 0

# Instantiate Physics Subsystems
_material_flow = MaterialFlowModel()
_resistance_model = ConveyorResistanceModel()
_tension_model = DistributedTensionModel()
_drive_motor = DriveMotorModel()
_sag_model = BeltSagModel()
_joints_model = JointKinematicsModel()
_fatigue_engine = SpliceFatigueEngine()
_residuals_engine = PhysicsResidualEngine()

# Vibration ML & Diagnostic Engines
_vib_extractor = VibrationFeatureExtractor(sample_rate_hz=10000.0)
_anomaly_detector = ConditionAnomalyDetector()
_bearing_calc = BearingFrequencyCalculator()
_cwru_loader = CWRULoader()

# Circular telemetry history buffer for charts
_telemetry_history = deque(maxlen=200)


def _init_telemetry_history():
    now = datetime.now(timezone.utc)
    for i in range(60):
        t_past = now - timedelta(seconds=(60 - i) * 2)
        _telemetry_history.append({
            "ts": t_past.isoformat(),
            "speed": 3.2,
            "tension": 142.0,
            "tracking": 0.0,
            "load": 75.0,
            "ore_flow": 1200.0,
            "coal_flow": 1200.0,
            "linear_mass_qm": 104.2,
            "peak_stress_mpa": 12.8,
            "avg_stress_mpa": 10.6,
            "belt_sag_mm": 14.2,
            "motor_temperature": 58.0,
            "motor_vibration": 1.3,
            "motor_power": 310.0,
            "joints": {
                f"J{j:03d}": {
                    "vibration": 4.8 if j == 23 else 1.4,
                    "temperature": 68.0 if j == 23 else 56.0,
                    "tension": 160.0 if j == 23 else 140.0,
                    "stress_mpa": 14.6 if j == 23 else 10.5,
                    "load_kn": 1.52,
                    "dynamic_sag_mm": 16.5 if j == 23 else 13.8,
                    "miner_damage": 0.79 if j == 23 else (0.15 + j * 0.01),
                    "health": 52.0 if j == 23 else 96.0,
                }
                for j in range(1, config.NUM_JOINTS + 1)
            },
        })


_init_telemetry_history()


def get_telemetry_history(asset_id: str, metric: str, points: int = 60) -> list:
    """Return actual time series recorded by the live simulation engine."""
    history_list = list(_telemetry_history)
    selected = history_list[-points:] if points < len(history_list) else history_list
    results = []

    clean_id = asset_id.replace("joint-", "")
    is_joint = clean_id.startswith("J")
    is_motor = asset_id == "motor-M01"

    for entry in selected:
        val = 0.0
        if is_joint and clean_id in entry.get("joints", {}):
            val = entry["joints"][clean_id].get(metric, 0.0)
        elif is_motor:
            if metric in ("vibration", "motor_vibration"):
                val = entry.get("motor_vibration", 0.0)
            elif metric in ("temperature", "motor_temperature"):
                val = entry.get("motor_temperature", 0.0)
            elif metric in ("power", "motor_power"):
                val = entry.get("motor_power", 0.0)
        else:
            if metric == "speed":
                val = entry.get("speed", 0.0)
            elif metric == "tension":
                val = entry.get("tension", 0.0)
            elif metric == "vibration":
                val = entry.get("motor_vibration", 0.0)
            elif metric in ("temperature", "motor_temperature"):
                val = entry.get("motor_temperature", 0.0)
            elif metric == "load":
                val = entry.get("load", 0.0)
            elif metric in ("coal_flow", "ore_flow"):
                val = entry.get("coal_flow", entry.get("ore_flow", 0.0))
            elif metric == "linear_mass_qm":
                val = entry.get("linear_mass_qm", 0.0)
            elif metric == "peak_stress_mpa":
                val = entry.get("peak_stress_mpa", 0.0)
            elif metric == "belt_sag_mm":
                val = entry.get("belt_sag_mm", 0.0)
            elif metric == "tracking":
                val = entry.get("tracking", 0.0)
        results.append({"ts": entry["ts"], "value": round(val, 2)})
    return results


def _compute_fea_color(stress_mpa: float) -> str:
    """Multi-spectral rainbow heatmap shader color code based on stress in MPa."""
    if stress_mpa < 8.5:
        return "#1E88E5"  # Low stress deep blue
    elif stress_mpa < 10.5:
        return "#00E5FF"  # Nominal electric cyan
    elif stress_mpa < 12.8:
        return "#00E676"  # Safe operational green
    elif stress_mpa < 14.5:
        return "#FFD600"  # Approaching warning amber
    else:
        return "#FF1744"  # Critical stress crimson / peel failure risk


async def run_simulation_loop(broadcast_fn):
    """Main async digital twin simulation loop executing First-Principles Physics

    (DIN 22101 / CEMA), 1D Distributed Tension Profile, 24 Joint Kinematics,
    Motor Electromechanical/Thermal ODEs, Residual Anomaly Detection, and CWRU-calibrated Vibration ML.
    """
    global _tick
    _tick = 0
    speed = 0.0
    belt_health = 96.0

    # Initialize joint damage offset (J023 historically stressed)
    _joints_model.inject_joint_damage("J023", added_damage=0.45)

    while True:
        await asyncio.sleep(config.TICK_INTERVAL)
        _tick += 1
        t = _tick * config.TICK_INTERVAL
        dt = config.TICK_INTERVAL

        # --- 1. Get control inputs & store settings ---
        run_cmd, estop = await twin_store.get_run_command()
        target_speed = await twin_store.get_target_speed()
        fault = await twin_store.get_fault_config()
        smart_throttle_enabled, _, _ = await twin_store.get_smart_throttle_status()
        target_coal_tph, moisture_pct = await twin_store.get_coal_feed()
        sandbox_overrides = await twin_store.get_sandbox_overrides()

        # Apply sandbox overrides if currently testing what-if scenario
        if sandbox_overrides:
            target_coal_tph = sandbox_overrides.get("coal_tph", target_coal_tph)
            moisture_pct = sandbox_overrides.get("moisture_pct", moisture_pct)
            target_speed = sandbox_overrides.get("belt_speed", target_speed)

        # --- 2. Determine Conveyor Run State ---
        if estop:
            run_state = "FAULTED"
            effective_target_speed = 0.0
        elif run_cmd == "START":
            run_state = "RUNNING" if speed > 0.05 else "STARTING"
            effective_target_speed = target_speed
        elif run_cmd == "STOP":
            run_state = "STOPPING" if speed > 0.05 else "STOPPED"
            effective_target_speed = 0.0
        else:
            run_state = "STOPPED"
            effective_target_speed = 0.0

        # --- 3. First-Order Lag On Velocity ---
        prev_speed = speed
        speed += (effective_target_speed - speed) * config.BELT_SPEED_LAG
        speed = max(0.0, min(config.BELT_MAX_SPEED, speed))
        if speed < 0.01:
            speed = 0.0
        accel_m_s2 = (speed - prev_speed) / dt

        # --- 4. Material Flow Physics (Eulerian Continuity) ---
        target_feed = target_coal_tph if run_state in ("RUNNING", "STARTING") else 0.0
        mf_state = _material_flow.update(
            target_throughput_tph=target_feed,
            belt_speed_m_s=speed,
            dt_s=dt,
            lump_fraction=0.15,
        )
        linear_mass_qm = mf_state.linear_mass_kg_m
        actual_coal_tph = mf_state.actual_throughput_tph

        # --- 5. DIN 22101 / CEMA Motion Resistance ---
        res_breakdown = _resistance_model.calculate(
            linear_mass_qm=linear_mass_qm,
            belt_speed_m_s=speed,
            moisture_pct=moisture_pct,
            acceleration_m_s2=accel_m_s2,
        )
        total_resistance_N = res_breakdown.total_motion_resistance_n
        effective_f = res_breakdown.effective_friction_factor

        # --- 6. 1D Distributed Tension Profile & Euler-Eytelwein Drive Limits ---
        tension_state = _tension_model.calculate_tension_profile(
            linear_mass_qm=linear_mass_qm,
            total_resistance_n=total_resistance_N,
            acceleration_m_s2=accel_m_s2,
            effective_f=effective_f,
        )
        dynamic_head_tension_kN = tension_state.t_head_n / 1000.0
        cema_head_tension_kN = dynamic_head_tension_kN
        t_slack_kN = tension_state.t_tail_n / 1000.0

        # --- 7. Motor Electromechanical & 1st-Order Thermal ODE ---
        motor_dyn = _drive_motor.update(
            effective_tension_n=tension_state.t_effective_n,
            belt_speed_m_s=speed,
            dt_s=dt,
        )
        motor_power_kW = motor_dyn.p_elec_kw
        motor_current_A = motor_dyn.motor_current_a
        motor_temp_c = motor_dyn.motor_temperature_c
        motor_rpm = motor_dyn.motor_speed_rpm

        # Motor status
        motor_status = "RUNNING" if run_state in ("RUNNING", "STARTING") else "STOPPED"
        if motor_temp_c > config.TEMP_WARNING_MAX + config.TEMP_CRITICAL_SPAN:
            motor_status = "CRITICAL"
        elif motor_temp_c > config.TEMP_WARNING_MAX:
            motor_status = "WARNING"

        # Baseline vibration
        base_vib = 1.2 + (motor_power_kW / 450.0) * 0.8 if speed > 0.05 else 0.2

        motor = MotorState(
            id="M01",
            rpm=round(motor_rpm, 1),
            temperature=round(motor_temp_c, 1),
            vibration=round(base_vib, 2),
            current=round(motor_current_A, 1),
            power=round(motor_power_kW, 1),
            status=motor_status,
        )

        # --- 8. Catenary Sag Calculation ---
        sag_result = _sag_model.calculate_carrying_sag(
            local_tension_n=tension_state.t_tail_n,
            linear_material_mass_kg_m=linear_mass_qm,
        )
        overall_sag_mm = sag_result.cema_sag_m * 1000.0

        # --- 9. 24 Joint Moving Kinematics & Stress Engine ---
        joint_states_list = _joints_model.calculate_joint_stresses(
            tension_interpolator=_tension_model.interpolate_tension_at,
            tension_state=tension_state,
            speed_m_s=speed,
            dt_s=dt,
        )

        # Map into JointState dictionary for frontend
        joint_health_map: Dict[str, JointState] = {}
        spatial_markers: List[JointSpatialMarker] = []
        all_stresses = []
        peak_joint_stress = 0.0

        for js in joint_states_list:
            jid = js.id
            is_j023 = (jid == "J023")
            stress_mpa = js.total_stress_pa / 1.0e6
            all_stresses.append(stress_mpa)
            if stress_mpa > peak_joint_stress:
                peak_joint_stress = stress_mpa

            # Dynamic normal reaction on idler station [kN]
            normal_joint_load_kN = ((config.BELT_LINEAR_MASS_QB + linear_mass_qm) * 9.80665 * config.IDLER_SPACING_A0) / 1000.0

            # Dynamic local sag at splice position [mm]
            local_sag = _sag_model.calculate_carrying_sag(
                local_tension_n=js.local_tension_n,
                linear_material_mass_kg_m=linear_mass_qm,
            )
            local_sag_mm = local_sag.cema_sag_m * 1000.0

            # Vibration and temperature per joint
            jv = (4.8 if is_j023 else 1.4) + math.sin(t * 0.08 + js.index * 0.3) * 0.25
            jtemp = (68.5 if is_j023 else 56.0) + math.sin(t * 0.04 + js.index * 0.2) * 1.5

            reading = JointReading(
                tension=js.local_tension_n / 1000.0,
                vibration=jv,
                temperature=jtemp,
                tracking_deviation=0.0,
                stress_mpa=stress_mpa,
                miner_damage=js.cumulative_damage_d,
            )
            risk, _ = joint_risk_score(reading)
            jh = max(0.0, min(100.0, js.health_pct))
            jstatus = joint_status(jh)

            joint_health_map[jid] = JointState(
                id=jid,
                health=round(jh, 1),
                temperature=round(jtemp, 1),
                vibration=round(jv, 2),
                tension=round(js.local_tension_n / 1000.0, 1),
                stress_mpa=round(stress_mpa, 2),
                load_kn=round(normal_joint_load_kN, 2),
                dynamic_sag_mm=round(local_sag_mm, 1),
                miner_damage=round(js.cumulative_damage_d, 4),
                fea_color=_compute_fea_color(stress_mpa),
                status=jstatus,
                failure_probability=round(risk, 3),
            )

            spatial_markers.append(JointSpatialMarker(
                id=jid,
                position_s_m=js.position_s_m,
                tension_kn=round(js.local_tension_n / 1000.0, 1),
                zone=js.zone.value,
                total_stress_mpa=round(stress_mpa, 2),
                tensile_stress_mpa=round(js.tensile_stress_pa / 1.0e6, 2),
                bending_stress_mpa=round(js.bending_stress_pa / 1.0e6, 2),
                safety_factor=round(js.safety_factor, 2),
                health_pct=round(jh, 1),
                cumulative_damage_d=round(js.cumulative_damage_d, 4),
                cycles_completed=js.cycles_completed,
            ))

        avg_stress_mpa = sum(all_stresses) / len(all_stresses) if all_stresses else 10.5

        # Tracking deviation
        tracking = math.sin(t * 0.05) * 0.8

        # --- 10. Closed-Loop AI Smart Throttle Logic ---
        smart_throttle_active = False
        derate_pct = 0.0
        if smart_throttle_enabled and run_state == "RUNNING":
            if peak_joint_stress > config.SMART_THROTTLE_STRESS_TRIGGER_MPA:
                smart_throttle_active = True
                excess = peak_joint_stress - config.SMART_THROTTLE_STRESS_TRIGGER_MPA
                derate_pct = min(config.SMART_THROTTLE_MAX_DERATE_PCT, 12.0 + excess * 10.0)
                effective_speed_cap = config.BELT_MAX_SPEED * (1.0 - derate_pct / 100.0)
                if speed > effective_speed_cap:
                    speed = max(effective_speed_cap, speed - 0.04)

        await twin_store.update_smart_throttle_status(smart_throttle_active, round(derate_pct, 1))

        # --- 11. Build Conveyor State Dict ---
        conveyor_load_pct = min(100.0, (actual_coal_tph / config.COAL_NORMAL_TPH) * 100.0)
        state_dict = {
            "id": "C01",
            "run_state": run_state,
            "speed": round(speed, 3),
            "target_speed": round(target_speed, 3),
            "load": round(conveyor_load_pct, 1),
            "ore_flow": round(actual_coal_tph, 1),
            "coal_flow": round(actual_coal_tph, 1),
            "linear_mass_qm": round(linear_mass_qm, 1),
            "tension": round(dynamic_head_tension_kN, 1),
            "cema_head_tension": round(cema_head_tension_kN, 1),
            "cema_slack_tension": round(t_slack_kN, 1),
            "belt_sag_mm": round(overall_sag_mm, 1),
            "peak_stress_mpa": round(peak_joint_stress, 2),
            "avg_stress_mpa": round(avg_stress_mpa, 2),
            "tracking": round(tracking, 2),
            "belt_health": round(max(0.0, min(100.0, belt_health)), 1),
            "joint_health": {k: v.model_dump(by_alias=False) for k, v in joint_health_map.items()},
            "motor": motor.model_dump(by_alias=False),
            "mode": "SIMULATION",
            "moisture_pct": round(moisture_pct, 1),
            "smart_throttle_enabled": smart_throttle_enabled,
            "smart_throttle_active": smart_throttle_active,
            "smart_throttle_derate_pct": round(derate_pct, 1),
            "updated_at": datetime.now(timezone.utc),
        }

        # Apply fault injection perturbations
        state_dict = apply_faults(state_dict, fault, _tick)

        # Re-evaluate Joint State After Fault Injections
        for jid, j_data in state_dict["joint_health"].items():
            if fault.high_tension:
                j_data["tension"] = min(220.0, j_data["tension"] + 25.0)
                j_data["stress_mpa"] = round((j_data["tension"] * 1000.0 / 25200.0) + 5.5 + 2.0, 2)
            if fault.joint_damage_enabled and fault.joint_damage_id == jid:
                j_data["stress_mpa"] = min(19.5, j_data["stress_mpa"] + 4.2)
                j_data["miner_damage"] = min(0.98, j_data["miner_damage"] + 0.15)

            reading = JointReading(
                tension=j_data["tension"],
                vibration=j_data["vibration"],
                temperature=j_data["temperature"],
                tracking_deviation=state_dict["tracking"],
                stress_mpa=j_data["stress_mpa"],
                miner_damage=j_data["miner_damage"],
            )
            risk, _ = joint_risk_score(reading)
            jh = joint_health(reading)
            jstatus = joint_status(jh)
            j_data["health"] = round(jh, 1)
            j_data["status"] = jstatus
            j_data["failure_probability"] = round(risk, 3)
            j_data["fea_color"] = _compute_fea_color(j_data["stress_mpa"])

        post_fault_peaks = [j["stress_mpa"] for j in state_dict["joint_health"].values()]
        if post_fault_peaks:
            state_dict["peak_stress_mpa"] = round(max(post_fault_peaks), 2)
            state_dict["avg_stress_mpa"] = round(sum(post_fault_peaks) / len(post_fault_peaks), 2)

        conveyor_state = ConveyorState(**state_dict)
        await twin_store.set_state(conveyor_state)

        # --- 12. Physics Residuals Evaluation ---
        # Measured vs Physics-Predicted
        meas_tension = conveyor_state.tension * 1000.0
        meas_power = conveyor_state.motor.power
        meas_current = conveyor_state.motor.current
        meas_temp = conveyor_state.motor.temperature
        meas_vib = conveyor_state.motor.vibration

        pred_tension = tension_state.t_head_n
        pred_power = motor_power_kW
        pred_current = motor_current_A
        pred_temp = motor_temp_c
        pred_vib = 1.2 + (motor_power_kW / 450.0) * 0.8 if speed > 0.05 else 0.2

        residual_state = _residuals_engine.evaluate_residuals(
            measured_tension_n=meas_tension,
            predicted_tension_n=pred_tension,
            measured_power_kw=meas_power,
            predicted_power_kw=pred_power,
            measured_current_a=meas_current,
            predicted_current_a=pred_current,
            measured_temp_c=meas_temp,
            predicted_temp_c=pred_temp,
            measured_vib_mm_s=meas_vib,
            predicted_vib_mm_s=pred_vib,
            belt_speed_m_s=speed,
        )

        # --- 13. Vibration ML & Diagnostic Feature Extraction ---
        # Synthesize CWRU-calibrated high-frequency burst for ML inference
        vib_cond = EquipmentHealthCondition.OUTER_RACE_FAULT if fault.bearing_failure else EquipmentHealthCondition.HEALTHY
        sample_burst = _cwru_loader.load_burst(
            condition=vib_cond,
            rpm=motor_rpm,
            load_pct=conveyor_load_pct,
            duration_s=0.2,
        )
        vib_features = _vib_extractor.extract_features(np.array(sample_burst.time_series_data))
        health_indicators = _anomaly_detector.evaluate_condition(
            features=vib_features,
            motor_temp_c=meas_temp,
            motor_current_a=meas_current,
        )
        char_freqs = _bearing_calc.calculate(motor_rpm)

        # Store full tension profile and physics state in twin_store
        tension_profile_dict = {
            "total_length_m": 720.0,
            "head_tension_kn": round(dynamic_head_tension_kN, 1),
            "slack_tension_kn": round(t_slack_kN, 1),
            "effective_tension_kn": round(tension_state.t_effective_n / 1000.0, 1),
            "traction_margin": round(tension_state.traction_margin, 2),
            "is_slip_warning": tension_state.is_slip_warning,
            "spatial_s_m": [round(s, 1) for s in tension_state.spatial_profile_s_m],
            "tension_kn": [round(tn / 1000.0, 2) for tn in tension_state.spatial_tension_n],
            "joints": [m.model_dump(by_alias=False) for m in spatial_markers],
        }

        residual_state_dict = {
            "tension": {
                "metric_name": residual_state.tension_residual.metric_name,
                "unit": residual_state.tension_residual.unit,
                "measured_value": round(residual_state.tension_residual.measured_value, 1) if residual_state.tension_residual.measured_value else None,
                "predicted_value": round(residual_state.tension_residual.predicted_value, 1),
                "residual": round(residual_state.tension_residual.residual, 1),
                "normalized_residual_z": round(residual_state.tension_residual.normalized_residual_z, 2),
                "health_status": residual_state.tension_residual.health_status.value,
                "fault_hypothesis": residual_state.tension_residual.fault_hypothesis,
            },
            "power": {
                "metric_name": residual_state.power_residual.metric_name,
                "unit": residual_state.power_residual.unit,
                "measured_value": round(residual_state.power_residual.measured_value, 1) if residual_state.power_residual.measured_value else None,
                "predicted_value": round(residual_state.power_residual.predicted_value, 1),
                "residual": round(residual_state.power_residual.residual, 1),
                "normalized_residual_z": round(residual_state.power_residual.normalized_residual_z, 2),
                "health_status": residual_state.power_residual.health_status.value,
                "fault_hypothesis": residual_state.power_residual.fault_hypothesis,
            },
            "current": {
                "metric_name": residual_state.current_residual.metric_name,
                "unit": residual_state.current_residual.unit,
                "measured_value": round(residual_state.current_residual.measured_value, 1) if residual_state.current_residual.measured_value else None,
                "predicted_value": round(residual_state.current_residual.predicted_value, 1),
                "residual": round(residual_state.current_residual.residual, 1),
                "normalized_residual_z": round(residual_state.current_residual.normalized_residual_z, 2),
                "health_status": residual_state.current_residual.health_status.value,
                "fault_hypothesis": residual_state.current_residual.fault_hypothesis,
            },
            "temperature": {
                "metric_name": residual_state.temperature_residual.metric_name,
                "unit": residual_state.temperature_residual.unit,
                "measured_value": round(residual_state.temperature_residual.measured_value, 1) if residual_state.temperature_residual.measured_value else None,
                "predicted_value": round(residual_state.temperature_residual.predicted_value, 1),
                "residual": round(residual_state.temperature_residual.residual, 1),
                "normalized_residual_z": round(residual_state.temperature_residual.normalized_residual_z, 2),
                "health_status": residual_state.temperature_residual.health_status.value,
                "fault_hypothesis": residual_state.temperature_residual.fault_hypothesis,
            },
            "vibration": {
                "metric_name": residual_state.vibration_residual.metric_name,
                "unit": residual_state.vibration_residual.unit,
                "measured_value": round(residual_state.vibration_residual.measured_value, 2) if residual_state.vibration_residual.measured_value else None,
                "predicted_value": round(residual_state.vibration_residual.predicted_value, 2),
                "residual": round(residual_state.vibration_residual.residual, 2),
                "normalized_residual_z": round(residual_state.vibration_residual.normalized_residual_z, 2),
                "health_status": residual_state.vibration_residual.health_status.value,
                "fault_hypothesis": residual_state.vibration_residual.fault_hypothesis,
            },
            "rmse": residual_state.rmse,
            "mae": residual_state.mae,
            "sensor_faults_detected": residual_state.sensor_faults_detected,
            "mechanical_faults_detected": residual_state.mechanical_faults_detected,
        }

        vibration_analytics_dict = {
            "rms": vib_features.rms,
            "peak": vib_features.peak,
            "crest_factor": vib_features.crest_factor,
            "kurtosis": vib_features.kurtosis,
            "spectral_centroid_hz": vib_features.spectral_centroid_hz,
            "envelope_rms": vib_features.envelope_rms,
            "iso_zone": health_indicators.iso_vibration_zone,
            "vibration_hi": health_indicators.vibration_hi,
            "bearing_hi": health_indicators.bearing_hi,
            "motor_hi": health_indicators.motor_hi,
            "composite_health_index": health_indicators.composite_health_index,
            "anomaly_detected": health_indicators.anomaly_detected,
            "contributing_factors": health_indicators.contributing_factors,
            "bearing_frequencies_hz": {
                "ftf_cage": char_freqs.ftf_cage_hz,
                "bpfo_outer": char_freqs.bpfo_outer_race_hz,
                "bpfi_inner": char_freqs.bpfi_inner_race_hz,
                "bsf_roller": char_freqs.bsf_ball_spin_hz,
            },
        }

        await twin_store.set_physics_profile(
            tension_profile=tension_profile_dict,
            residual_state=residual_state_dict,
            vibration_analytics=vibration_analytics_dict,
        )

        # Record into rolling history buffer
        if _tick % 2 == 0:
            _telemetry_history.append({
                "ts": conveyor_state.updated_at.isoformat(),
                "speed": conveyor_state.speed,
                "tension": conveyor_state.tension,
                "tracking": conveyor_state.tracking,
                "load": conveyor_state.load,
                "ore_flow": conveyor_state.ore_flow,
                "coal_flow": conveyor_state.coal_flow,
                "linear_mass_qm": conveyor_state.linear_mass_qm,
                "peak_stress_mpa": conveyor_state.peak_stress_mpa,
                "avg_stress_mpa": conveyor_state.avg_stress_mpa,
                "belt_sag_mm": conveyor_state.belt_sag_mm,
                "motor_temperature": conveyor_state.motor.temperature,
                "motor_vibration": conveyor_state.motor.vibration,
                "motor_power": conveyor_state.motor.power,
                "joints": {
                    jid: {
                        "vibration": j.vibration,
                        "temperature": j.temperature,
                        "tension": j.tension,
                        "stress_mpa": j.stress_mpa,
                        "load_kn": j.load_kn,
                        "dynamic_sag_mm": j.dynamic_sag_mm,
                        "miner_damage": j.miner_damage,
                        "health": j.health,
                    }
                    for jid, j in conveyor_state.joint_health.items()
                },
            })

        # --- 14. Run Alarm Engine ---
        new_alarms = await alarm_engine.evaluate(conveyor_state)

        # --- 15. Broadcast State to WebSocket Clients ---
        await broadcast_fn(conveyor_state, new_alarms)
