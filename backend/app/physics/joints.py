import math
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from enum import Enum


class ConveyorZone(str, Enum):
    TAIL_WRAP = "TAIL_WRAP"
    LOADING_ZONE = "LOADING_ZONE"
    CARRYING_INCLINE = "CARRYING_INCLINE"
    DISCHARGE_TRANSITION = "DISCHARGE_TRANSITION"
    HEAD_DRIVE_PULLEY = "HEAD_DRIVE_PULLEY"
    SNUB_TAKEUP_PULLEYS = "SNUB_TAKEUP_PULLEYS"
    RETURN_STRAND = "RETURN_STRAND"
    TAIL_ENTRY = "TAIL_ENTRY"


@dataclass
class SingleJointState:
    id: str
    index: int  # 1 to 24
    position_s_m: float  # Current coordinate along loop [m]
    zone: ConveyorZone
    local_tension_n: float  # Local belt tension T(s) [N]
    tensile_stress_pa: float  # sigma_tension [Pa]
    bending_stress_pa: float  # sigma_bending [Pa]
    stress_concentration_kt: float
    total_stress_pa: float  # sigma_total = Kt * (sigma_tension + sigma_bending) [Pa]
    safety_factor: float  # S_ut / sigma_total
    is_warning: bool
    is_critical: bool
    health_pct: float
    cumulative_damage_d: float  # Palmgren-Miner cumulative damage [0..1]
    cycles_completed: int


class JointKinematicsModel:
    """Simulates the 24 conveyor belt splices (joints) moving dynamically

    around the closed loop. Evaluates tension, bending curvature, stress concentrations,
    and instantaneous safety factors.
    """

    def __init__(
        self,
        num_joints: int = 24,
        loop_length_m: float = 720.0,
        belt_width_m: float = 1.4,
        belt_thickness_m: float = 0.018,
        elastic_modulus_pa: float = 450000000.0,
        splice_efficiency: float = 0.88,
        stress_concentration_kt: float = 1.25,
        ultimate_splice_strength_pa: float = 22000000.0,
        stress_warning_pa: float = 13800000.0,
        stress_critical_pa: float = 15500000.0,
        head_pulley_radius_m: float = 0.5,
        tail_pulley_radius_m: float = 0.4,
        bend_pulley_radius_m: float = 0.315,
    ):
        self.num_joints = num_joints
        self.loop_length_m = loop_length_m
        self.belt_width_m = belt_width_m
        self.belt_thickness_m = belt_thickness_m
        self.elastic_modulus_pa = elastic_modulus_pa
        self.splice_efficiency = splice_efficiency
        self.stress_concentration_kt = stress_concentration_kt
        self.ultimate_splice_strength_pa = ultimate_splice_strength_pa
        self.stress_warning_pa = stress_warning_pa
        self.stress_critical_pa = stress_critical_pa

        self.head_pulley_radius_m = head_pulley_radius_m
        self.tail_pulley_radius_m = tail_pulley_radius_m
        self.bend_pulley_radius_m = bend_pulley_radius_m

        # Effective splice load-bearing area: A = eta_splice * W * t
        self.effective_splice_area_m2 = splice_efficiency * belt_width_m * belt_thickness_m

        # Initial equidistant spacing of 24 joints along 720 m loop (30 m pitch)
        self.joint_spacing_m = loop_length_m / num_joints
        self.accumulated_distance_m = 0.0

        # State tracking per joint
        self.cycles = [0] * num_joints
        self.cumulative_damage = [0.0] * num_joints
        self.health_pcts = [100.0] * num_joints
        self.previous_s = [i * self.joint_spacing_m for i in range(num_joints)]

    def determine_zone_and_curvature(self, s: float) -> Tuple[ConveyorZone, float]:
        """Classify spatial location along loop and determine bending radius of curvature [m].

        Returns (zone, radius_of_curvature_m). Radius = 0.0 denotes negligible flat bending.
        """
        # 0 <= s < 15: Tail Pulley Wrap
        if s < 15.0:
            return ConveyorZone.TAIL_WRAP, self.tail_pulley_radius_m
        # 15 <= s < 60: Loading and Skirtboard zone
        elif s < 60.0:
            return ConveyorZone.LOADING_ZONE, 0.0
        # 60 <= s < 320: Carrying incline strand
        elif s < 320.0:
            return ConveyorZone.CARRYING_INCLINE, 0.0
        # 320 <= s < 350: Discharge transition from troughed to flat
        elif s < 350.0:
            return ConveyorZone.DISCHARGE_TRANSITION, 2.5  # Slight edge transition curvature
        # 350 <= s < 355: Head Drive Pulley wrap
        elif s < 355.0:
            return ConveyorZone.HEAD_DRIVE_PULLEY, self.head_pulley_radius_m
        # 355 <= s < 380: Snub & Takeup pulleys
        elif s < 380.0:
            return ConveyorZone.SNUB_TAKEUP_PULLEYS, self.bend_pulley_radius_m
        # 380 <= s < 705: Flat return strand
        elif s < 705.0:
            return ConveyorZone.RETURN_STRAND, 0.0
        # 705 <= s <= 720: Tail entry transition
        else:
            return ConveyorZone.TAIL_ENTRY, 0.0

    def update_positions(self, speed_m_s: float, dt_s: float) -> List[SingleJointState]:
        """Advance joints by delta_s = v * dt, wrap around loop, and track cycle revolutions."""
        delta_s = speed_m_s * dt_s
        self.accumulated_distance_m += delta_s

        states = []
        for i in range(self.num_joints):
            s_initial = i * self.joint_spacing_m
            current_s = (s_initial + self.accumulated_distance_m) % self.loop_length_m

            # Track completed loop cycles
            if current_s < self.previous_s[i] and delta_s > 0:
                self.cycles[i] += 1
            self.previous_s[i] = current_s

        return states

    def calculate_joint_stresses(
        self,
        tension_interpolator,
        tension_state,
        speed_m_s: float,
        dt_s: float,
    ) -> List[SingleJointState]:
        """Compute the full kinematic and stress state for each of the 24 splices."""
        delta_s = speed_m_s * dt_s
        self.accumulated_distance_m += delta_s

        joint_states: List[SingleJointState] = []

        for i in range(self.num_joints):
            jid = f"J{i + 1:03d}"
            s_initial = i * self.joint_spacing_m
            current_s = (s_initial + self.accumulated_distance_m) % self.loop_length_m

            # Loop revolution detection
            if current_s < self.previous_s[i] and delta_s > 0:
                self.cycles[i] += 1
            self.previous_s[i] = current_s

            # Zone and curvature
            zone, radius_m = self.determine_zone_and_curvature(current_s)

            # Local tension from distributed tension profile
            local_tension_n = tension_interpolator(current_s, tension_state)

            # Nominal tensile stress sigma_tension = T / A_eff
            sigma_tension = local_tension_n / max(1.0e-5, self.effective_splice_area_m2)

            # Bending stress sigma_bending = (E * t) / (2 * R) when traversing pulleys
            if radius_m > 0.0:
                sigma_bending = (self.elastic_modulus_pa * self.belt_thickness_m) / (2.0 * radius_m)
            else:
                sigma_bending = 0.0

            # Combined stress with stress concentration factor Kt
            total_stress = self.stress_concentration_kt * (sigma_tension + sigma_bending)

            # Safety factor
            safety_factor = self.ultimate_splice_strength_pa / max(1.0e-3, total_stress)

            is_warning = total_stress >= self.stress_warning_pa
            is_critical = total_stress >= self.stress_critical_pa

            # Health percentage linked to fatigue damage and stress
            health = max(0.0, 100.0 * (1.0 - self.cumulative_damage[i]))

            state = SingleJointState(
                id=jid,
                index=i + 1,
                position_s_m=round(current_s, 2),
                zone=zone,
                local_tension_n=round(local_tension_n, 1),
                tensile_stress_pa=round(sigma_tension, 1),
                bending_stress_pa=round(sigma_bending, 1),
                stress_concentration_kt=self.stress_concentration_kt,
                total_stress_pa=round(total_stress, 1),
                safety_factor=round(safety_factor, 2),
                is_warning=is_warning,
                is_critical=is_critical,
                health_pct=round(health, 1),
                cumulative_damage_d=round(self.cumulative_damage[i], 6),
                cycles_completed=self.cycles[i],
            )
            joint_states.append(state)

        return joint_states

    def inject_joint_damage(self, joint_id: str, added_damage: float = 0.15):
        """Artificially advance fatigue damage on a specific joint for scenario testing."""
        for i in range(self.num_joints):
            if f"J{i + 1:03d}" == joint_id:
                self.cumulative_damage[i] = min(1.0, self.cumulative_damage[i] + added_damage)
                self.health_pcts[i] = max(0.0, 100.0 * (1.0 - self.cumulative_damage[i]))
                break
