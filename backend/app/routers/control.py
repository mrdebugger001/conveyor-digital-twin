from fastapi import APIRouter, HTTPException
from app.twin.state_store import twin_store
from app.schemas.twin import SpeedCommand, SmartThrottleToggleCommand
from pydantic import BaseModel

router = APIRouter(prefix="/api/control", tags=["control"])


class CoalFeedCommand(BaseModel):
    coal_tph: float
    moisture_pct: float = 6.5


@router.post("/{asset_id}/start")
async def start_conveyor(asset_id: str):
    _, estop = await twin_store.get_run_command()
    if estop:
        raise HTTPException(409, "E-Stop is latched. Reset before starting.")
    await twin_store.set_run_command("START")
    return {"status": "STARTING"}


@router.post("/{asset_id}/stop")
async def stop_conveyor(asset_id: str):
    await twin_store.set_run_command("STOP")
    return {"status": "STOPPING"}


@router.post("/{asset_id}/reset")
async def reset_conveyor(asset_id: str):
    await twin_store.set_run_command("RESET")
    return {"status": "RESET"}


@router.post("/{asset_id}/speed")
async def set_speed(asset_id: str, cmd: SpeedCommand):
    state = await twin_store.get_state()
    if state and state.run_state == "STOPPED":
        raise HTTPException(409, "Cannot set speed while conveyor is stopped.")
    if cmd.target_speed < 0 or cmd.target_speed > 5.0:
        raise HTTPException(400, "Speed must be between 0.0 and 5.0 m/s")
    await twin_store.set_target_speed(cmd.target_speed)
    return {"status": "OK", "targetSpeed": cmd.target_speed}


@router.post("/{asset_id}/estop")
async def estop_conveyor(asset_id: str):
    await twin_store.set_run_command("ESTOP")
    return {"status": "ESTOP_LATCHED"}


@router.post("/{asset_id}/smart-throttle")
async def toggle_smart_throttle(asset_id: str, cmd: SmartThrottleToggleCommand):
    await twin_store.set_smart_throttle(cmd.enabled)
    enabled, active, derate = await twin_store.get_smart_throttle_status()
    return {
        "status": "OK",
        "smartThrottleEnabled": enabled,
        "smartThrottleActive": active,
        "deratePct": derate,
    }


@router.post("/{asset_id}/coal-feed")
async def set_coal_feed(asset_id: str, cmd: CoalFeedCommand):
    await twin_store.set_coal_feed(cmd.coal_tph, cmd.moisture_pct)
    return {
        "status": "OK",
        "targetCoalTph": cmd.coal_tph,
        "moisturePct": cmd.moisture_pct,
    }
