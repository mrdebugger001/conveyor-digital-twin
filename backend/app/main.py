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

from app.routers import assets, alarms, control, simulator, predictions, maintenance, history, conveyor, analytics

# --- REST Routers ---
app.include_router(assets.router)
app.include_router(alarms.router)
app.include_router(control.router)
app.include_router(simulator.router)
app.include_router(predictions.router)
app.include_router(maintenance.router)
app.include_router(history.router)
app.include_router(conveyor.router)
app.include_router(analytics.router)


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


# --- Static Files & SPA Fallback (Production / Docker) ---
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
if not os.path.exists(STATIC_DIR):
    repo_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
    if os.path.exists(repo_dist):
        STATIC_DIR = repo_dist

if os.path.exists(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str = ""):
        if full_path.startswith("api") or full_path.startswith("ws"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")
        file_path = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"status": "ok", "service": "conveyor-digital-twin"}
