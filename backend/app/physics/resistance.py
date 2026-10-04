import math
from dataclasses import dataclass
from typing import Optional


@dataclass
class ResistanceBreakdown:
    main_resistance_n: float  # F_H (idler rolling & belt indentation)
    secondary_resistance_n: float  # F_N (skirtboards, scrapers, pulley wrap)
    lift_resistance_n: float  # F_St (elevation change)
    return_resistance_n: float  # Resistance on bottom empty return strand
    total_motion_resistance_n: float  # F_U = C * F_H + F_St
    effective_friction_factor: float  # Calibrated f(s, operating conditions)


class ConveyorResistanceModel:
    """Calculates motion resistance according to DIN 22101 and CEMA 7th Edition.

    Formulas:
        F_H = f * L * g * [q_B + q_R_carry + (q_B + q_R_return + q_m) * cos(theta)]
        F_St = q_m * g * H
        F_U = C * F_H + F_St
    """

    GRAVITY_G = 9.80665  # m/s^2

    def __init__(
        self,
        conveyor_length_m: float = 350.0,
        lift_height_m: float = 14.0,
        belt_mass_kg_m: float = 24.5,
        carrying_idler_mass_kg_m: float = 15.0,  # 18 kg / 1.2 m
        return_idler_mass_kg_m: float = 2.83,   # 8.5 kg / 3.0 m
        base_friction_factor_f: float = 0.020,
        secondary_resistance_c: float = 1.08,
    ):
        self.conveyor_length_m = conveyor_length_m
        self.lift_height_m = lift_height_m
        self.belt_mass_kg_m = belt_mass_kg_m
        self.carrying_idler_mass_kg_m = carrying_idler_mass_kg_m
        self.return_idler_mass_kg_m = return_idler_mass_kg_m
        self.base_friction_factor_f = base_friction_factor_f
        self.secondary_resistance_c = secondary_resistance_c

    def calculate_effective_friction(
        self,
        moisture_pct: float = 4.5,
        misalignment_factor: float = 0.0,
        calibrated_f_offset: float = 0.0,
    ) -> float:
        """Calculate calibrated effective friction factor f."""
        f = self.base_friction_factor_f + calibrated_f_offset
        # Moisture increases carryback clumping and idler rim drag
        moisture_excess = max(0.0, moisture_pct - 4.5)
        f *= (1.0 + 0.012 * moisture_excess)
        # Misalignment adds edge guide rubbing resistance
        f *= (1.0 + max(0.0, misalignment_factor))
        return max(0.012, min(0.060, f))

    def calculate_resistance(
        self,
        linear_mass_qm: float,
        velocity_m_s: float,
        moisture_pct: float = 4.5,
        misalignment_factor: float = 0.0,
        calibrated_f_offset: float = 0.0,
    ) -> ResistanceBreakdown:
        """Compute full resistance breakdown."""
        if velocity_m_s <= 0.01:
            # Standstill static friction
            return ResistanceBreakdown(
                main_resistance_n=0.0,
                secondary_resistance_n=0.0,
                lift_resistance_n=0.0,
                return_resistance_n=0.0,
                total_motion_resistance_n=0.0,
                effective_friction_factor=self.base_friction_factor_f,
            )

        f_eff = self.calculate_effective_friction(
            moisture_pct=moisture_pct,
            misalignment_factor=misalignment_factor,
            calibrated_f_offset=calibrated_f_offset,
        )

        cos_theta = math.cos(math.atan2(self.lift_height_m, self.conveyor_length_m))

        # Main carrying + return resistance F_H
        q_b = self.belt_mass_kg_m
        q_rc = self.carrying_idler_mass_kg_m
        q_rr = self.return_idler_mass_kg_m

        carrying_moving_mass = (q_b + q_rc + linear_mass_qm) * cos_theta
        return_moving_mass = (q_b + q_rr) * cos_theta

        f_h = f_eff * self.conveyor_length_m * self.GRAVITY_G * (carrying_moving_mass + return_moving_mass)

        # Secondary resistance: (C - 1) * F_H + chute skirtboard + belt scrapers
        f_secondary = (self.secondary_resistance_c - 1.0) * f_h + 1200.0  # ~1.2 kN scraper/skirt

        # Lift resistance: gravitational work on payload
        f_st = linear_mass_qm * self.GRAVITY_G * self.lift_height_m

        # Return strand resistance
        f_return = f_eff * self.conveyor_length_m * self.GRAVITY_G * return_moving_mass - (
            q_b * self.GRAVITY_G * self.lift_height_m
        )

        total_resistance = (self.secondary_resistance_c * f_h) + f_st

        return ResistanceBreakdown(
            main_resistance_n=f_h,
            secondary_resistance_n=f_secondary,
            lift_resistance_n=f_st,
            return_resistance_n=f_return,
            total_motion_resistance_n=total_resistance,
            effective_friction_factor=f_eff,
        )

    def calculate(
        self,
        linear_mass_qm: float,
        belt_speed_m_s: float,
        moisture_pct: float = 4.5,
        misalignment_factor: float = 0.0,
        acceleration_m_s2: float = 0.0,
        calibrated_f_offset: float = 0.0,
    ) -> ResistanceBreakdown:
        """Alias for calculate_resistance with comprehensive industrial signature."""
        return self.calculate_resistance(
            linear_mass_qm=linear_mass_qm,
            velocity_m_s=belt_speed_m_s,
            moisture_pct=moisture_pct,
            misalignment_factor=misalignment_factor,
            calibrated_f_offset=calibrated_f_offset,
        )
