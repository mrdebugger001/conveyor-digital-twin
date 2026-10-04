import asyncio
from typing import Optional, Dict, Any
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

        # Coal bulk stream & AI Smart Throttle state
        self._smart_throttle_enabled: bool = True
        self._smart_throttle_active: bool = False
        self._smart_throttle_derate_pct: float = 0.0
        self._target_coal_tph: float = 1200.0
        self._moisture_pct: float = 6.5
        self._sandbox_overrides: Optional[Dict[str, Any]] = None

        # Physics Profile & Real Data States
        self._tension_profile: Optional[Dict[str, Any]] = None
        self._residual_state: Optional[Dict[str, Any]] = None
        self._vibration_analytics: Optional[Dict[str, Any]] = None
        self._operating_profile: str = "CALIBRATED_SIMULATION_MODE"  # REAL_DATA_MODE, CALIBRATED_SIMULATION_MODE, DEMO_MODE

    async def set_physics_profile(
        self,
        tension_profile: Dict[str, Any],
        residual_state: Dict[str, Any],
        vibration_analytics: Dict[str, Any],
    ):
        async with self._lock:
            self._tension_profile = tension_profile
            self._residual_state = residual_state
            self._vibration_analytics = vibration_analytics

    async def get_tension_profile(self) -> Optional[Dict[str, Any]]:
        async with self._lock:
            return self._tension_profile

    async def get_residual_state(self) -> Optional[Dict[str, Any]]:
        async with self._lock:
            return self._residual_state

    async def get_vibration_analytics(self) -> Optional[Dict[str, Any]]:
        async with self._lock:
            return self._vibration_analytics

    async def set_operating_profile(self, profile: str):
        async with self._lock:
            self._operating_profile = profile

    async def get_operating_profile(self) -> str:
        async with self._lock:
            return self._operating_profile

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

    # AI Smart Throttle Controls
    async def set_smart_throttle(self, enabled: bool):
        async with self._lock:
            self._smart_throttle_enabled = enabled
            if not enabled:
                self._smart_throttle_active = False
                self._smart_throttle_derate_pct = 0.0

    async def get_smart_throttle_enabled(self) -> bool:
        async with self._lock:
            return self._smart_throttle_enabled

    async def update_smart_throttle_status(self, active: bool, derate_pct: float):
        async with self._lock:
            self._smart_throttle_active = active
            self._smart_throttle_derate_pct = derate_pct

    async def get_smart_throttle_status(self) -> tuple[bool, bool, float]:
        async with self._lock:
            return self._smart_throttle_enabled, self._smart_throttle_active, self._smart_throttle_derate_pct

    # Coal bulk settings
    async def set_coal_feed(self, tph: float, moisture: float):
        async with self._lock:
            self._target_coal_tph = max(0.0, min(2500.0, tph))
            self._moisture_pct = max(0.0, min(30.0, moisture))

    async def get_coal_feed(self) -> tuple[float, float]:
        async with self._lock:
            return self._target_coal_tph, self._moisture_pct

    # Sandbox overrides
    async def set_sandbox_overrides(self, overrides: Optional[Dict[str, Any]]):
        async with self._lock:
            self._sandbox_overrides = overrides

    async def get_sandbox_overrides(self) -> Optional[Dict[str, Any]]:
        async with self._lock:
            return self._sandbox_overrides


twin_store = TwinStateStore()
