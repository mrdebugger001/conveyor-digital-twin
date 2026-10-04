import math
import pytest
import numpy as np

from app.physics.material_flow import MaterialFlowModel, MaterialFlowState
from app.physics.resistance import ConveyorResistanceModel, ResistanceBreakdown
from app.physics.tension import DistributedTensionModel, TensionState
from app.physics.drive_motor import DriveMotorModel, DriveMotorState
from app.physics.sag import BeltSagModel, SagCalculationResult
from app.physics.joints import JointKinematicsModel, SingleJointState, ConveyorZone
from app.physics.fatigue import SpliceFatigueEngine, StressCycle
from app.physics.residuals import PhysicsResidualEngine, SensorHealthStatus
from app.ml.vibration.features import VibrationFeatureExtractor
from app.ml.vibration.bearing_frequencies import BearingFrequencyCalculator


def test_01_material_flow_continuity():
    """Test Case 1: Eulerian Material flow continuity and linear density."""
    mf = MaterialFlowModel()
    tph = 1200.0
    v = 3.2
    expected_qm = tph / (3.6 * v)  # 104.1667 kg/m
    expected_mdot = tph / 3.6      # 333.333 kg/s

    # Static formula checks
    assert abs(mf.calculate_mass_flow_rate(tph) - expected_mdot) < 1e-4
    assert abs(mf.calculate_linear_mass(tph, v) - expected_qm) < 1e-4

    # Dynamic transient lag filter
    for _ in range(30):
        state = mf.update(target_throughput_tph=tph, belt_speed_m_s=v, dt_s=0.5)

    assert abs(state.linear_mass_qm - expected_qm) < 1.0
    assert abs(state.mass_flow_rate_kg_s - expected_mdot) < 1.0
    assert state.total_material_mass_kg > 30000.0  # Over 30 tonnes inventory


def test_02_din22101_motion_resistance():
    """Test Case 2: DIN 22101 / CEMA primary, secondary, and lift resistance."""
    crm = ConveyorResistanceModel()
    qm = 104.1667
    v = 3.2
    breakdown = crm.calculate(linear_mass_qm=qm, belt_speed_m_s=v, moisture_pct=4.5)

    assert breakdown.main_resistance_n > 0.0
    assert breakdown.secondary_resistance_n > 0.0
    # Lift resistance: F_St = q_m * g * H
    expected_lift = qm * 9.80665 * 14.0  # ~14,301 N
    assert abs(breakdown.lift_resistance_n - expected_lift) < 50.0
    assert breakdown.total_motion_resistance_n > breakdown.lift_resistance_n


def test_03_distributed_tension_integration():
    """Test Case 3: 1D distributed tension integration along continuous loop."""
    dtm = DistributedTensionModel(conveyor_length_m=350.0, total_loop_length_m=720.0)
    qm = 104.1667
    state = dtm.calculate_tension_profile(linear_mass_qm=qm, total_resistance_n=45000.0)

    assert state.t_head_n > state.t_tail_n
    assert len(state.spatial_profile_s_m) == 144
    assert len(state.spatial_tension_n) == 144

    # Spatial interpolation test
    t_tail = dtm.interpolate_tension_at(0.0, state)
    t_head = dtm.interpolate_tension_at(350.0, state)
    assert t_head > t_tail


def test_04_euler_eytelwein_slip_limit():
    """Test Case 4: Euler-Eytelwein drive slip limits and traction margin."""
    dtm = DistributedTensionModel()
    state = dtm.calculate_tension_profile(linear_mass_qm=104.1667, total_resistance_n=45000.0)

    # e^(mu * alpha) for mu=0.38 and alpha=210 deg (3.665 rad) approx 4.026
    expected_euler = math.exp(0.38 * 3.665)
    assert abs(state.euler_limit_ratio - expected_euler) < 0.05
    assert state.traction_margin > 1.15
    assert state.is_slip_warning is False


def test_05_cema_and_catenary_sag():
    """Test Case 5: CEMA parabolic and exact catenary hyperbolic sag."""
    sag_model = BeltSagModel()
    t_safe = 36000.0
    qm = 104.1667
    res = sag_model.calculate_carrying_sag(local_tension_n=t_safe, linear_material_mass_kg_m=qm)

    assert res.cema_sag_m > 0.0
    assert abs(res.cema_sag_m - res.catenary_sag_m) < 0.001  # Match within 1mm
    assert res.sag_percentage < res.allowable_sag_percentage
    assert res.is_sag_exceeded is False


def test_06_motor_electromechanical_and_thermal():
    """Test Case 6: Drive motor conversion and thermal 1st-order ODE."""
    motor = DriveMotorModel()
    te = 45000.0
    v = 3.2

    for _ in range(50):
        state = motor.update(t_effective_n=te, velocity_m_s=v, dt=0.5)

    assert 1400.0 < state.motor_speed_rpm < 1550.0
    assert state.p_elec_kw > state.p_mech_kw
    assert state.motor_current_a > 100.0
    assert state.motor_temperature_c > 32.0


def test_07_joint_kinematics_loop_tracking():
    """Test Case 7: 24 moving splices kinematic position tracking & zones."""
    joints = JointKinematicsModel(num_joints=24, loop_length_m=720.0)
    dtm = DistributedTensionModel()
    t_state = dtm.calculate_tension_profile(linear_mass_qm=104.1667, total_resistance_n=45000.0)

    # Advance belt by 60 meters
    joint_states = joints.calculate_joint_stresses(
        tension_interpolator=dtm.interpolate_tension_at,
        tension_state=t_state,
        speed_m_s=3.0,
        dt_s=20.0,
    )

    assert len(joint_states) == 24
    positions = [j.position_s_m for j in joint_states]
    assert all(0.0 <= p < 720.0 for p in positions)


def test_08_joint_stress_and_concentration():
    """Test Case 8: Multi-axis tensile and pulley bending stress with Kt."""
    joints = JointKinematicsModel()
    dtm = DistributedTensionModel()
    t_state = dtm.calculate_tension_profile(linear_mass_qm=104.1667, total_resistance_n=45000.0)

    joint_states = joints.calculate_joint_stresses(
        tension_interpolator=dtm.interpolate_tension_at,
        tension_state=t_state,
        speed_m_s=3.2,
        dt_s=1.0,
    )

    for j in joint_states:
        assert j.tensile_stress_pa > 0.0
        assert j.total_stress_pa >= j.tensile_stress_pa
        assert j.safety_factor > 1.0


def test_09_fatigue_goodman_and_miner():
    """Test Case 9: Basquin S-N curve, Goodman mean stress, and Palmgren-Miner damage."""
    fatigue = SpliceFatigueEngine()
    cycle = fatigue.evaluate_cycle(sigma_max_pa=14.5e6, sigma_min_pa=3.5e6)

    assert cycle.sigma_range_pa == 11.0e6
    assert cycle.sigma_alt_pa == 5.5e6
    assert cycle.sigma_eq_goodman_pa > cycle.sigma_alt_pa
    assert cycle.allowable_cycles_n > 50000
    assert cycle.damage_increment_d > 0.0


def test_10_residuals_sensor_fault_separation():
    """Test Case 10: Physics residuals separating sensor failure from machine overload."""
    engine = PhysicsResidualEngine()

    # Normal case
    normal_res = engine.evaluate_residuals(
        measured_tension_n=45000.0,
        predicted_tension_n=45100.0,
        measured_power_kw=310.0,
        predicted_power_kw=310.0,
        measured_current_a=415.0,
        predicted_current_a=415.0,
        measured_temp_c=58.0,
        predicted_temp_c=58.0,
        measured_vib_mm_s=1.3,
        predicted_vib_mm_s=1.3,
        belt_speed_m_s=3.2,
    )
    assert len(normal_res.sensor_faults_detected) == 0

    # Sensor disconnect case: current = 0 while power = 310 kW
    fault_res = engine.evaluate_residuals(
        measured_tension_n=45000.0,
        predicted_tension_n=45100.0,
        measured_power_kw=310.0,
        predicted_power_kw=310.0,
        measured_current_a=0.0,
        predicted_current_a=415.0,
        measured_temp_c=58.0,
        predicted_temp_c=58.0,
        measured_vib_mm_s=1.3,
        predicted_vib_mm_s=1.3,
        belt_speed_m_s=3.2,
    )
    assert len(fault_res.sensor_faults_detected) > 0
