from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import MaintenanceRecord

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.get("")
async def list_maintenance(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MaintenanceRecord).order_by(MaintenanceRecord.created_at.desc())
    )
    records = result.scalars().all()
    return [
        {
            "id": r.id,
            "assetId": r.asset_id,
            "description": r.description,
            "status": r.status,
            "priority": r.priority,
            "riskHorizonHours": r.risk_horizon_hours,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


@router.post("/{record_id}/close")
async def close_record(record_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MaintenanceRecord).where(MaintenanceRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(404, "Maintenance record not found")
    record.status = "CLOSED"
    await db.commit()
    return {"status": "CLOSED"}
