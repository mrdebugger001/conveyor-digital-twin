from fastapi import APIRouter, HTTPException
from app.twin.state_store import twin_store
from app.ml.rule_based_health import JointReading, joint_risk_score

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.get("/{asset_id}")
async def get_prediction(asset_id: str):
    state = await twin_store.get_state()
    if not state:
        raise HTTPException(503, "Twin not ready")

    # --- Joint prediction ---
    short_id = asset_id.replace("joint-", "")
    if short_id in state.joint_health:
        j = state.joint_health[short_id]
        reading = JointReading(
            tension=j.tension,
            vibration=j.vibration,
            temperature=j.temperature,
            tracking_deviation=state.tracking,
            stress_mpa=j.stress_mpa,
            miner_damage=j.miner_damage,
        )
        risk, factors = joint_risk_score(reading)
        # Rough risk horizon: at 100 % risk → ~1 h; at 30 % risk → ~48 h
        horizon = max(1.0, (1.0 - risk) * 48.0) if risk > 0.3 else None
        return {
            "assetId": asset_id,
            "failureProbability": round(risk, 3),
            "healthScore": round(j.health, 1),
            "contributingFactors": factors,
            "riskHorizonHours": round(horizon, 1) if horizon is not None else None,
            "stressMpa": j.stress_mpa,
            "minerDamage": j.miner_damage,
        }

    # --- Motor prediction ---
    if asset_id == "motor-M01":
        m = state.motor
        temp_risk = max(0.0, (m.temperature - 70.0) / 30.0)
        factors = []
        if temp_risk > 0.2:
            factors.append(f"Elevated temperature ({m.temperature:.1f}°C)")
        if m.vibration > 3.0:
            factors.append(f"High vibration ({m.vibration:.1f} mm/s)")
        return {
            "assetId": asset_id,
            "failureProbability": round(min(1.0, temp_risk), 3),
            "healthScore": round(max(0.0, 100.0 - temp_risk * 100.0), 1),
            "contributingFactors": factors,
            "riskHorizonHours": None,
            "stressMpa": None,
            "minerDamage": None,
        }

    raise HTTPException(404, f"No prediction available for {asset_id}")
