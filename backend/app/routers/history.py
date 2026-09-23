from fastapi import APIRouter
from app.twin.engine import get_telemetry_history

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/{asset_id}")
async def get_history(asset_id: str, metric: str = "speed", points: int = 60):
    """Return actual historical time series recorded from the live simulation engine.
    
    Reflects live faults (motor overheat, joint damage, tension spikes) in real time.
    """
    data = get_telemetry_history(asset_id, metric, points)
    return {"assetId": asset_id, "metric": metric, "data": data}
