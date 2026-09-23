from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship, backref
from datetime import datetime, timezone
from app.db.session import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True)  # e.g. "motor-M01"
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # motor, joint, belt, ...
    parent_id = Column(String, ForeignKey("assets.id"), nullable=True)
    conveyor_id = Column(String, default="C01")
    status = Column(String, default="NORMAL")

    children = relationship(
        "Asset",
        backref=backref("parent", remote_side="Asset.id"),
        foreign_keys=[parent_id],
    )


class AlarmRecord(Base):
    __tablename__ = "alarms"

    id = Column(String, primary_key=True)
    asset_id = Column(String, nullable=False)
    type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="OPEN")  # OPEN, IN_PROGRESS, CLOSED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    risk_horizon_hours = Column(Float, nullable=True)
    priority = Column(String, default="MEDIUM")


class TelemetryRecord(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String, nullable=False)
    metric = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    ts = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
