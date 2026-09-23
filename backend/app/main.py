import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import init_db
from app.db.seed import seed_database
from app.twin.engine import run_simulation_loop
from app.ws.realtime import manager
from app.routers import assets, alarms, control, simulator, predictions, maintenance, history


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    await init_db()
    await seed_database()
    sim_task = asyncio.create_task(run_simulation_loop(manager.broadcast))
    yield
    # --- Shutdown ---
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Iron Ore Conveyor Digital Twin API",
    version="0.1.0",
    description=(
        "Real-time digital twin backend for conveyor C01. "
        "Provides live telemetry via WebSocket, REST control, "
        "alarm management, and predictive health scoring."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REST Routers ---
app.include_router(assets.router)
app.include_router(alarms.router)
app.include_router(control.router)
app.include_router(simulator.router)
app.include_router(predictions.router)
app.include_router(maintenance.router)
app.include_router(history.router)


@app.get("/health", tags=["meta"])
async def health():
    """Basic liveness check."""
    return {"status": "ok", "service": "conveyor-digital-twin"}


@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time twin state + alarm push over WebSocket.

    Messages:
    - ``{"type": "twin_state", "payload": {...}}`` — every 0.5 s
    - ``{"type": "alarm_new",  "payload": {...}}`` — when alarm fires
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive; server pushes all data
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
