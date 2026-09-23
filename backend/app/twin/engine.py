import asyncio
import math
import random
from collections import deque
from datetime import datetime, timezone, timedelta
from typing import Dict

from app import config
from app.schemas.twin import ConveyorState, JointState, MotorState
from app.twin.state_store import twin_store
from app.twin.fault_injection import apply_faults
from app.ml.rule_based_health import JointReading, joint_risk_score, joint_health, joint_status
from app.alarms.engine import alarm_engine

_tick = 0

# Initial joint baselines (slight random variation to look realistic)
_joint_baselines: Dict[str, dict] = {}


def _init_joint_baselines():
    for i in range(1, config.NUM_JOINTS + 1):
        jid = f"J{i:03d}"
        _joint_baselines[jid] = {
            "tension_base": 140.0 + random.uniform(-10, 10),
            "vibration_base": 1.5 + random.uniform(-0.5, 0.5),
            "temp_base": 58.0 + random.uniform(-5, 5),
        }


_init_joint_baselines()

# Motor state tracking (persistent across ticks)
_motor_state = {
    "rpm": 0.0,
    "temperature": 55.0,
    "vibration": 1.2,
    "current": 0.0,
    "power": 0.0,
}

# Real-time circular telemetry history buffer for live plotting
_telemetry_history = deque(maxlen=200)


def _init_telemetry_history():
    now = datetime.now(timezone.utc)
    for i in range(60):
        t_past = now - timedelta(seconds=(60 - i) * 2)
        _telemetry_history.append({
            "ts": t_past.isoformat(),
            "speed": 3.2 + random.uniform(-0.05, 0.05),
            "tension": 142.0 + random.uniform(-2, 2),
            "tracking": random.uniform(-0.3, 0.3),
            "load": 75.0 + random.uniform(-1, 1),
            "ore_flow": 82.0 + random.uniform(-2, 2),
            "motor_temperature": 58.0 + random.uniform(-0.5, 0.5),
            "motor_vibration": 1.3 + random.uniform(-0.1, 0.1),
            "motor_power": 268.0 + random.uniform(-5, 5),
            "joints": {
                f"J{j:03d}": {
                    "vibration": 1.4 + random.uniform(-0.2, 0.2),
                    "temperature": 56.0 + random.uniform(-1, 1),
                    "tension": 140.0 + random.uniform(-3, 3),
                    "health": 98.0,
                }
                for j in range(1, config.NUM_JOINTS + 1)
            },
        })


_init_telemetry_history()


def get_telemetry_history(asset_id: str, metric: str, points: int = 60) -> list:
    """Return actual time series recorded by the live simulation engine."""
    history_list = list(_telemetry_history)
    selected = history_list[-points:] if points < len(history_list) else history_list
    results = []

    clean_id = asset_id.replace("joint-", "")
    is_joint = clean_id.startswith("J")
    is_motor = asset_id == "motor-M01"

    for entry in selected:
        val = 0.0
        if is_joint and clean_id in entry.get("joints", {}):
            val = entry["joints"][clean_id].get(metric, 0.0)
        elif is_motor:
            if metric in ("vibration", "motor_vibration"):
                val = entry.get("motor_vibration", 0.0)
            elif metric in ("temperature", "motor_temperature"):
                val = entry.get("motor_temperature", 0.0)
            elif metric in ("power", "motor_power"):
                val = entry.get("motor_power", 0.0)
        else:
            if metric == "speed":
                val = entry.get("speed", 0.0)
            elif metric == "tension":
                val = entry.get("tension", 0.0)
            elif metric == "vibration":
                val = entry.get("motor_vibration", 0.0)
            elif metric in ("temperature", "motor_temperature"):
                val = entry.get("motor_temperature", 0.0)
            elif metric == "load":
                val = entry.get("load", 0.0)
            elif metric == "ore_flow":
                val = entry.get("ore_flow", 0.0)
            elif metric == "tracking":
                val = entry.get("tracking", 0.0)
        results.append({"ts": entry["ts"], "value": round(val, 2)})
    return results


async def run_simulation_loop(broadcast_fn):
    """Main async simulation loop. Calls broadcast_fn(state, new_alarms) each tick."""
    global _tick
    _tick = 0
    speed = 0.0
    belt_health = 96.0

    while True:
        await asyncio.sleep(config.TICK_INTERVAL)
        _tick += 1
        t = _tick * config.TICK_INTERVAL

        # --- Get control inputs ---
        run_cmd, estop = await twin_store.get_run_command()
        target_speed = await twin_store.get_target_speed()
        fault = await twin_store.get_fault_config()

        # --- Determine run state ---
        if estop:
            run_state = "FAULTED"
            target_speed = 0.0
        elif run_cmd == "START":
            run_state = "RUNNING" if speed > 0.05 else "STARTING"
        elif run_cmd == "STOP":
            run_state = "STOPPING" if speed > 0.05 else "STOPPED"
            target_speed = 0.0
        else:
            run_state = "STOPPED"
            target_speed = 0.0

        # --- First-order lag on speed ---
        speed += (target_speed - speed) * config.BELT_SPEED_LAG
        speed = max(0.0, min(config.BELT_MAX_SPEED, speed))
        if speed < 0.01:
            speed = 0.0

        # --- Natural oscillations (looks alive) ---
        load = 75.0 + math.sin(t * 0.07) * 5.0 + random.uniform(-1, 1)
        tracking = math.sin(t * 0.05) * 0.8 + random.uniform(-0.2, 0.2)
        tension = 140.0 + math.sin(t * 0.11) * 8.0 + speed * 4.0 + random.uniform(-2, 2)
        ore_flow = (speed / config.BELT_MAX_SPEED) * load * 1.8  # rough TPH

        # --- Motor derived values ---
        angular_velocity = speed / config.PULLEY_RADIUS  # rad/s
        pulley_rpm = angular_velocity * 60.0 / (2 * math.pi)
        motor_rpm = pulley_rpm * config.GEARBOX_RATIO

        _motor_state["rpm"] = motor_rpm
        # Temperature drifts toward target
        motor_target_temp = 62.0 if run_state == "RUNNING" else 45.0
        _motor_state["temperature"] += (
            motor_target_temp - _motor_state["temperature"]
        ) * 0.002
        _motor_state["temperature"] += random.uniform(-0.3, 0.3)
        _motor_state["vibration"] = (
            1.2 + math.sin(t * 0.15) * 0.3 + random.uniform(-0.1, 0.1)
        )
        _motor_state["current"] = (
            (speed / config.BELT_MAX_SPEED) * 85.0 + random.uniform(-2, 2)
            if config.BELT_MAX_SPEED > 0
            else 0.0
        )
        _motor_state["power"] = (
            (speed / config.BELT_MAX_SPEED) * 420.0 + random.uniform(-5, 5)
            if config.BELT_MAX_SPEED > 0
            else 0.0
        )

        motor_status: str
        if run_state not in ("RUNNING", "STARTING"):
            motor_status = "STOPPED"
        elif _motor_state["temperature"] > config.TEMP_WARNING_MAX + config.TEMP_CRITICAL_SPAN:
            motor_status = "CRITICAL"
        elif _motor_state["temperature"] > config.TEMP_WARNING_MAX:
            motor_status = "WARNING"
        else:
            motor_status = "NORMAL"

        motor = MotorState(
            id="M01",
            rpm=round(_motor_state["rpm"], 1),
            temperature=round(_motor_state["temperature"], 1),
            vibration=round(_motor_state["vibration"], 2),
            current=round(_motor_state["current"], 1),
            power=round(_motor_state["power"], 1),
            status=motor_status,
        )

        # --- Per-joint states ---
        joint_health_map: Dict[str, JointState] = {}
        for i in range(1, config.NUM_JOINTS + 1):
            jid = f"J{i:03d}"
            base = _joint_baselines[jid]
            # Small natural drift per joint
            jt = base["tension_base"] + math.sin(t * 0.05 + i) * 3.0 + random.uniform(-1, 1)
            jv = (
                base["vibration_base"]
                + math.sin(t * 0.08 + i * 0.3) * 0.3
                + random.uniform(-0.1, 0.1)
            )
            jtemp = (
                base["temp_base"]
                + math.sin(t * 0.04 + i * 0.2) * 2.0
                + random.uniform(-0.5, 0.5)
            )

            reading = JointReading(
                tension=jt, vibration=jv, temperature=jtemp, tracking_deviation=tracking
            )
            risk, _ = joint_risk_score(reading)
            jh = joint_health(reading)
            jstatus = joint_status(jh)

            joint_health_map[jid] = JointState(
                id=jid,
                health=round(jh, 1),
                temperature=round(jtemp, 1),
                vibration=round(jv, 2),
                tension=round(jt, 1),
                status=jstatus,
                failure_probability=round(risk, 3),
            )

        # --- Build mutable state dict for fault injection ---
        state_dict = {
            "id": "C01",
            "run_state": run_state,
            "speed": round(speed, 3),
            "target_speed": round(target_speed, 3),
            "load": round(max(0.0, min(100.0, load)), 1),
            "ore_flow": round(max(0.0, ore_flow), 1),
            "tension": round(tension, 1),
            "tracking": round(tracking, 2),
            "belt_health": round(max(0.0, min(100.0, belt_health)), 1),
            "joint_health": {k: v.model_dump(by_alias=False) for k, v in joint_health_map.items()},
            "motor": motor.model_dump(by_alias=False),
            "mode": "SIMULATION",
            "updated_at": datetime.now(timezone.utc),
        }

        # --- Apply fault injections ---
        state_dict = apply_faults(state_dict, fault, _tick)

        # --- Rebuild joint states after fault injection (recalculate health) ---
        for jid, j_data in state_dict["joint_health"].items():
            reading = JointReading(
                tension=j_data["tension"],
                vibration=j_data["vibration"],
                temperature=j_data["temperature"],
                tracking_deviation=state_dict["tracking"],
            )
            risk, _ = joint_risk_score(reading)
            jh = joint_health(reading)
            jstatus = joint_status(jh)
            j_data["health"] = round(jh, 1)
            j_data["status"] = jstatus
            j_data["failure_probability"] = round(risk, 3)

        # --- Rebuild motor status after faults ---
        m = state_dict["motor"]
        if state_dict["run_state"] not in ("RUNNING", "STARTING"):
            m["status"] = "STOPPED"
        elif m["temperature"] > config.TEMP_WARNING_MAX + config.TEMP_CRITICAL_SPAN:
            m["status"] = "CRITICAL"
        elif m["temperature"] > config.TEMP_WARNING_MAX:
            m["status"] = "WARNING"
        else:
            m["status"] = "NORMAL"

        conveyor_state = ConveyorState(**state_dict)
        await twin_store.set_state(conveyor_state)

        # Record into rolling history buffer for live graphs
        if _tick % 2 == 0:
            _telemetry_history.append({
                "ts": conveyor_state.updated_at.isoformat(),
                "speed": conveyor_state.speed,
                "tension": conveyor_state.tension,
                "tracking": conveyor_state.tracking,
                "load": conveyor_state.load,
                "ore_flow": conveyor_state.ore_flow,
                "motor_temperature": conveyor_state.motor.temperature,
                "motor_vibration": conveyor_state.motor.vibration,
                "motor_power": conveyor_state.motor.power,
                "joints": {
                    jid: {
                        "vibration": j.vibration,
                        "temperature": j.temperature,
                        "tension": j.tension,
                        "health": j.health,
                    }
                    for jid, j in conveyor_state.joint_health.items()
                },
            })

        # --- Run alarm engine ---
        new_alarms = await alarm_engine.evaluate(conveyor_state)

        # --- Broadcast to all WebSocket clients ---
        await broadcast_fn(conveyor_state, new_alarms)
