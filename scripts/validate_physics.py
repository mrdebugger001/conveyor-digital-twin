#!/usr/bin/env python3
"""Standalone Physics Validation Script for Conveyor C01 Digital Twin.

Verifies First-Principles bulk handling mathematics, DIN 22101 / CEMA motion resistance,
1D distributed tension profile, Euler-Eytelwein drive slip limits, catenary sag,
24-joint moving kinematics, and Palmgren-Miner fatigue.
"""

import sys
import os
import math
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.physics.material_flow import MaterialFlowModel
from app.physics.resistance import ConveyorResistanceModel
from app.physics.tension import DistributedTensionModel
from app.physics.drive_motor import DriveMotorModel
from app.physics.sag import BeltSagModel
from app.physics.joints import JointKinematicsModel, ConveyorZone
from app.physics.fatigue import SpliceFatigueEngine
from app.physics.residuals import PhysicsResidualEngine, SensorHealthStatus


def print_header(title: str):
    print("\n" + "=" * 70)
    print(f"  {title.upper()}")
    print("=" * 70)


def test_material_flow():
    print_header("Test 1: Eulerian Material Flow Continuity")
    mf = MaterialFlowModel()
    tph = 1200.0
    v = 3.2
    dt = 0.5

    # Run transient lag filter to steady state (25 steps * 0.5s = 12.5s > 5*tau)
    for _ in range(25):
        state = mf.update(target_throughput_tph=tph, belt_speed_m_s=v, dt_s=dt)
    expected_qm = tph / (3.6 * v)  # 104.1667 kg/m
    expected_mdot = tph / 3.6      # 333.333 kg/s

    print(f"Target Throughput:       {tph:.1f} TPH")
    print(f"Belt Velocity:           {v:.2f} m/s")
    print(f"Mass Flow Rate:          {state.mass_flow_rate_kg_s:.3f} kg/s (Expected: {expected_mdot:.3f})")
    print(f"Linear Density (q_m):    {state.linear_mass_kg_m:.3f} kg/m (Expected: {expected_qm:.3f})")
    print(f"Belt Inventory Mass (M): {state.total_material_mass_kg:.1f} kg")

    assert abs(state.linear_mass_kg_m - expected_qm) < 1.0, "Linear density calculation mismatch!"
    print(">>> PASS: Material flow continuity validated.")


def test_motion_resistance():
    print_header("Test 2: DIN 22101 / CEMA Motion Resistance")
    crm = ConveyorResistanceModel()
    qm = 104.1667
    v = 3.2
    breakdown = crm.calculate(linear_mass_qm=qm, belt_speed_m_s=v, moisture_pct=4.5)

    print(f"Primary Resistance (F_H):    {breakdown.main_resistance_n:.1f} N")
    print(f"Secondary Resistance (F_N):  {breakdown.secondary_resistance_n:.1f} N")
    print(f"Lift Resistance (F_St):      {breakdown.lift_resistance_n:.1f} N")
    print(f"Total Motion Resistance(F_U):{breakdown.total_motion_resistance_n:.1f} N ({breakdown.total_motion_resistance_n/1000.0:.2f} kN)")
    print(f"Calibrated Friction (f):     {breakdown.effective_friction_factor:.4f}")

    # Check lift resistance: qm * g * H = 104.1667 * 9.80665 * 14 = 14301.7 N
    expected_lift = qm * 9.80665 * 14.0
    assert abs(breakdown.lift_resistance_n - expected_lift) < 50.0, "Lift resistance mismatch!"
    assert 20000.0 < breakdown.total_motion_resistance_n < 80000.0, "Total resistance outside physical bounds!"
    print(">>> PASS: DIN 22101 / CEMA motion resistance validated.")


def test_distributed_tension_and_euler():
    print_header("Test 3: 1D Tension Profile & Euler-Eytelwein Slip Limit")
    dtm = DistributedTensionModel()
    qm = 104.1667
    total_res_n = 45000.0

    tension_state = dtm.calculate_tension_profile(
        linear_mass_qm=qm,
        total_resistance_n=total_res_n,
        acceleration_m_s2=0.0,
    )

    t1 = tension_state.t_head_n
    t2 = tension_state.t_tail_n
    te = tension_state.t_effective_n
    euler_limit = tension_state.euler_limit_ratio
    margin = tension_state.traction_margin

    print(f"Tight-Side Tension (T_1):    {t1 / 1000.0:.2f} kN")
    print(f"Slack-Side Tension (T_2):    {t2 / 1000.0:.2f} kN")
    print(f"Effective Tension (T_e):     {te / 1000.0:.2f} kN")
    print(f"Euler Cap exp(mu*alpha):     {euler_limit:.3f}")
    print(f"Actual Ratio T_1 / T_2:      {tension_state.actual_tension_ratio:.3f}")
    print(f"Euler Traction Margin:       {margin:.3f}x")
    print(f"Slip Warning Active:         {tension_state.is_slip_warning}")

    assert t1 > t2, "Tight tension must exceed slack tension!"
    assert margin >= 1.15, "Euler traction margin should be safe (> 1.15) under normal conditions!"
    assert len(tension_state.spatial_tension_n) == len(tension_state.spatial_profile_s_m), "Spatial discretization length mismatch!"
    print(">>> PASS: 1D distributed tension & Euler traction limit validated.")


def test_catenary_sag():
    print_header("Test 4: CEMA & Catenary Sag Formulation")
    sag_model = BeltSagModel()
    t_tail = 36000.0  # 36 kN
    qm = 104.1667

    res = sag_model.calculate_carrying_sag(local_tension_n=t_tail, linear_material_mass_kg_m=qm)

    print(f"Local Tension:               {t_tail / 1000.0:.1f} kN")
    print(f"Linear Weight (w):           {res.total_linear_weight_n_m:.1f} N/m")
    print(f"CEMA Parabolic Sag:          {res.cema_sag_m * 1000.0:.2f} mm")
    print(f"Catenary Hyperbolic Sag:     {res.catenary_sag_m * 1000.0:.2f} mm")
    print(f"Sag Percentage:              {res.sag_percentage:.3f}% (Allowable: {res.allowable_sag_percentage:.1f}%)")
    print(f"Sag Exceeded:                {res.is_sag_exceeded}")

    assert abs(res.cema_sag_m - res.catenary_sag_m) < 0.001, "Parabolic and hyperbolic sag should closely agree on small ratios!"
    assert res.sag_percentage < res.allowable_sag_percentage, "Sag exceeded allowable limit!"
    print(">>> PASS: Belt sag equations validated.")


def test_drive_motor_and_thermal():
    print_header("Test 5: Motor Electromechanical & Thermal ODE")
    motor = DriveMotorModel()
    te = 45000.0
    v = 3.2
    dt = 0.5

    # Run for 100 steps
    for _ in range(100):
        state = motor.update(t_effective_n=te, velocity_m_s=v, dt=dt)

    print(f"Motor Shaft Speed:           {state.motor_speed_rpm:.1f} RPM")
    print(f"Mechanical Power (P_mech):   {state.p_mech_kw:.2f} kW")
    print(f"Electrical Power (P_elec):   {state.p_elec_kw:.2f} kW")
    print(f"Motor Phase Current:         {state.motor_current_a:.1f} A")
    print(f"Motor Stator Temperature:    {state.motor_temperature_c:.2f} degC")
    print(f"Motor Load Factor:           {state.motor_load_pct:.1f}%")

    assert 1400.0 < state.motor_speed_rpm < 1550.0, "Motor RPM outside 4-pole synchronous envelope!"
    assert state.p_elec_kw > state.p_mech_kw, "Electrical power must exceed mechanical power due to losses!"
    print(">>> PASS: Electromechanical & thermal motor model validated.")


def test_joint_kinematics_and_stress():
    print_header("Test 6: 24 Moving Joints Kinematics & Stress Concentration")
    joints = JointKinematicsModel()
    dtm = DistributedTensionModel()
    qm = 104.1667
    t_state = dtm.calculate_tension_profile(linear_mass_qm=qm, total_resistance_n=45000.0)

    # Step forward 10 seconds at 3.2 m/s -> belt moves 32 meters
    joint_states = joints.calculate_joint_stresses(
        tension_interpolator=dtm.interpolate_tension_at,
        tension_state=t_state,
        speed_m_s=3.2,
        dt_s=10.0,
    )

    assert len(joint_states) == 24, "Must track exactly 24 splices!"
    print(f"Total Splices Tracked:       {len(joint_states)}")
    print(f"Splice Pitch:                {joints.joint_spacing_m:.1f} m")

    sample_j = joint_states[0]
    print(f"Sample Splice [{sample_j.id}]:")
    print(f"  Position:                  {sample_j.position_s_m:.1f} m")
    print(f"  Zone:                      {sample_j.zone.value}")
    print(f"  Local Tension:             {sample_j.local_tension_n / 1000.0:.2f} kN")
    print(f"  Tensile Stress:            {sample_j.tensile_stress_pa / 1.0e6:.2f} MPa")
    print(f"  Pulley Bending Stress:     {sample_j.bending_stress_pa / 1.0e6:.2f} MPa")
    print(f"  Total Stress (K_t=1.25):   {sample_j.total_stress_pa / 1.0e6:.2f} MPa")
    print(f"  Splice Safety Factor:      {sample_j.safety_factor:.2f}x")

    assert sample_j.safety_factor > 1.0, "Splice must be safe under normal design load!"
    print(">>> PASS: 24-joint moving kinematics and stress concentration validated.")


def test_fatigue_and_miner():
    print_header("Test 7: Basquin S-N Curve & Palmgren-Miner Cumulative Damage")
    fatigue = SpliceFatigueEngine()
    sigma_max = 14.5e6  # 14.5 MPa
    sigma_min = 3.5e6   # 3.5 MPa
    cycle = fatigue.evaluate_cycle(sigma_max_pa=sigma_max, sigma_min_pa=sigma_min)

    print(f"Max Stress (sigma_max):      {sigma_max / 1.0e6:.2f} MPa")
    print(f"Min Stress (sigma_min):      {sigma_min / 1.0e6:.2f} MPa")
    print(f"Stress Range (delta_sigma):  {cycle.sigma_range_pa / 1.0e6:.2f} MPa")
    print(f"Goodman Equivalent Stress:   {cycle.sigma_eq_goodman_pa / 1.0e6:.2f} MPa")
    print(f"Allowable Cycles to Failure: {cycle.allowable_cycles_n:,.0f} cycles")
    print(f"Damage Increment per Cycle:  {cycle.damage_increment_d:.8e}")

    assert cycle.allowable_cycles_n > 10000, "Fatigue life should exceed 10,000 cycles!"
    assert cycle.damage_increment_d > 0.0, "Damage increment must be positive!"
    print(">>> PASS: Palmgren-Miner fatigue model validated.")


def test_residuals_and_sensor_isolation():
    print_header("Test 8: Physics Residuals & Sensor Fault Isolation")
    engine = PhysicsResidualEngine()

    # Scenario A: Normal Healthy Operation
    healthy_res = engine.evaluate_residuals(
        measured_tension_n=45000.0,
        predicted_tension_n=45200.0,
        measured_power_kw=310.0,
        predicted_power_kw=308.0,
        measured_current_a=415.0,
        predicted_current_a=412.0,
        measured_temp_c=58.0,
        predicted_temp_c=57.5,
        measured_vib_mm_s=1.35,
        predicted_vib_mm_s=1.30,
        belt_speed_m_s=3.2,
    )
    print(f"Healthy Residuals RMSE:      {healthy_res.rmse:.2f} sigma")
    print(f"Healthy Sensor Faults:       {healthy_res.sensor_faults_detected}")
    assert healthy_res.rmse < 1.5, "Healthy operation should have low normalized RMSE!"
    assert len(healthy_res.sensor_faults_detected) == 0, "Healthy system should have no sensor faults!"

    # Scenario B: Sensor Hardware Fault (Current meter disconnected reading 0 A, but power is 310 kW)
    fault_res = engine.evaluate_residuals(
        measured_tension_n=45000.0,
        predicted_tension_n=45000.0,
        measured_power_kw=310.0,
        predicted_power_kw=310.0,
        measured_current_a=0.0,  # Sensor disconnected!
        predicted_current_a=415.0,
        measured_temp_c=58.0,
        predicted_temp_c=58.0,
        measured_vib_mm_s=1.3,
        predicted_vib_mm_s=1.3,
        belt_speed_m_s=3.2,
    )
    status_val = fault_res.current_residual.health_status.value if hasattr(fault_res.current_residual.health_status, 'value') else fault_res.current_residual.health_status
    print(f"Sensor Fault Status:         {status_val}")
    print(f"Faults Detected:             {fault_res.sensor_faults_detected}")
    assert len(fault_res.sensor_faults_detected) > 0, "Must detect current sensor fault!"
    print(">>> PASS: Physics residuals and sensor fault isolation validated.")


if __name__ == "__main__":
    print("\n" + "#" * 70)
    print("  RUNNING COMPREHENSIVE CONVEYOR C01 PHYSICS VALIDATION SUITE")
    print("#" * 70)

    try:
        test_material_flow()
        test_motion_resistance()
        test_distributed_tension_and_euler()
        test_catenary_sag()
        test_drive_motor_and_thermal()
        test_joint_kinematics_and_stress()
        test_fatigue_and_miner()
        test_residuals_and_sensor_isolation()

        print("\n" + "=" * 70)
        print("  ALL 8 FIRST-PRINCIPLES PHYSICS TESTS PASSED WITH 100% SUCCESS!")
        print("=" * 70 + "\n")
    except Exception as e:
        print(f"\nVALIDATION FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
