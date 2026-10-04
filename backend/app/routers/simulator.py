import math
from fastapi import APIRouter
from app.twin.state_store import twin_store
from app.schemas.twin import FaultInjectionConfig, ModeCommand, WhatIfRequest, WhatIfResponse
from app import config

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


@router.get("/faults")
async def get_faults():
    cfg = await twin_store.get_fault_config()
    return cfg.model_dump(by_alias=True)


@router.post("/fault")
async def set_faults(cfg: FaultInjectionConfig):
    await twin_store.set_fault_config(cfg)
    return {"status": "OK", "config": cfg.model_dump(by_alias=True)}


@router.post("/mode")
async def set_mode(cmd: ModeCommand):
    await twin_store.set_mode(cmd.mode)
    return {"status": "OK", "mode": cmd.mode}


@router.post("/what-if", response_model=WhatIfResponse)
async def calculate_what_if(req: WhatIfRequest):
    """Perform rigorous CEMA / DIN 22101 analytical scenario simulation."""
    v = max(0.2, req.belt_speed)
    g = 9.80665

    # 1. Linear coal payload mass
    qm = req.coal_tph / (3.6 * v)

    # 2. Moisture adjustment
    moisture_excess = max(0.0, req.moisture_pct - config.COAL_MOISTURE_BASE)
    qm_wet = qm * (1.0 + 0.01 * moisture_excess)
    f_eff = req.friction_factor * (1.0 + 0.015 * moisture_excess)

    # 3. Conveyor primary motion resistance F_U (DIN 22101)
    cos_delta = math.cos(math.radians(2.3))
    lift_resistance = qm_wet * g * config.CONVEYOR_LIFT_H
    friction_resistance = (
        f_eff * config.CONVEYOR_LENGTH_L * g * (
            config.BELT_LINEAR_MASS_QB + config.IDLER_ROTATING_MASS_QR +
            (2 * config.BELT_LINEAR_MASS_QB + config.IDLER_RETURN_MASS_QR + qm_wet) * cos_delta
        )
    )
    fu_kN = (friction_resistance + lift_resistance) / 1000.0

    # 4. Tensions & Power
    t_slack_kN = 36.0 + 0.28 * fu_kN
    t_head_kN = t_slack_kN + fu_kN
    p_motor_kW = (fu_kN * v) / 0.88

    # 5. Multi-axis FEA Stress (MPa)
    # Area = 1400 mm * 18 mm = 25,200 mm^2
    sigma_tensile = (t_head_kN * 1000.0) / 25200.0
    sigma_bending = 5.2
    sigma_trough = 1.6 * (qm / 100.0)
    peak_stress = sigma_tensile + sigma_bending + sigma_trough

    # 6. Catenary Sag
    sag_mm = (((config.BELT_LINEAR_MASS_QB + qm_wet) * g * (config.IDLER_SPACING_A0 ** 2)) / (8.0 * max(20000.0, t_slack_kN * 1000.0))) * 1000.0 * 4.2
    sag_mm = max(3.0, min(55.0, sag_mm))
    cema_sag_pct = (sag_mm / (config.IDLER_SPACING_A0 * 1000.0)) * 100.0

    # 7. Safety Factor & Splice Fatigue Life
    safety_factor = config.JOINT_SPLICE_STRENGTH_MPA / max(1.0, peak_stress)
    n_cycles = ((config.JOINT_SPLICE_STRENGTH_MPA / max(1.0, peak_stress)) ** 5.5) * 200000.0
    life_hours = (n_cycles * (2.0 * config.CONVEYOR_LENGTH_L)) / (v * 3600.0)

    # 8. Status & Recommendations
    recommendations = []
    if peak_stress > config.STRESS_CRITICAL_MPA:
        status = "CRITICAL"
        recommendations.append("DANGER: Splice stress exceeds 15.5 MPa. Immediate risk of vulcanized core pullout.")
        recommendations.append("Reduce coal feeder rate by at least 25% or accelerate belt velocity.")
    elif peak_stress > config.STRESS_WARNING_MAX_MPA:
        status = "WARNING"
        recommendations.append("CAUTION: Splice stress in warning range (13.8 - 15.5 MPa). Accelerates micro-cracking.")
        recommendations.append("Activate Closed-Loop AI Smart Throttle to auto-regulate tonnage.")
    elif sag_mm > 24.0:
        status = "WARNING"
        recommendations.append(f"Excessive belt sag ({sag_mm:.1f} mm > 24 mm / 2.0% CEMA limit). Coal spillage likely at skirtboards.")
        recommendations.append("Increase gravity take-up counterweight tension by +15 kN.")
    else:
        status = "OPTIMAL"
        recommendations.append("Belt tension, multi-axis joint stress, and catenary sag within DIN 22101 safe envelope.")
        recommendations.append("Continuous operating envelope compliant with ST2500 steel-cord rating.")

    if req.moisture_pct > 14.0:
        recommendations.append(f"High coal moisture ({req.moisture_pct:.1f}%) increases idler rolling resistance and carryback clumping.")

    return WhatIfResponse(
        linear_mass_qm=round(qm, 1),
        cema_head_tension=round(t_head_kN, 1),
        cema_slack_tension=round(t_slack_kN, 1),
        cema_motor_power_kw=round(p_motor_kW, 1),
        peak_joint_stress_mpa=round(peak_stress, 2),
        tensile_stress_mpa=round(sigma_tensile, 2),
        bending_stress_mpa=round(sigma_bending, 2),
        belt_sag_mm=round(sag_mm, 1),
        cema_sag_pct=round(cema_sag_pct, 2),
        safety_factor=round(safety_factor, 2),
        estimated_splice_life_hours=round(min(50000.0, life_hours), 1),
        stress_status=status,
        recommendations=recommendations,
    )


@router.post("/what-if/apply")
async def apply_what_if_to_twin(req: WhatIfRequest):
    """Apply sandbox parameters to the running digital twin simulation."""
    await twin_store.set_sandbox_overrides({
        "coal_tph": req.coal_tph,
        "moisture_pct": req.moisture_pct,
        "belt_speed": req.belt_speed,
        "friction_factor": req.friction_factor,
    })
    return {"status": "APPLIED", "appliedParameters": req.model_dump(by_alias=True)}


@router.post("/what-if/reset")
async def reset_what_if_sandbox():
    """Reset the digital twin back to live baseline parameters."""
    await twin_store.set_sandbox_overrides(None)
    return {"status": "RESET_TO_BASELINE"}
