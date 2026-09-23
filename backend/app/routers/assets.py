from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import Asset
from app.twin.state_store import twin_store

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("")
async def list_assets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Asset))
    assets = result.scalars().all()
    return [
        {
            "id": a.id,
            "name": a.name,
            "type": a.type,
            "parentId": a.parent_id,
            "status": a.status,
        }
        for a in assets
    ]


@router.get("/{asset_id}")
async def get_asset(asset_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(404, f"Asset {asset_id} not found")
    return {
        "id": asset.id,
        "name": asset.name,
        "type": asset.type,
        "parentId": asset.parent_id,
        "status": asset.status,
    }


@router.get("/{asset_id}/health")
async def get_asset_health(asset_id: str):
    state = await twin_store.get_state()
    if not state:
        raise HTTPException(503, "Twin not ready")

    if asset_id == "motor-M01":
        return {
            "assetId": asset_id,
            "health": round(100.0 - (state.motor.temperature / 2.0), 1),
            "status": state.motor.status,
        }

    # Joint lookup
    short_id = asset_id.replace("joint-", "")
    if short_id in state.joint_health:
        j = state.joint_health[short_id]
        return {
            "assetId": asset_id,
            "health": j.health,
            "status": j.status,
            "failureProbability": j.failure_probability,
        }

    return {"assetId": asset_id, "health": 100.0, "status": "NORMAL"}


@router.get("/{asset_id}/telemetry")
async def get_asset_telemetry(asset_id: str):
    state = await twin_store.get_state()
    if not state:
        raise HTTPException(503, "Twin not ready")
    return state.model_dump(by_alias=True, mode="json")
