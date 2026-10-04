import math
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple, Dict, Any


@dataclass
class TensionState:
    t_head_n: float  # Tight-side tension T_1 [N]
    t_tail_n: float  # Slack-side tension T_2 [N]
    t_effective_n: float  # Effective tensile force T_e = T_1 - T_2 [N]
    dynamic_accel_force_n: float  # F_accel = M_eff * a [N]
    euler_limit_ratio: float  # exp(mu * alpha)
    actual_tension_ratio: float  # T_1 / T_2
    traction_margin: float  # exp(mu * alpha) / (T_1 / T_2)
    is_slip_warning: bool  # True if traction margin < 1.15
    spatial_profile_s_m: List[float]  # Discretized distance along belt loop [m]
    spatial_tension_n: List[float]  # Local belt tension T(s) [N]


class DistributedTensionModel:
    """Calculates 1D distributed belt tension profile and Euler-Eytelwein drive slip limits.

    Governing Differential Equation:
        dT/ds = g * q(s) * [f(s) * cos(theta(s)) + sin(theta(s))]
        T(s)  = T(0) + integral_0^s (dT/ds) ds
    """

    GRAVITY_G = 9.80665  # m/s^2

    def __init__(
        self,
        conveyor_length_m: float = 350.0,
        total_loop_length_m: float = 720.0,
        lift_height_m: float = 14.0,
        belt_mass_kg_m: float = 24.5,
        carrying_idler_mass_kg_m: float = 15.0,
        return_idler_mass_kg_m: float = 2.83,
        tail_tension_nominal_n: float = 36000.0,
        pulley_wrap_rad: float = 3.665,  # 210 degrees
        pulley_friction_mu: float = 0.38,  # Ceramic lagging
        num_spatial_points: int = 144,
    ):
        self.conveyor_length_m = conveyor_length_m
        self.total_loop_length_m = total_loop_length_m
        self.lift_height_m = lift_height_m
        self.belt_mass_kg_m = belt_mass_kg_m
        self.carrying_idler_mass_kg_m = carrying_idler_mass_kg_m
        self.return_idler_mass_kg_m = return_idler_mass_kg_m
        self.tail_tension_nominal_n = tail_tension_nominal_n
        self.pulley_wrap_rad = pulley_wrap_rad
        self.pulley_friction_mu = pulley_friction_mu
        self.num_spatial_points = num_spatial_points

        # Precompute spatial discretization along continuous loop s in [0, L_loop]
        self.s_grid = np.linspace(0.0, total_loop_length_m, num_spatial_points)
        self.sin_theta = lift_height_m / conveyor_length_m
        self.cos_theta = math.cos(math.asin(self.sin_theta))
        self.euler_limit_ratio = math.exp(pulley_friction_mu * pulley_wrap_rad)

    def calculate_tension_profile(
        self,
        linear_mass_qm: float,
        total_resistance_n: float,
        acceleration_m_s2: float = 0.0,
        effective_moving_mass_kg: float = 35000.0,
        effective_f: float = 0.020,
        takeup_override_n: float = 0.0,
    ) -> TensionState:
        """Compute full distributed tension profile T(s) along the conveyor loop."""
        # Dynamic acceleration force F_accel = M_eff * a
        f_accel = effective_moving_mass_kg * acceleration_m_s2
        t_effective = max(0.0, total_resistance_n + f_accel)

        # Minimum slack tension T_2 required to prevent drive pulley slip (Euler-Eytelwein):
        # T_1 / T_2 <= exp(mu * alpha)  ==>  (T_2 + T_e) / T_2 <= exp(mu * alpha)
        # T_2 >= T_e / (exp(mu * alpha) - 1)
        t2_slip_minimum = t_effective / max(0.1, (self.euler_limit_ratio - 1.0))
        base_t2 = max(self.tail_tension_nominal_n, t2_slip_minimum * 1.15)
        if takeup_override_n > 0:
            base_t2 = max(base_t2, takeup_override_n)

        # Numerical integration along s_grid
        # Loop geometry partition:
        # 0 <= s <= 350 m: Carrying strand (rises from tail to head pulley)
        # 350 < s <= 360 m: Head drive pulley zone (tension drops from T1 to T_slack)
        # 360 < s <= 710 m: Return strand (returns from head to tail)
        # 710 < s <= 720 m: Take-up and tail pulley wrap
        t_profile = np.zeros(self.num_spatial_points)

        # 1. Carrying strand integration
        carry_mask = self.s_grid <= self.conveyor_length_m
        s_carry = self.s_grid[carry_mask]
        # Linear mass on carry: belt + idlers + ore
        q_carry = self.belt_mass_kg_m + self.carrying_idler_mass_kg_m + linear_mass_qm
        # dT/ds on incline: g * q * (f * cos(theta) + sin(theta))
        dt_ds_carry = self.GRAVITY_G * q_carry * (effective_f * self.cos_theta + self.sin_theta)

        # Tail tension at s=0 is T_tail (approx base_t2 + slight return residual)
        t_tail_entry = base_t2
        t_profile[carry_mask] = t_tail_entry + dt_ds_carry * s_carry

        t_head = float(t_profile[carry_mask][-1])  # T_1 tight side

        # 2. Return strand integration
        return_mask = self.s_grid > self.conveyor_length_m
        s_return = self.s_grid[return_mask]
        s_from_head = s_return - self.conveyor_length_m
        q_return = self.belt_mass_kg_m + self.return_idler_mass_kg_m
        # On decline return: friction resists, gravity aids: g * q * (f * cos(theta) - sin(theta))
        dt_ds_return = self.GRAVITY_G * q_return * (effective_f * self.cos_theta - self.sin_theta)

        # Starting from slack tension after drive pulley wrap
        t_slack = max(base_t2, t_head - t_effective)
        t_profile[return_mask] = t_slack + dt_ds_return * s_from_head

        # Slip margin evaluation
        actual_ratio = t_head / max(100.0, t_slack)
        traction_margin = self.euler_limit_ratio / actual_ratio
        is_slip_warning = traction_margin < 1.15

        return TensionState(
            t_head_n=t_head,
            t_tail_n=t_tail_entry,
            t_effective_n=t_effective,
            dynamic_accel_force_n=f_accel,
            euler_limit_ratio=self.euler_limit_ratio,
            actual_tension_ratio=actual_ratio,
            traction_margin=traction_margin,
            is_slip_warning=is_slip_warning,
            spatial_profile_s_m=self.s_grid.tolist(),
            spatial_tension_n=t_profile.tolist(),
        )

    def interpolate_tension_at(self, s_m: float, tension_state: TensionState) -> float:
        """Query local belt tension at exact coordinate s_m around continuous loop."""
        s_mod = s_m % self.total_loop_length_m
        return float(np.interp(s_mod, tension_state.spatial_profile_s_m, tension_state.spatial_tension_n))
