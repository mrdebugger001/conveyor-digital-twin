import json
from typing import Set
from fastapi import WebSocket
from app.schemas.twin import ConveyorState, Alarm


class ConnectionManager:
    def __init__(self):
        self.active: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.add(ws)

    def disconnect(self, ws: WebSocket):
        self.active.discard(ws)

    async def broadcast(self, state: ConveyorState, new_alarms: list[Alarm]):
        if not self.active:
            return

        state_msg = json.dumps(
            {
                "type": "twin_state",
                "payload": state.model_dump(by_alias=True, mode="json"),
            }
        )
        alarm_msgs = [
            json.dumps(
                {
                    "type": "alarm_new",
                    "payload": a.model_dump(by_alias=True, mode="json"),
                }
            )
            for a in new_alarms
        ]

        dead: Set[WebSocket] = set()
        for ws in self.active.copy():
            try:
                await ws.send_text(state_msg)
                for amsg in alarm_msgs:
                    await ws.send_text(amsg)
            except Exception:
                dead.add(ws)

        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()
