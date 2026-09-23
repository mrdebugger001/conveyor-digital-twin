from fastapi import APIRouter
from app.twin.state_store import twin_store
from app.schemas.twin import FaultInjectionConfig, ModeCommand

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


@router.get("/faults")
async def get_faults():
    config = await twin_store.get_fault_config()
    return config.model_dump(by_alias=True)


@router.post("/fault")
async def set_faults(config: FaultInjectionConfig):
    await twin_store.set_fault_config(config)
    return {"status": "OK", "config": config.model_dump(by_alias=True)}


@router.post("/mode")
async def set_mode(cmd: ModeCommand):
    await twin_store.set_mode(cmd.mode)
    return {"status": "OK", "mode": cmd.mode}
