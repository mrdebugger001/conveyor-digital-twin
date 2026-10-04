from datetime import datetime, timezone, timedelta
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import MaintenanceRecord
from app.schemas.twin import SapDispatchWorkOrderRequest, SapDispatchWorkOrderResponse
from app.twin.state_store import twin_store

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


@router.post("/dispatch-sap", response_model=SapDispatchWorkOrderResponse)
async def dispatch_sap_work_order(req: SapDispatchWorkOrderRequest, db: AsyncSession = Depends(get_db)):
    """Auto-generates and dispatches a standardized SAP Plant Maintenance (PM) work order."""
    now = datetime.now(timezone.utc)
    clean_id = req.asset_id.replace("joint-", "").replace("motor-", "")
    is_joint = "joint" in req.asset_id or clean_id.startswith("J")
    
    # Generate SAP Work Order Number (e.g. WO-COAL-9023-VULC)
    order_suffix = clean_id.replace("J", "") if is_joint else "DRIVE"
    wo_id = f"WO-COAL-9{order_suffix}-VULC"
    equipment_tag = f"CV01-SPLICE-{clean_id}" if is_joint else f"CV01-DRIVE-{clean_id}"

    # Query current state to calibrate failure details
    state = await twin_store.get_state()
    stress_val = 14.8
    miner_val = 0.82
    if state and is_joint and clean_id in state.joint_health:
        j = state.joint_health[clean_id]
        stress_val = j.stress_mpa
        miner_val = j.miner_damage

    if is_joint:
        failure_mode = f"Multi-Axis Splice Fatigue Degradation (D = {miner_val:.2f}, Stress = {stress_val:.1f} MPa)"
        spare_parts = [
            "Hot Vulcanizing Splice Kit #STL-CORD-ST2500 (1400mm)",
            "Cover Rubber Tie Gum Strip (2.5mm Grade X)",
            "Steel Cord Alignment Clamps (Set of 8)",
            "Neoprene Cold-Bond Edge Adhesive (5L Can)",
        ]
        cost_est = 4850.0
        priority = "CRITICAL (P1)" if miner_val > 0.75 else "HIGH (P2)"
    else:
        failure_mode = "Drive Motor Stator Thermal Excursion & Bearing Eddy Currents"
        spare_parts = [
            "SKF 22320 CC/W33 Spherical Roller Bearing",
            "Mobil Polyrex EM Synthetic Grease (400g Cartridge)",
            "Laser Alignment Shims Pack",
        ]
        cost_est = 2600.0
        priority = "HIGH (P2)"

    description = f"[SAP PM {wo_id}] {failure_mode}. Assigned to {req.technician} with {req.downtime_window_hours}h window. {req.notes or ''}"

    # Persist into DB
    maint_record = MaintenanceRecord(
        asset_id=req.asset_id,
        description=description,
        status="DISPATCHED_SAP",
        priority="CRITICAL" if "CRITICAL" in priority else "HIGH",
        risk_horizon_hours=round(max(2.0, (1.0 - miner_val) * 36.0), 1) if is_joint else 24.0,
        created_at=now,
        updated_at=now,
    )
    db.add(maint_record)
    await db.commit()

    scheduled_start = now + timedelta(hours=1.5)

    return SapDispatchWorkOrderResponse(
        work_order_id=wo_id,
        asset_id=req.asset_id,
        equipment_tag=equipment_tag,
        sap_status="RELEASED_DISPATCHED",
        priority=priority,
        failure_mode=failure_mode,
        required_spare_parts=spare_parts,
        downtime_window_hours=req.downtime_window_hours,
        cost_estimate_usd=cost_est,
        scheduled_start=scheduled_start,
        dispatched_at=now,
        notification_msg=f"Work order {wo_id} successfully dispatched to SAP Plant Maintenance CMMS.",
    )
