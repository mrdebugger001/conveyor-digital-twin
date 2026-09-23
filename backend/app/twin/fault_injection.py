import math
import random
from app.schemas.twin import FaultInjectionConfig


def apply_faults(state_dict: dict, fault: FaultInjectionConfig, tick: int) -> dict:
    """Apply fault-injection perturbations to a mutable state dict."""
    t = tick * 0.5  # time in seconds

    if fault.misalignment:
        state_dict["tracking"] = 4.5 + math.sin(t * 0.3) * 1.5

    if fault.high_tension:
        state_dict["tension"] = 170.0 + math.sin(t * 0.5) * 10.0

    if fault.high_vibration:
        state_dict["motor"]["vibration"] = 7.0 + random.uniform(-0.5, 0.5)

    if fault.motor_overheat:
        state_dict["motor"]["temperature"] = min(
            130.0, state_dict["motor"]["temperature"] + 0.5
        )

    if fault.bearing_failure:
        state_dict["motor"]["vibration"] = max(
            state_dict["motor"]["vibration"],
            9.0 + random.uniform(-1.0, 1.0),
        )
        state_dict["motor"]["temperature"] = min(
            140.0, state_dict["motor"]["temperature"] + 0.8
        )

    if fault.belt_tear:
        state_dict["belt_health"] = max(20.0, state_dict["belt_health"] - 0.3)
        state_dict["tracking"] = 6.0 + random.uniform(-1.0, 1.0)

    if fault.conveyor_jam:
        # Speed drops sharply, load spikes, tension spikes
        state_dict["speed"] = max(0.0, state_dict["speed"] - 0.5)
        state_dict["load"] = min(100.0, state_dict["load"] + 5.0)
        state_dict["tension"] = min(220.0, state_dict["tension"] + 10.0)

    if fault.joint_damage_enabled and fault.joint_damage_id:
        jid = fault.joint_damage_id
        if jid in state_dict["joint_health"]:
            j = state_dict["joint_health"][jid]
            # Immediate severe degradation for demo / testing
            j["vibration"] = 8.5 + math.sin(t * 0.7) * 1.5 + random.uniform(-0.2, 0.2)
            j["tension"] = 182.0 + math.sin(t * 0.4) * 8.0 + random.uniform(-1, 1)
            j["temperature"] = 88.0 + math.sin(t * 0.2) * 4.0 + random.uniform(-0.5, 0.5)

    return state_dict
