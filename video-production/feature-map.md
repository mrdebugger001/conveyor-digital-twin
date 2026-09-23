# Feature Map — Iron Ore Conveyor Digital Twin

## Tier A — Essential

| Feature | Location | User purpose | How it works | Visual / technical importance | Video duration | Demonstration |
|---|---|---|---|---|---|---|
| Live Digital Twin HMI | `/` | Monitor conveyor C01 in real time | FastAPI simulation broadcasts state over WebSocket to a React/Zustand HMI and Three.js scene | Very high / very high | 22s | Establish the 3D conveyor, state, KPIs, and control bar. |
| Fault Injection Simulator | `/` → Simulator | Safely model abnormal operating conditions | REST fault configuration drives the twin engine and health/alarm rules | High / very high | 20s | Enable joint damage on J023 and show the resulting state change. |
| Asset Diagnostics | `/` → Splice J023 | Inspect asset health and contributing factors | Live data plus predictive health endpoint populate the inspector | High / high | 16s | Open J023 inspector after injecting damage. |
| Alarm Workflow | `/alarms` | Prioritize and acknowledge operating events | Rule engine creates alarms; REST acknowledgement updates status | High / high | 14s | Show severity filtering and acknowledgement-ready records. |

## Tier B — Important

| Feature | Location | User purpose | How it works | Visual / technical importance | Video duration | Demonstration |
|---|---|---|---|---|---|---|
| Telemetry Analytics | `/analytics` | See live trends and joint-fleet health | Recharts plots Zustand WebSocket history; health matrix reflects current joints | High / high | 22s | Pan across four live streams and the 24-joint matrix. |
| Maintenance Recommendations | `/maintenance` | Turn risk signals into planned work | FastAPI/SQLite maintenance records surface priority and risk horizon | Medium / high | 12s | Show prioritized maintenance cards. |
| Operator Controls | `/` | Run, stop, reset, adjust speed, or emergency-stop the simulated conveyor | State-machine REST control API | Medium / high | 10s | Show control bar while the twin is live. |

## Tier C — Supporting

| Feature | Location | User purpose | How it works | Visual / technical importance | Video duration | Demonstration |
|---|---|---|---|---|---|---|
| Twin camera/render modes | `/` | Reframe the industrial asset | Three.js camera preset and rendering mode controls | Medium / medium | 6s | Brief camera-mode cut in the opening. |
| Light/dark preference | Top bar | Adapt viewing environment | Client-side theme state | Low / low | 0s | Not shown. |

## Tier D — Not Worth Showing

Settings and repetitive control adjustments are intentionally omitted: they do not improve the product story in a two-and-a-half-minute film.
