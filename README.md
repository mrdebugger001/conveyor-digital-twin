# Iron Ore Conveyor Digital Twin

A real-time web-based Digital Twin + HMI for an iron-ore conveyor system (C01), built for SIH 2026.

## Architecture

```
Simulated Conveyor (Python asyncio loop)
        │
        ▼
   Backend (FastAPI) — Digital Twin Engine
        │  WebSocket /ws/realtime + REST /api/*
        ▼
   Frontend State Store (Zustand) — single source of truth
        │
   ┌────┼────────────┬─────────────┐
   ▼    ▼             ▼             ▼
 3D Scene   HMI Panels   Alarms   Charts/Analytics
```

## Stack

| Layer | Tech |
|---|---|
| 3D Rendering | Three.js via @react-three/fiber + drei |
| UI | React 18 + TypeScript + Tailwind CSS |
| State | Zustand |
| Charts | Recharts |
| Backend | Python 3.11 + FastAPI |
| Realtime | WebSocket `/ws/realtime` |
| Database | SQLite (aiosqlite) — swap for Postgres+TimescaleDB |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```powershell
cd backend
pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Features (MVP)

- ✅ **Live 3D Digital Twin** — belt, rollers, pulleys, motor, ore particles, joints
- ✅ **Real-time HMI** — 7 KPI metrics updating at 2Hz from backend
- ✅ **Alarm Engine** — tier-1 threshold + tier-2 combinational rules
- ✅ **Asset Inspector** — click any joint/motor in 3D to see live diagnostics + failure probability
- ✅ **Fault Injection Simulator** — toggle misalignment, high tension, motor overheat, joint damage, belt tear, conveyor jam
- ✅ **Control Panel** — Start / Stop / Reset / E-STOP with state machine validation
- ✅ **Analytics Page** — trend charts for speed, tension, vibration, temperature + joint health bar chart
- ✅ **Maintenance Page** — recommendation cards with risk horizon estimates
- ✅ **Alarms Page** — filterable table with severity color-coding + acknowledge workflow

## Screens

1. **Main Digital Twin View** — 3D scene + KPI bar + alarm bar + control panel
2. **Asset Inspector** — populated on click, shows health score, failure probability, contributing factors
3. **Alarms Page** — full alarm table with filter chips
4. **Fault Injection Dialog** — simulator controls (dev/demo tool)
5. **Control Panel** — operator command bar always visible on twin view
6. **Analytics Page** — 2×2 chart grid + joint health overview
7. **Maintenance Page** — AI-generated recommendations with risk horizons

## Demo Script

1. Open the app — observe `C01 RUNNING`, speed 3.2 m/s, load 75%
2. Open **Simulator** → toggle **Joint damage** → select J023 → watch health degrade, alarm fires, 3D joint turns amber→red
3. Click **J023** in the scene → inspector shows failure probability climbing with contributing factors
4. Click **STOP** → belt, rollers, ore all freeze
5. Acknowledge the alarm → toggle fault off → health recovers

## Project Structure

```
conveyor-digital-twin/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI + WebSocket
│       ├── config.py            # All thresholds (calibrate for real equipment)
│       ├── twin/engine.py       # Simulation loop (500ms tick)
│       ├── alarms/              # Rule-based alarm engine
│       ├── ml/                  # Rule-based health scoring
│       └── routers/             # REST endpoints
└── frontend/
    └── src/
        ├── components/three/    # 3D scene components
        ├── components/hmi/      # HMI panels
        ├── pages/               # 7 screen pages
        ├── store/               # Zustand stores
        └── api/                 # REST client + WebSocket
```
