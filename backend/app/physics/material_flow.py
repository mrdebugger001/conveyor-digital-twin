import math
from typing import Optional
from dataclasses import dataclass


@dataclass
class MaterialFlowState:
    tph: float  # Tonnes per hour [t/h]
    mass_flow_rate_kg_s: float  # [kg/s]
    linear_mass_qm: float  # [kg/m]
    total_material_mass_kg: float  # [kg]
    gravitational_force_n: float  # [N]
    moisture_pct: float  # [%]
    carrying_linear_mass_kg_m: float  # [kg/m] q_b + q_m
    return_linear_mass_kg_m: float  # [kg/m] q_b

    @property
    def linear_mass_kg_m(self) -> float:
        return self.linear_mass_qm

    @property
    def actual_throughput_tph(self) -> float:
        return self.tph


class MaterialFlowModel:
    """Calculates deterministic bulk material flow, inventory mass, and transient response.

    SI Formulation:
        m_dot = TPH / 3.6  [kg/s]
        q_m   = m_dot / v  = TPH / (3.6 * v)  [kg/m]
        M_material = q_m * L_loaded  [kg]
        W_material = M_material * g  [N]
    """

    GRAVITY_G = 9.80665  # m/s^2

    def __init__(
        self,
        belt_mass_kg_m: float = 24.5,
        conveyor_length_m: float = 350.0,
        tau_load_s: float = 2.5,
        moisture_nominal_pct: float = 4.5,
    ):
        self.belt_mass_kg_m = belt_mass_kg_m
        self.conveyor_length_m = conveyor_length_m
        self.tau_load_s = tau_load_s
        self.moisture_nominal_pct = moisture_nominal_pct

        # Dynamic internal state for transient response
        self.current_tph: float = 0.0
        self.current_qm: float = 0.0

    @staticmethod
    def calculate_mass_flow_rate(tph: float) -> float:
        """Convert throughput from tonnes/hour to kg/s: m_dot = TPH / 3.6."""
        if tph < 0:
            raise ValueError(f"Throughput cannot be negative, got {tph}")
        return tph / 3.6

    @staticmethod
    def calculate_linear_mass(tph: float, velocity_m_s: float) -> float:
        """Calculate linear material mass: q_m = TPH / (3.6 * v).

        Validation test:
            TPH = 1200, v = 3.2 m/s -> q_m = 1200 / (3.6 * 3.2) = 104.1667 kg/m.
        """
        if velocity_m_s <= 0.001:
            return 0.0
        m_dot = tph / 3.6
        return m_dot / velocity_m_s

    def update_transient(
        self,
        target_tph: float,
        velocity_m_s: float,
        dt: float,
        moisture_pct: float = 4.5,
        loaded_length_m: Optional[float] = None,
    ) -> MaterialFlowState:
        """Update transient material flow using first-order lag filter: dq_m/dt = (q_target - q_m) / tau_load."""
        if velocity_m_s > 0.05:
            target_qm = self.calculate_linear_mass(target_tph, velocity_m_s)
            alpha = min(1.0, dt / max(0.1, self.tau_load_s))
            self.current_qm += alpha * (target_qm - self.current_qm)
            self.current_tph += alpha * (target_tph - self.current_tph)
        else:
            self.current_tph = 0.0
            # If belt is stopped with material on it, linear mass remains resting
            if target_tph == 0.0:
                self.current_qm = 0.0

        length = loaded_length_m if loaded_length_m is not None else self.conveyor_length_m

        # Moisture mass correction: excess moisture adds wet mass
        moisture_excess = max(0.0, moisture_pct - self.moisture_nominal_pct)
        wet_qm = self.current_qm * (1.0 + 0.008 * moisture_excess)

        total_material_mass = wet_qm * length
        gravity_force = total_material_mass * self.GRAVITY_G
        m_dot = self.calculate_mass_flow_rate(self.current_tph)

        return MaterialFlowState(
            tph=self.current_tph,
            mass_flow_rate_kg_s=m_dot,
            linear_mass_qm=wet_qm,
            total_material_mass_kg=total_material_mass,
            gravitational_force_n=gravity_force,
            moisture_pct=moisture_pct,
            carrying_linear_mass_kg_m=self.belt_mass_kg_m + wet_qm,
            return_linear_mass_kg_m=self.belt_mass_kg_m,
        )

    def update(
        self,
        target_throughput_tph: float,
        belt_speed_m_s: float,
        dt_s: float,
        moisture_pct: float = 4.5,
        lump_fraction: float = 0.15,
        loaded_length_m: Optional[float] = None,
    ) -> MaterialFlowState:
        """Alias for update_transient with comprehensive industrial signature."""
        return self.update_transient(
            target_tph=target_throughput_tph,
            velocity_m_s=belt_speed_m_s,
            dt=dt_s,
            moisture_pct=moisture_pct,
            loaded_length_m=loaded_length_m,
        )
