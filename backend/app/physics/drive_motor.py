import math
from dataclasses import dataclass


@dataclass
class DriveMotorState:
    pulley_speed_rpm: float  # n_p = 60 * v / (pi * D_p) [rpm]
    motor_speed_rpm: float  # n_motor = n_p * G [rpm]
    pulley_torque_nm: float  # tau_pulley = T_e * R_p [N*m]
    motor_torque_nm: float  # tau_motor = tau_pulley / (G * eta_gearbox) [N*m]
    p_mech_kw: float  # P_mech = T_e * v [kW]
    p_elec_kw: float  # P_elec = P_mech / (eta_total) [kW]
    motor_current_a: float  # I = P_elec / (sqrt(3) * V * cos_phi) [A]
    motor_temperature_c: float  # T_m [deg C]
    motor_load_pct: float  # (P_elec / P_rated) * 100 [%]
    power_loss_kw: float  # P_loss = P_elec - P_mech [kW]
    stator_cooling_rate_w: float  # (T_m - T_amb) / R_th [W]


class DriveMotorModel:
    """Calculates electromechanical conversion, drive torques, and first-order motor thermal dynamics.

    Formulas:
        P_mech = T_e * v
        P_elec = P_mech / (eta_motor * eta_gearbox * eta_drive)
        tau_pulley = T_e * (D_p / 2)
        tau_motor  = tau_pulley / (G * eta_gearbox)
        n_p = 60 * v / (pi * D_p)
        C_th * dT_m/dt = P_loss - (T_m - T_amb) / R_th
    """

    def __init__(
        self,
        pulley_diameter_m: float = 1.0,
        motor_rated_power_kw: float = 450.0,
        motor_rated_rpm: float = 1485.0,
        gearbox_ratio: float = 24.2,
        motor_efficiency: float = 0.955,
        gearbox_efficiency: float = 0.96,
        drive_mechanical_efficiency: float = 0.97,
        rated_voltage_v: float = 415.0,
        power_factor: float = 0.87,
        thermal_resistance_k_w: float = 0.00018,
        thermal_capacitance_j_k: float = 450000.0,
        ambient_temperature_c: float = 32.0,
    ):
        self.pulley_diameter_m = pulley_diameter_m
        self.motor_rated_power_kw = motor_rated_power_kw
        self.motor_rated_rpm = motor_rated_rpm
        self.gearbox_ratio = gearbox_ratio
        self.motor_efficiency = motor_efficiency
        self.gearbox_efficiency = gearbox_efficiency
        self.drive_mechanical_efficiency = drive_mechanical_efficiency
        self.rated_voltage_v = rated_voltage_v
        self.power_factor = power_factor
        self.thermal_resistance_k_w = thermal_resistance_k_w
        self.thermal_capacitance_j_k = thermal_capacitance_j_k
        self.ambient_temperature_c = ambient_temperature_c

        self.current_temperature_c = ambient_temperature_c + 15.0

    def update(
        self,
        t_effective_n: float = 0.0,
        velocity_m_s: float = 0.0,
        dt: float = 0.5,
        ambient_temp_override: float = 32.0,
        effective_tension_n: float = None,
        belt_speed_m_s: float = None,
        dt_s: float = None,
    ) -> DriveMotorState:
        """Update drive kinematics, torque, power, and thermal state."""
        t_eff = effective_tension_n if effective_tension_n is not None else t_effective_n
        v = belt_speed_m_s if belt_speed_m_s is not None else velocity_m_s
        delta_t = dt_s if dt_s is not None else dt

        r_p = self.pulley_diameter_m / 2.0

        if v > 0.01:
            p_mech_w = t_eff * v
            tau_pulley = t_eff * r_p
            n_pulley = (60.0 * v) / (math.pi * self.pulley_diameter_m)
            n_motor = n_pulley * self.gearbox_ratio
            tau_motor = tau_pulley / (self.gearbox_ratio * self.gearbox_efficiency)

            eta_total = self.motor_efficiency * self.gearbox_efficiency * self.drive_mechanical_efficiency
            p_elec_w = p_mech_w / max(0.5, eta_total)
            p_loss_w = p_elec_w - p_mech_w

            # 3-phase line current I = P_elec / (sqrt(3) * V * cos_phi)
            current_a = p_elec_w / (math.sqrt(3.0) * self.rated_voltage_v * self.power_factor)
        else:
            p_mech_w = 0.0
            p_elec_w = 4000.0  # ~4 kW magnetizing/auxiliary idle draw
            p_loss_w = p_elec_w
            tau_pulley = 0.0
            tau_motor = 0.0
            n_pulley = 0.0
            n_motor = 0.0
            current_a = 6.5  # idle excitation current

        # First-order thermal ODE: dT_m/dt = [P_loss - (T_m - T_amb)/R_th] / C_th
        t_amb = ambient_temp_override
        heat_dissipated_w = (self.current_temperature_c - t_amb) / self.thermal_resistance_k_w
        net_heat_flow_w = p_loss_w - heat_dissipated_w
        dt_m = (net_heat_flow_w / self.thermal_capacitance_j_k) * delta_t

        self.current_temperature_c += dt_m
        self.current_temperature_c = max(t_amb, min(150.0, self.current_temperature_c))

        p_mech_kw = p_mech_w / 1000.0
        p_elec_kw = p_elec_w / 1000.0
        load_pct = (p_elec_kw / self.motor_rated_power_kw) * 100.0

        return DriveMotorState(
            pulley_speed_rpm=round(n_pulley, 1),
            motor_speed_rpm=round(n_motor, 1),
            pulley_torque_nm=round(tau_pulley, 1),
            motor_torque_nm=round(tau_motor, 1),
            p_mech_kw=round(p_mech_kw, 2),
            p_elec_kw=round(p_elec_kw, 2),
            motor_current_a=round(current_a, 1),
            motor_temperature_c=round(self.current_temperature_c, 1),
            motor_load_pct=round(load_pct, 1),
            power_loss_kw=round(p_loss_w / 1000.0, 2),
            stator_cooling_rate_w=round(heat_dissipated_w, 1),
        )
