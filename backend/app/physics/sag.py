import math
from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class SagCalculationResult:
    cema_sag_m: float
    catenary_sag_m: float
    sag_percentage: float
    allowable_sag_percentage: float
    is_sag_exceeded: bool
    min_tension_for_allowable_sag_n: float
    local_tension_n: float
    idler_spacing_m: float
    total_linear_weight_n_m: float


class BeltSagModel:
    """Calculates belt sag between idler sets using CEMA parabolic approximation

    and exact hyperbolic catenary equations.
    """

    GRAVITY_G = 9.80665  # m/s^2

    def __init__(
        self,
        carrying_idler_spacing_m: float = 1.2,
        return_idler_spacing_m: float = 3.0,
        max_allowable_sag_pct: float = 2.0,
        belt_mass_kg_m: float = 24.5,
    ):
        self.carrying_idler_spacing_m = carrying_idler_spacing_m
        self.return_idler_spacing_m = return_idler_spacing_m
        self.max_allowable_sag_pct = max_allowable_sag_pct
        self.belt_mass_kg_m = belt_mass_kg_m

    def calculate_carrying_sag(
        self,
        local_tension_n: float,
        linear_material_mass_kg_m: float,
        idler_spacing_override_m: float = 0.0,
    ) -> SagCalculationResult:
        """Calculate belt sag on the carrying strand.

        w = (q_b + q_m) * g [N/m]
        S_cema = (w * L_i^2) / (8 * T)
        """
        spacing = idler_spacing_override_m if idler_spacing_override_m > 0 else self.carrying_idler_spacing_m
        q_total = self.belt_mass_kg_m + max(0.0, linear_material_mass_kg_m)
        w = q_total * self.GRAVITY_G

        t_safe = max(100.0, local_tension_n)

        # CEMA parabolic sag
        s_cema = (w * (spacing ** 2)) / (8.0 * t_safe)

        # Exact catenary sag: S = (T/w) * (cosh(w * L / (2 * T)) - 1)
        arg = (w * spacing) / (2.0 * t_safe)
        if arg < 1.0e-4:
            # Taylor expansion cosh(x) - 1 approx x^2 / 2
            s_catenary = s_cema
        else:
            s_catenary = (t_safe / w) * (math.cosh(arg) - 1.0)

        sag_pct = (s_cema / spacing) * 100.0
        is_exceeded = sag_pct > self.max_allowable_sag_pct

        # Minimum tension required to stay below allowable sag
        allowable_sag_fraction = self.max_allowable_sag_pct / 100.0
        min_tension = (w * spacing) / (8.0 * allowable_sag_fraction)

        return SagCalculationResult(
            cema_sag_m=s_cema,
            catenary_sag_m=s_catenary,
            sag_percentage=sag_pct,
            allowable_sag_percentage=self.max_allowable_sag_pct,
            is_sag_exceeded=is_exceeded,
            min_tension_for_allowable_sag_n=min_tension,
            local_tension_n=local_tension_n,
            idler_spacing_m=spacing,
            total_linear_weight_n_m=w,
        )

    def calculate_return_sag(
        self,
        local_tension_n: float,
        idler_spacing_override_m: float = 0.0,
    ) -> SagCalculationResult:
        """Calculate belt sag on the return strand (empty belt)."""
        spacing = idler_spacing_override_m if idler_spacing_override_m > 0 else self.return_idler_spacing_m
        w = self.belt_mass_kg_m * self.GRAVITY_G
        t_safe = max(100.0, local_tension_n)

        s_cema = (w * (spacing ** 2)) / (8.0 * t_safe)
        arg = (w * spacing) / (2.0 * t_safe)
        if arg < 1.0e-4:
            s_catenary = s_cema
        else:
            s_catenary = (t_safe / w) * (math.cosh(arg) - 1.0)

        sag_pct = (s_cema / spacing) * 100.0
        is_exceeded = sag_pct > self.max_allowable_sag_pct
        min_tension = (w * spacing) / (8.0 * (self.max_allowable_sag_pct / 100.0))

        return SagCalculationResult(
            cema_sag_m=s_cema,
            catenary_sag_m=s_catenary,
            sag_percentage=sag_pct,
            allowable_sag_percentage=self.max_allowable_sag_pct,
            is_sag_exceeded=is_exceeded,
            min_tension_for_allowable_sag_n=min_tension,
            local_tension_n=local_tension_n,
            idler_spacing_m=spacing,
            total_linear_weight_n_m=w,
        )
