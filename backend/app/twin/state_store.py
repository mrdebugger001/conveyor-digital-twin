import asyncio
from typing import Optional
from app.schemas.twin import ConveyorState, FaultInjectionConfig


class TwinStateStore:
    def __init__(self):
        self._state: Optional[ConveyorState] = None
        self._fault_config: FaultInjectionConfig = FaultInjectionConfig()
        self._lock = asyncio.Lock()
        self._target_speed: float = 3.2
        self._run_command: str = "STOP"  # STOP | START | ESTOP
        self._estop_latched: bool = False
        self._mode: str = "SIMULATION"

    async def get_state(self) -> Optional[ConveyorState]:
        async with self._lock:
            return self._state

    async def set_state(self, state: ConveyorState):
        async with self._lock:
            self._state = state

    async def get_fault_config(self) -> FaultInjectionConfig:
        async with self._lock:
            return self._fault_config

    async def set_fault_config(self, config: FaultInjectionConfig):
        async with self._lock:
            self._fault_config = config

    async def set_target_speed(self, speed: float):
        async with self._lock:
            self._target_speed = max(0.0, min(5.0, speed))

    async def get_target_speed(self) -> float:
        async with self._lock:
            return self._target_speed

    async def set_run_command(self, cmd: str):
        async with self._lock:
            if cmd == "ESTOP":
                self._estop_latched = True
                self._run_command = "STOP"
            elif cmd == "START" and self._estop_latched:
                return  # cannot start while estop latched
            elif cmd == "RESET":
                self._estop_latched = False
                self._run_command = "STOP"
                return
            else:
                self._run_command = cmd

    async def get_run_command(self) -> tuple[str, bool]:
        async with self._lock:
            return self._run_command, self._estop_latched

    async def set_mode(self, mode: str):
        async with self._lock:
            self._mode = mode

    async def get_mode(self) -> str:
        async with self._lock:
            return self._mode


twin_store = TwinStateStore()
