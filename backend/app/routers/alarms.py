from fastapi import APIRouter, HTTPException
from app.alarms.engine import alarm_engine
from app.schemas.twin import AcknowledgeRequest

router = APIRouter(prefix="/api/alarms", tags=["alarms"])


@router.get("")
async def list_alarms(
    severity: str = None,
    acknowledged: bool = None,
    limit: int = 100,
):
    alarms = list(reversed(alarm_engine.all_alarms))

    if severity:
        alarms = [a for a in alarms if a.severity == severity.upper()]

    if acknowledged is not None:
        alarms = [a for a in alarms if a.acknowledged == acknowledged]

    return [a.model_dump(by_alias=True, mode="json") for a in alarms[:limit]]


@router.post("/{alarm_id}/acknowledge")
async def acknowledge_alarm(alarm_id: str, body: AcknowledgeRequest):
    ok = await alarm_engine.acknowledge(alarm_id, body.acknowledged_by)
    if not ok:
        raise HTTPException(404, "Alarm not found")
    return {"status": "acknowledged"}
