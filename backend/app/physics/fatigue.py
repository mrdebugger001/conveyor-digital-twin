import math
from dataclasses import dataclass
from typing import List, Tuple, Optional


@dataclass
class StressCycle:
    sigma_max_pa: float
    sigma_min_pa: float
    sigma_range_pa: float
    sigma_mean_pa: float
    sigma_alt_pa: float
    sigma_eq_goodman_pa: float
    allowable_cycles_n: float
    damage_increment_d: float


@dataclass
class JointFatigueStatus:
    joint_id: str
    cumulative_damage_d: float
    health_score_pct: float
    cycles_completed: int
    rul_hours: Optional[float]
    last_cycle: Optional[StressCycle]
    status: str  # NORMAL, WARNING, CRITICAL


class SpliceFatigueEngine:
    """Implements Palmgren-Miner cumulative fatigue damage rule with

    Goodman mean-stress correction and Basquin S-N power-law curves
    for heavy-duty steel-cord belt splices.
    """

    def __init__(
        self,
        ultimate_splice_strength_pa: float = 22000000.0,  # 22.0 MPa
        endurance_limit_pa: float = 8500000.0,  # 8.5 MPa
        fatigue_exponent_m: float = 5.5,  # Basquin Wohler slope
        reference_cycles_n0: float = 1.0e6,
        warning_damage_threshold: float = 0.65,
        critical_damage_threshold: float = 0.85,
    ):
        self.s_u = ultimate_splice_strength_pa
        self.s_e = endurance_limit_pa
        self.m = fatigue_exponent_m
        self.n0 = reference_cycles_n0
        self.warning_threshold = warning_damage_threshold
        self.critical_threshold = critical_damage_threshold

    def evaluate_cycle(self, sigma_max_pa: float, sigma_min_pa: float) -> StressCycle:
        """Evaluate a single closed hysteresis loop or revolution stress cycle.

        1. delta_sigma = sigma_max - sigma_min
        2. sigma_a = delta_sigma / 2
        3. sigma_m = (sigma_max + sigma_min) / 2
        4. Goodman correction: sigma_eq = sigma_a / (1 - sigma_m / S_u)
        5. Basquin: N = N0 * (S_e / sigma_eq)^m
        6. Delta_D = 1 / N
        """
        sigma_range = max(0.0, sigma_max_pa - sigma_min_pa)
        sigma_alt = sigma_range / 2.0
        sigma_mean = (sigma_max_pa + sigma_min_pa) / 2.0

        # Mean stress correction (Goodman rule)
        # Avoid singularity if mean stress approaches or exceeds ultimate tensile strength
        mean_ratio = min(0.95, max(0.0, sigma_mean / self.s_u))
        sigma_eq = sigma_alt / (1.0 - mean_ratio)

        # Basquin S-N calculation
        if sigma_eq <= self.s_e * 0.75:
            # Below endurance threshold -> infinite life
            allowable_cycles = 1.0e12
            damage_inc = 1.0e-12
        else:
            # S-N curve: N = N0 * (S_e / sigma_eq)^m
            ratio = self.s_e / max(1.0e-3, sigma_eq)
            allowable_cycles = max(100.0, self.n0 * (ratio ** self.m))
            damage_inc = 1.0 / allowable_cycles

        return StressCycle(
            sigma_max_pa=sigma_max_pa,
            sigma_min_pa=sigma_min_pa,
            sigma_range_pa=sigma_range,
            sigma_mean_pa=sigma_mean,
            sigma_alt_pa=sigma_alt,
            sigma_eq_goodman_pa=sigma_eq,
            allowable_cycles_n=allowable_cycles,
            damage_increment_d=damage_inc,
        )

    def accumulate_revolution_damage(
        self,
        current_damage: float,
        sigma_max_pa: float,
        sigma_min_pa: float,
        loop_cycle_time_s: float,
    ) -> Tuple[float, float, StressCycle]:
        """Accumulate damage from one completed belt revolution around loop.

        Returns (new_cumulative_damage, estimated_rul_hours, cycle_metrics).
        """
        cycle = self.evaluate_cycle(sigma_max_pa, sigma_min_pa)
        new_damage = min(1.0, current_damage + cycle.damage_increment_d)

        # RUL estimation based on cycle time and damage rate
        cycle_time_hours = max(1.0e-3, loop_cycle_time_s / 3600.0)
        damage_per_hour = cycle.damage_increment_d / cycle_time_hours

        if damage_per_hour > 0 and new_damage < 1.0:
            remaining_fraction = 1.0 - new_damage
            rul_hours = remaining_fraction / damage_per_hour
        elif new_damage >= 1.0:
            rul_hours = 0.0
        else:
            rul_hours = None

        return new_damage, (round(rul_hours, 1) if rul_hours is not None else None), cycle

    def get_status(self, cumulative_damage: float) -> str:
        """Classify splice condition from cumulative Miner damage."""
        if cumulative_damage >= self.critical_threshold:
            return "CRITICAL"
        elif cumulative_damage >= self.warning_threshold:
            return "WARNING"
        return "NORMAL"


class RainflowCycleCounter:
    """Simplified ASTM E1049-85 compliant rainflow cycle counter for

    continuous stream of stress peaks and valleys.
    """

    def __init__(self):
        self.points: List[float] = []

    def add_point(self, val: float) -> List[Tuple[float, float]]:
        """Add local turning point (peak/valley) and extract closed reversal cycles (range, mean)."""
        self.points.append(val)
        cycles = []

        while len(self.points) >= 3:
            s0 = self.points[-3]
            s1 = self.points[-2]
            s2 = self.points[-1]

            delta_s1 = abs(s1 - s0)
            delta_s2 = abs(s2 - s1)

            if delta_s1 <= delta_s2:
                # Closed reversal cycle identified
                cycle_range = delta_s1
                cycle_mean = (s0 + s1) / 2.0
                cycles.append((cycle_range, cycle_mean))
                # Remove s0 and s1, reinsert s2
                self.points.pop(-2)
                self.points.pop(-2)
            else:
                break

        return cycles
