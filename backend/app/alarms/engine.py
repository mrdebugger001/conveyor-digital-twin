from typing import Dict, List
from app.schemas.twin import ConveyorState, Alarm
from app.alarms.rules import check_tension, check_tracking, check_motor, check_joints
from app.db.session import AsyncSessionLocal
from app.db.models import AlarmRecord
from datetime import datetime, timezone


class AlarmEngine:
    def __init__(self):
        # Track active alarm types to avoid spam (key = asset_id:alarm_type)
        self._active: Dict[str, Alarm] = {}
        self._cooldown: Dict[str, float] = {}  # key -> last_fired_tick
        self._tick = 0
        self.all_alarms: List[Alarm] = []  # in-memory list for REST queries

    def _alarm_key(self, a: Alarm) -> str:
        return f"{a.asset_id}:{a.type}"

    async def evaluate(self, state: ConveyorState) -> List[Alarm]:
        self._tick += 1
        candidate_alarms: List[Alarm] = []
        candidate_alarms.extend(check_tension(state))
        candidate_alarms.extend(check_tracking(state))
        candidate_alarms.extend(check_motor(state))
        candidate_alarms.extend(check_joints(state))

        new_alarms: List[Alarm] = []

        for alarm in candidate_alarms:
            key = self._alarm_key(alarm)
            last_tick = self._cooldown.get(key, -999)
            # Fire at most once every ~10 seconds (20 ticks × 0.5 s)
            if self._tick - last_tick >= 20:
                self._cooldown[key] = self._tick
                self._active[key] = alarm
                self.all_alarms.append(alarm)
                # Keep list bounded to last 500 alarms
                if len(self.all_alarms) > 500:
                    self.all_alarms = self.all_alarms[-500:]
                new_alarms.append(alarm)
                # Persist to DB (fire-and-forget; errors are swallowed)
                await self._persist(alarm)

        return new_alarms

    async def _persist(self, alarm: Alarm):
        try:
            async with AsyncSessionLocal() as session:
                record = AlarmRecord(
                    id=alarm.id,
                    asset_id=alarm.asset_id,
                    type=alarm.type,
                    severity=alarm.severity,
                    value=alarm.value,
                    threshold=alarm.threshold,
                    message=alarm.message,
                    timestamp=alarm.timestamp,
                    acknowledged=False,
                )
                session.add(record)
                await session.commit()
        except Exception:
            pass  # Don't crash the sim loop on DB errors

    async def acknowledge(self, alarm_id: str, by: str) -> bool:
        for a in self.all_alarms:
            if a.id == alarm_id:
                a.acknowledged = True
                a.acknowledged_by = by
                a.acknowledged_at = datetime.now(timezone.utc)
                # Update DB
                try:
                    async with AsyncSessionLocal() as session:
                        from sqlalchemy import update

                        await session.execute(
                            update(AlarmRecord)
                            .where(AlarmRecord.id == alarm_id)
                            .values(
                                acknowledged=True,
                                acknowledged_by=by,
                                acknowledged_at=a.acknowledged_at,
                            )
                        )
                        await session.commit()
                except Exception:
                    pass
                return True
        return False


alarm_engine = AlarmEngine()
