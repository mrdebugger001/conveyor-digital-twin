from app.db.session import AsyncSessionLocal
from app.db.models import Asset, MaintenanceRecord
from datetime import datetime, timezone

ASSET_TREE = [
    {"id": "conveyor-C01", "name": "Conveyor C01", "type": "conveyor", "parent_id": None},
    {"id": "motor-M01", "name": "Drive Motor M01", "type": "motor", "parent_id": "conveyor-C01"},
    {"id": "gearbox-GB01", "name": "Gearbox GB01", "type": "gearbox", "parent_id": "conveyor-C01"},
    {"id": "pulley-HP01", "name": "Head Pulley HP01", "type": "pulley", "parent_id": "conveyor-C01"},
    {"id": "pulley-TP01", "name": "Tail Pulley TP01", "type": "pulley", "parent_id": "conveyor-C01"},
    {"id": "belt-B01", "name": "Belt B01", "type": "belt", "parent_id": "conveyor-C01"},
    {"id": "takeup-01", "name": "Take-Up Trolley 01", "type": "takeup", "parent_id": "conveyor-C01"},
    {"id": "chute-01", "name": "Feed Chute 01", "type": "chute", "parent_id": "conveyor-C01"},
    {"id": "scraper-01", "name": "Belt Scraper 01", "type": "scraper", "parent_id": "conveyor-C01"},
    {"id": "estop-01", "name": "E-Stop Station 01", "type": "estop", "parent_id": "conveyor-C01"},
    {"id": "estop-02", "name": "E-Stop Station 02", "type": "estop", "parent_id": "conveyor-C01"},
]

# Add 24 joints
for i in range(1, 25):
    ASSET_TREE.append({
        "id": f"joint-J{i:03d}",
        "name": f"Belt Joint J{i:03d}",
        "type": "joint",
        "parent_id": "belt-B01",
    })

MAINT_RECORDS = [
    {
        "asset_id": "joint-J023",
        "description": "Increasing vibration and elevated tension detected. Inspect splice.",
        "status": "OPEN",
        "risk_horizon_hours": 18.0,
        "priority": "CRITICAL",
    },
    {
        "asset_id": "motor-M01",
        "description": "Motor temperature trending above normal. Schedule lubrication.",
        "status": "OPEN",
        "risk_horizon_hours": 72.0,
        "priority": "HIGH",
    },
    {
        "asset_id": "joint-J011",
        "description": "Minor vibration anomaly detected. Monitor closely.",
        "status": "OPEN",
        "risk_horizon_hours": 120.0,
        "priority": "MEDIUM",
    },
]


async def seed_database():
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select

        result = await session.execute(select(Asset).limit(1))
        if result.scalar_one_or_none() is not None:
            return  # already seeded

        for a in ASSET_TREE:
            session.add(Asset(**a))

        for m in MAINT_RECORDS:
            session.add(
                MaintenanceRecord(
                    **m,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )

        await session.commit()
