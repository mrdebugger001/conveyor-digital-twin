# Conveyor C01: Physics-Based + Real-Data-Calibrated Industrial Digital Twin

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-orange.svg?style=flat-square)](https://sih.gov.in)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.111-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/Frontend-React_18_TypeScript-61DAFB.svg?style=flat-square&logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/3D_Engine-Three.js_r164-black.svg?style=flat-square&logo=three.js)](https://threejs.org)
[![Standard](https://img.shields.io/badge/Conveyor_Standard-DIN_22101_|_CEMA-blue.svg?style=flat-square)](#3-mathematical-modeling--first-principles-physics-core)
[![Vibration Standard](https://img.shields.io/badge/Vibration_Standard-ISO_10816--3-red.svg?style=flat-square)](#4-machine-learning--vibration-condition-monitoring)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat-square&logo=docker)](#7-deployment--execution-guide)

---

## 1. Executive Summary & Problem Context

In heavy mining, port loading, and bulk material handling facilities, overland belt conveyors represent mission-critical lifeline assets. An unexpected catastrophic failure—such as a longitudinal belt rip, splice pullout, motor burnout, or seized idler bearing—can cause **unplanned plant downtime costing upwards of \$50,000 to \$120,000 per hour**, catastrophic safety hazards, and massive logistical gridlock.

Current industrial Supervisory Control and Data Acquisition (SCADA) systems rely on rudimentary scalar threshold trips (e.g., simple temperature alarms or limit switches). These static approaches fail to detect progressive sub-surface degradation, mechanical fatigue accumulation, or dynamic resonance.

### The Solution: First-Principles Digital Twin
The **Conveyor C01 Digital Twin** replaces artificial, random simulators with a **deterministic, First-Principles physics simulation engine** calibrated against real-world industrial condition monitoring datasets.

$$\mathbf{\text{Real Data}} + \mathbf{\text{Physics Model}} + \mathbf{\text{Data Calibration}} + \mathbf{\text{State Estimation}} + \mathbf{\text{Fault/Anomaly Detection}} = \mathbf{\text{Realistic Digital Twin}}$$

### Real-World Asset Benchmark: Conveyor C01
- **Asset ID**: C01 Overland Troughed Belt Conveyor
- **Target Material**: Crushed Run-of-Mine (ROM) Iron Ore ($\rho_{\text{bulk}} = 2400 \text{ kg/m}^3$)
- **Design Throughput**: $1200 \text{ metric tonnes/hour (TPH)}$ at nominal belt speed $v = 3.2 \text{ m/s}$
- **Conveyor Geometry**: Center-to-center length $L = 350.0 \text{ m}$, total belt loop $L_{\text{total}} = 718.0 \text{ m}$, vertical lift $H = 18.5 \text{ m}$ ($\theta = 3.03^\circ$)
- **Belt Specification**: DIN 22131 ST2500 steel-cord belt ($W = 1200 \text{ mm}$, thickness $t_b = 20 \text{ mm}$, linear mass $q_b = 32.5 \text{ kg/m}$)
- **Splice Configuration**: 24 vulcanized field splices with individual kinematic spatial tracking and cumulative fatigue counters
- **Drive System**: $450 \text{ kW}$ 4-pole squirrel-cage induction motor with parallel-shaft helical gearbox ($i = 12.5$) and ceramic-lagged drive pulley ($D_p = 1.0 \text{ m}$)

---

## 2. End-to-End System Architecture

The application is structured into six decoupled, deterministic architectural layers operating over a bidirectional 2 Hz WebSocket pipeline and sub-25 ms round-trip latency:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        1. CONFIGURATION & PROVENANCE REGISTRY                          │
│   conveyor.yaml (Physical specs)  ·  provenance.yaml (Pedigree & uncertainty ratings)  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼─────────────────────────────────────────────┐
│                      2. FIRST-PRINCIPLES MULTI-PHYSICS CORE                            │
│  Eulerian Material Continuity ──▶ DIN 22101 / CEMA Motion Resistance ──▶ 1D Tension    │
│  Euler-Eytelwein Drive Slip Limit ──▶ Electro-Thermal Motor ODE ──▶ Catenary Belt Sag  │
│  24-Splice Kinematic Tracking ──▶ FEA Stress Concentration ──▶ Palmgren-Miner Fatigue  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼─────────────────────────────────────────────┐
│                  3. DATASET INGESTION & VIBRATION ML PIPELINE                          │
│  CWRU Bearing Data · Paderborn MCSA Current · Mendeley Belt Dynamics · NASA IMS Bearings│
│  Butterworth Filter ──▶ 7 Statistical Features ──▶ FFT Spectral Defect Frequencies    │
│  ISO 10816-3 Severity Zones (A, B, C, D) ──▶ Multi-Criteria Joint Health Scoring       │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼─────────────────────────────────────────────┐
│                4. ANALYTICAL REDUNDANCY & RESIDUAL STATE ESTIMATION                    │
│  Physics Residual Engine: r(t) = y_meas(t) - y_pred(t) ──▶ CUSUM & Z-Score Anomaly     │
│  Fault Isolation (Sensor Drift vs Mechanical Failure) ──▶ Scipy L-BFGS-B Calibration   │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼─────────────────────────────────────────────┐
│               5. RUNTIME SIMULATION ENGINE & TELEMETRY STREAM                          │
│  Asyncio 500ms Tick ──▶ Twin State Store ──▶ WebSocket (/ws/realtime) & REST (/api/*)  │
│  Tier-1 Threshold Alarms ──▶ Tier-2 Combinational Rules ──▶ SQLite Event Journal       │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼─────────────────────────────────────────────┐
│                       6. INDUSTRIAL HMI & PRESENTATION LAYER                           │
│  React 18 + TypeScript + Zustand Store · Three.js 3D WebGL Canvas (Ore stream & FEA)   │
│  7 Diagnostic Modals: Tension Profile · Vibration FFT · Splice Inspector · What-If     │
│  Model Validation · Provenance Pedigree · SAP Plant Maintenance Work Order Dispatch    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mathematical Modeling & First-Principles Physics Core

The physics engine adheres strictly to **DIN 22101** (*Continuous conveyors: Belt conveyors for bulk materials*) and the **CEMA 7th Edition** (*Conveyor Equipment Manufacturers Association*) standards.

### 3.1 Eulerian Bulk Material Flow Continuity
Material mass transport along the carrying run is modeled as a continuous one-dimensional mass density stream:

- **Mass Throughput Conversion**:
  $$\dot{m}(t) = \frac{\text{TPH}(t)}{3.6} \quad [\text{kg/s}]$$
- **Linear Payload Mass Density**:
  $$q_m(t) = \begin{cases} \frac{\dot{m}(t)}{v(t)} & \text{if } v(t) \ge 0.05 \text{ m/s} \\ q_{m,\text{held}} & \text{if } v(t) < 0.05 \text{ m/s} \end{cases} \quad [\text{kg/m}]$$
- **Numerical Validation**:
  $$\text{At } \text{TPH} = 1200 \text{ and } v = 3.2 \text{ m/s}: \quad q_m = \frac{1200}{3.6 \times 3.2} = 104.1667 \text{ kg/m}$$
- **Instantaneous Material Inventory on Conveyor**:
  $$M_{\text{inventory}}(t) = \int_{0}^{L_{\text{carrying}}} q_m(s, t) \, ds \quad [\text{kg}]$$

### 3.2 DIN 22101 Motion Resistance Formulation
The total steady-state motion resistance force $F_U$ is decomposed into primary frictional resistance $F_H$, secondary localized resistances $F_N$, and gravitational slope lift $F_{\text{st}}$:

$$F_U = F_H + F_N + F_{\text{st}} \quad [\text{N}]$$

1. **Primary Resistance ($F_H$)**:
   Accounts for idler roller bearing friction and viscoelastic indentation rolling resistance of the rubber covers:
   $$F_H = f \cdot L \cdot g \cdot \left[ (q_b + q_{Rc} + q_m) \cos\theta + (q_b + q_{Rr}) \cos\theta \right]$$
   - $f$: Artificial resistance coefficient ($f = 0.0200$, calibrated via field telemetry)
   - $q_b = 32.5 \text{ kg/m}$: Linear mass of the belt
   - $q_{Rc} = 23.33 \text{ kg/m}$: Equivalent rotating mass of 3-roll troughing carry idlers ($28 \text{ kg}$ set spaced at $1.2 \text{ m}$)
   - $q_{Rr} = 10.00 \text{ kg/m}$: Equivalent rotating mass of flat return idlers ($30 \text{ kg}$ set spaced at $3.0 \text{ m}$)
   - $g = 9.80665 \text{ m/s}^2$: Acceleration due to gravity

2. **Secondary Resistances ($F_N$)**:
   Aggregates skirtboard friction, scraper drag, feed chute acceleration resistance, and pulley bearing seal losses:
   $$F_N = C_{\text{skirt}} \cdot \mu_{\text{ore}} \cdot q_m \cdot g \cdot L_{\text{skirt}} + F_{\text{scraper}} + \dot{m} \cdot (v - v_0) + \sum F_{\text{wrap}}$$

3. **Slope Resistance ($F_{\text{st}}$)**:
   Gravitational work required to lift the bulk ore over vertical height $H = L \sin\theta$:
   $$F_{\text{st}} = q_m \cdot g \cdot H = q_m \cdot g \cdot L \sin\theta$$

### 3.3 1D Continuous Spatial Belt Tension Profile $T(s)$
Belt tension varies continuously along the coordinate path $s \in [0, L_{\text{total}}]$. Rather than using constant lumped approximations, tension is governed by the spatial differential equation:

$$\frac{dT}{ds} = g \cdot q(s) \cdot \left[ f(s) \cos\theta(s) \pm \sin\theta(s) \right] + w_{\text{local}}(s)$$

Numerical integration is discretized over $N = 100$ spatial grid segments from the tail pulley ($s = 0$) to the head drive pulley ($s = L$):

$$T(s_k) = T(s_{k-1}) + \Delta s \cdot \left[ g \cdot q(s_k) \cdot (f \cos\theta_k + \sin\theta_k) \right]$$

- **Tail / Take-Up Tension ($T_2$)**: Governed by gravity counterweight trolley balance to maintain minimum belt sag and prevent drive slippage:
  $$T_{\text{tail}} = T_2 = \frac{1}{2} M_{\text{counterweight}} \cdot g = 85.0 \text{ kN}$$
- **Head / Drive Tension ($T_1$)**:
  $$T_{\text{head}} = T_1 = T_2 + F_U$$

### 3.4 Euler-Eytelwein Drive Traction & Slip Limit
To transmit torque from the drive pulley to the belt without slip, the tension ratio must satisfy the fundamental Euler-Eytelwein boundary:

$$\frac{T_1 - T_b}{T_2 - T_b} \le e^{\mu_{\text{drive}} \cdot \alpha_{\text{wrap}}}$$

- $\mu_{\text{drive}} = 0.38$: Friction coefficient of ceramic grooved pulley lagging
- $\alpha_{\text{wrap}} = 210^\circ = 3.665 \text{ rad}$: Wrap angle of the dual-snubbed drive head pulley
- **Maximum Transmissible Tension**:
  $$T_{1,\text{max}} = T_2 \cdot e^{0.38 \times 3.665} = T_2 \cdot e^{1.3927} \approx 4.026 \cdot T_2$$
- **Slip Margin / Slip Risk Index**:
  $$\text{Slip Risk Index} = \frac{T_1 - T_2}{T_2 \cdot (e^{\mu \alpha} - 1)}$$
  *(Alarm triggers when Slip Risk Index exceeds $0.85$)*.

### 3.5 Belt Sag Criterion Between Idlers
Excessive belt sag between idler sets causes material spillage, flexure fatigue, and dynamic bounce. The mid-span catenary deflection $y_{\text{sag}}$ is governed by:

$$y_{\text{sag}}(s) = \frac{(q_b + q_m(s)) \cdot g \cdot a_0^2}{8 \cdot T(s)} \quad [\text{m}]$$

$$\text{Sag Ratio } \% = \frac{y_{\text{sag}}(s)}{a_0} \times 100\%$$

- $a_0 = 1.2 \text{ m}$: Carry idler spacing
- **Compliance Limit**: DIN 22101 mandates that maximum carrying belt sag shall not exceed **$1.0\%$** under full load ($12.0 \text{ mm}$).

### 3.6 Electromechanical Drive & Thermal Motor ODE
1. **Shaft Mechanical Power & Torque**:
   $$P_{\text{mech}}(t) = \frac{F_U(t) \cdot v(t)}{1000 \cdot \eta_{\text{drive}}} \quad [\text{kW}], \quad \tau_{\text{motor}}(t) = \frac{P_{\text{mech}}(t)}{\omega_{\text{motor}}(t)}$$
   $$\omega_{\text{motor}} = \frac{v}{\pi \cdot D_p} \cdot 60 \cdot i \quad [\text{RPM}]$$
   - $\eta_{\text{drive}} = \eta_{\text{gearbox}} \cdot \eta_{\text{bearings}} = 0.95 \times 0.98 = 0.931$
   - $i = 12.5$: Parallel shaft helical gearbox ratio

2. **First-Order Thermal Heating Model (IEC 60034-1)**:
   $$C_{\text{th}} \frac{d T_{\text{motor}}}{dt} = P_{\text{loss}}(t) - \frac{T_{\text{motor}}(t) - T_{\text{ambient}}}{R_{\text{th}}}$$
   $$P_{\text{loss}}(t) = I_{\text{stator}}^2 R + P_{\text{core}} + P_{\text{friction}}$$

### 3.7 Splice Kinematics, FEA Stress & Wöhler Fatigue Damage
Conveyor C01 features **24 vulcanized steel-cord splices (J001–J024)** spaced evenly along the $718 \text{ m}$ total belt loop.

1. **Spatial Kinematic Motion**:
   $$s_i(t) = \left( s_{i,0} + \int_{0}^t v(\tau) \, d\tau \right) \pmod{L_{\text{total}}}$$

2. **Combined Splice Stress ($\sigma_{\text{comb}}$)**:
   As splice $i$ travels around the conveyor loop, it experiences combined tensile and pulley bending stresses:
   $$\sigma_{\text{tensile}, i}(t) = \frac{T(s_i(t))}{W \cdot t_b \cdot \eta_{\text{splice}}} \quad [\text{MPa}]$$
   $$\sigma_{\text{bending}, i}(t) = \begin{cases} \frac{E_{\text{cord}} \cdot d_{\text{cord}}}{D_{\text{pulley}}} & \text{if } s_i(t) \in \text{Pulley Wrap Zones} \\ 0 & \text{otherwise} \end{cases} \quad [\text{MPa}]$$
   $$\sigma_{\text{comb}, i}(t) = \alpha_k \cdot \sigma_{\text{tensile}, i}(t) + \sigma_{\text{bending}, i}(t)$$
   - $\alpha_k = 1.35$: Stress concentration factor due to rubber shear transfer between staggered cords
   - $\eta_{\text{splice}} = 0.85$: DIN 22131 splice efficiency factor

3. **Goodman Mean Stress Correction**:
   $$\sigma_a = \frac{\sigma_{\text{max}} - \sigma_{\text{min}}}{2}, \quad \sigma_m = \frac{\sigma_{\text{max}} + \sigma_{\text{min}}}{2}$$
   $$\sigma_{a,\text{eq}} = \frac{\sigma_a}{1 - \frac{\sigma_m}{R_m}}$$
   - $R_m = 2500 \text{ N/mm}$: Nominal belt tensile rating

4. **Palmgren-Miner Cumulative Fatigue Damage**:
   $$\text{Allowable Cycles to Failure: } N_i = N_D \cdot \left( \frac{\sigma_D}{\sigma_{a,\text{eq}}} \right)^m$$
   $$\text{Cumulative Fatigue Index: } D_i = \sum_{k=1}^K \frac{n_k}{N_k}, \quad D_i \in [0.0, 1.0]$$
   $$\text{Remaining Useful Life (RUL): } \text{RUL}_i = \frac{1.0 - D_i}{\dot{D}_i \cdot 3600 \times 24} \quad [\text{days}]$$

---

## 4. Machine Learning & Vibration Condition Monitoring

Condition monitoring for motor bearings, gearbox shafts, and idler rolls combines statistical time-domain moments, Fourier spectral defect analysis, and physics-data hybrid residual estimators.

```
Raw Accelerometer Signal x(t) [CWRU / Paderborn / NASA IMS / Mendeley]
       │
       ▼
Butterworth Bandpass Filter (10 Hz – 10 kHz)
       │
       ├────────────────────────────────────────┬────────────────────────────────────────┐
       ▼                                        ▼                                        ▼
Time-Domain Statistics                   Envelope Demodulation (Hilbert)          Physics Analytical Redundancy
• RMS, Peak, Kurtosis, Skewness          • Rectification & Lowpass Filter         • y_measured(t) - y_physics(t)
• Crest, Shape, Impulse Factors          • FFT Power Spectral Density             • CUSUM Change Point Detection
       │                                        │                                        │
       ▼                                        ▼                                        ▼
ISO 10816-3 Severity Zones               Kinematic Defect Frequencies             Sensor Drift vs Mechanical Trip
Zone A / B / C / D                       BPFO · BPFI · BSF · FTF                  Isolation & Parameter Calibration
       └────────────────────────────────────────┬────────────────────────────────────────┘
                                                │
                                                ▼
                               Unified Health Index [0–100%]
```

### 4.1 Statistical Time-Domain Feature Extraction
For sampled vibration signal vector $\mathbf{x} = [x_1, x_2, \dots, x_N]$:

| Feature | Mathematical Definition | Physical Diagnostic Significance |
| :--- | :--- | :--- |
| **Root Mean Square (RMS)** | $x_{\text{RMS}} = \sqrt{\frac{1}{N}\sum_{i=1}^N x_i^2}$ | Overall vibration energy; baseline severity indicator |
| **Peak Value** | $x_{\text{peak}} = \max(|x_i|)$ | Captures sharp repetitive impacts from spalling |
| **Kurtosis ($K$)** | $K = \frac{\frac{1}{N}\sum_{i=1}^N (x_i - \bar{x})^4}{\sigma^4}$ | Tail heaviness; $K > 3.0$ indicates impulsive bearing spall |
| **Skewness ($S$)** | $S = \frac{\frac{1}{N}\sum_{i=1}^N (x_i - \bar{x})^3}{\sigma^3}$ | Asymmetry of acceleration waveform |
| **Crest Factor ($CF$)** | $CF = \frac{x_{\text{peak}}}{x_{\text{RMS}}}$ | Ratio of peak impact to steady background vibration |
| **Shape Factor ($SF$)** | $SF = \frac{x_{\text{RMS}}}{\frac{1}{N}\sum_{i=1}^N \|x_i\|}$ | Waveform contour; sensitive to structural loosening |
| **Impulse Factor ($IF$)** | $IF = \frac{x_{\text{peak}}}{\frac{1}{N}\sum_{i=1}^N \|x_i\|}$ | Highly sensitive to incipient rolling-element pitting |

### 4.2 Kinematic Bearing Defect Frequencies (Envelope FFT)
Bearing geometry parameters (pitch diameter $D$, roller diameter $d$, contact angle $\alpha$, number of rolling elements $n$) and shaft rotational speed $f_r = \frac{\text{RPM}}{60}$ govern characteristic fault harmonics:

1. **Ball Pass Frequency Outer Race (BPFO)**:
   $$\text{BPFO} = \frac{n}{2} \cdot f_r \cdot \left( 1 - \frac{d}{D} \cos\alpha \right)$$
2. **Ball Pass Frequency Inner Race (BPFI)**:
   $$\text{BPFI} = \frac{n}{2} \cdot f_r \cdot \left( 1 + \frac{d}{D} \cos\alpha \right)$$
3. **Ball Spin Frequency (BSF)**:
   $$\text{BSF} = \frac{D}{2d} \cdot f_r \cdot \left[ 1 - \left( \frac{d}{D} \cos\alpha \right)^2 \right]$$
4. **Fundamental Train / Cage Frequency (FTF)**:
   $$\text{FTF} = \frac{1}{2} \cdot f_r \cdot \left( 1 - \frac{d}{D} \cos\alpha \right)$$

### 4.3 ISO 10816-3 Vibration Severity Classification
Vibration velocity RMS levels for Large Industrial Machines (Class III: Rigid Foundation, $P > 300 \text{ kW}$):
- **Zone A (Green, $< 2.3 \text{ mm/s}$)**: Newly commissioned, pristine condition
- **Zone B (Light Green, $2.3 - 4.5 \text{ mm/s}$)**: Normal unrestricted continuous operation
- **Zone C (Amber, $4.5 - 7.1 \text{ mm/s}$)**: Unsatisfactory; restricted operation, schedule repair
- **Zone D (Red, $> 7.1 \text{ mm/s}$)**: Critical danger; immediate shutdown / trip to prevent catastrophic seizure

### 4.4 Physics-Data Hybrid Residual State Tracking
To eliminate false alarms caused by variable operating loads, the twin calculates analytical residuals:

$$r_P(t) = P_{\text{measured}}(t) - \hat{P}_{\text{physics}}(t)$$
$$r_T(t) = T_{\text{measured}}(t) - \hat{T}_{\text{physics}}(t)$$

- **Sensor Drift vs. Mechanical Trip Isolation**:
  - If $r_P(t) \approx 0$ but $r_T(t) \gg 0$: Load cell drift / transducer calibration error.
  - If $r_P(t) \gg 0$ and $r_T(t) \gg 0$: Physical mechanical resistance escalation (seized idler roll bank, chute blockage, or skirt jamming).

---

## 5. Calibration Datasets Used in Depth

Four world-renowned public condition monitoring and machine degradation benchmarks were used to calibrate and validate the Digital Twin:

### 5.1 Case Western Reserve University (CWRU) Bearing Data Center
- **Origin**: Bearing Data Center, Case Western Reserve University, Cleveland, OH.
- **Physical Testbed**: 2 HP Reliance Electric induction motor, dynamometer torque loading (0, 1, 2, 3 HP), deep-groove ball bearings (SKF 6205-2RS drive-end and SKF 6203-2RS fan-end).
- **Sensors & Sampling**: Accelerometers installed at 12 o'clock positions; sampling rates of $12,000 \text{ Hz}$ and $48,000 \text{ Hz}$.
- **Fault Types**: Electro-discharge machining (EDM) induced single-point faults:
  - Inner Race (fault diameters: $0.007''$, $0.014''$, $0.021''$, $0.028''$)
  - Outer Race (centered at 6 o'clock, 3 o'clock, and 12 o'clock)
  - Rolling Element / Ball Faults
- **Twin Calibration Role**: Serves as the ground-truth benchmark for motor drive-end bearing spectral harmonics, verifying that envelope FFT peak energy aligns exactly with calculated BPFO and BPFI.

### 5.2 Paderborn University Bearing Data Center
- **Origin**: Chair of Design and Drive Technology (KAt), Paderborn University, Germany.
- **Physical Testbed**: Modular drive test rig testing 64 bearings under varying radial forces ($1000 - 10,000 \text{ N}$), motor speeds ($1500 - 3000 \text{ RPM}$), and load torques.
- **Sensors**: Synchronous acquisition of piezo-accelerometer vibration, motor 3-phase stator currents via current clamps, torque sensor, rotational speed encoder, and thermocouple oil temperature.
- **Fault Types**:
  - Artificially induced EDM pits and single electrical discharge indentations
  - Naturally developed fatigue damage through accelerated lifetime testing under heavy radial overload
- **Twin Calibration Role**: Calibrates the multi-domain correlation between Motor Current Signature Analysis (MCSA) stator harmonics and high-frequency bearing housing vibration.

### 5.3 Mendeley Experimental Belt Drive Vibration Dataset
- **Origin**: University of Johannesburg / Mendeley Data repository.
- **Physical Testbed**: Industrial flat/troughed belt drive test bench with variable center distances, adjustable take-up pretension, and interchangeable driver/driven pulleys.
- **Sensors**: Tri-axial accelerometers mounted on driver and driven bearing pillow blocks, laser optical tachometers for instantaneous belt slip, and static load cells.
- **Fault Types**: Healthy belt baseline, misaligned pulley shafts, eccentric pulleys, dynamic unbalance, and spliced belt local thickness variations.
- **Twin Calibration Role**: Directly calibrates the belt flutter, transverse string vibration, and localized tension perturbation injected into the 1D spatial grid as splices pass over pulleys.

### 5.4 NASA IMS (Intelligent Maintenance Systems) Bearing Run-to-Failure Dataset
- **Origin**: Center for Intelligent Maintenance Systems, University of Cincinnati / NASA Prognostics Center of Excellence.
- **Physical Testbed**: 4 Rexnord ZA-2115 double-row spherical roller bearings on a single rotating shaft driven by an AC motor at a constant $2000 \text{ RPM}$ under a continuous $6000 \text{ lb}$ radial spring load.
- **Sensors**: PCB 353B33 high-frequency accelerometers recording 1-second snapshots (20,480 samples at $20 \text{ kHz}$) every 10 minutes.
- **Fault Types**: Complete run-to-failure lifecycles spanning over 30 days and 100 million revolutions, concluding with catastrophic outer race spalling and roller element cracking.
- **Twin Calibration Role**: Calibrates the exponential degradation trajectory and Palmgren-Miner S-N damage accumulation curve, ensuring that failure probability remains near 0.0 during initial cycles and curves sharply upward as spalling initiates.

### 5.5 Data Provenance & Pedigree Registry (`provenance.yaml`)
To ensure total industrial transparency, every single constant, physical coefficient, and sensor threshold in Conveyor C01 is cataloged with its pedigree rating:

| Pedigree Tier | Definition | Examples in Twin |
| :--- | :--- | :--- |
| `REAL_MEASURED` | Direct field measurements from calibrated sensors | Ambient temperature, belt speed tachometer |
| `MANUFACTURER_SPECIFIED` | OEM equipment technical datasheet values | Motor power ($450 \text{ kW}$), belt modulus ($E_b = 2.4 \text{ GPa}$) |
| `STANDARD_REFERENCE` | International engineering standards | DIN 22101 friction factor ($f = 0.020$), ISO 10816-3 limits |
| `DATASET_CALIBRATED` | Parameter tuned against experimental benchmarks | CWRU envelope filter cutoff, NASA IMS degradation curve |
| `ESTIMATED` | Engineering derivation based on first-principles | Secondary resistance coefficient ($C_{\text{skirt}}$) |
| `DEMO_ONLY` | Injected fault states for simulator stress testing | Manual splice damage override, belt rip flag |

---

## 6. Industrial HMI & Interactive 3D Diagnostics

The user interface follows the **Material Design 3 Dark Theme** industrial ergonomics standard, prioritizing high-contrast legibility, zero clutter, and dark-room control cabin compliance:

### 6.1 3D Digital Twin Viewport (Three.js / React Three Fiber)
- **Kinematic Belt Simulation**: Procedural UV texture translation synchronized to live belt speed $v(t)$.
- **Dynamic Ore Particle Stream**: Instanced mesh particles with stochastic scatter, changing volume and height with live material load percentage.
- **24 Vulcanized Splice Markers**: 3D spatial markers positioned around the loop; color-coded dynamically based on localized FEA stress and health score (**Green $\rightarrow$ Amber $\rightarrow$ Red**).
- **Physical Equipment Assets**: Head drive pulley, tail take-up pulley, snub pulleys, troughing roller idler frames, and drive motor housing with live thermal glow shaders.

### 6.2 The 7 Deep-Dive Industrial Modals
1. **1D Continuous Tension Profile Modal**: Visualizes tension $T(s)$ along all 100 spatial segments, overlaying allowable belt ratings and slack limits.
2. **Spectral Vibration Diagnostics Modal**: Live Envelope FFT spectrum displaying 1X/2X shaft harmonics, BPFO, BPFI, BSF, and FTF defect markers.
3. **Optical Splice Inspector Modal**: Simulated ultrasonic and electromagnetic cord scanner displaying cord alignment, tensile stress, and residual fatigue life for each of the 24 splices.
4. **What-If Operational Sandbox**: Sliders allowing operators to adjust throughput, speed, friction factor, and take-up mass to preview power demand and sag compliance before changing physical plant settings.
5. **Model Validation Modal**: Side-by-side comparison of physics-predicted metrics against empirical benchmark datasets, complete with $R^2$, RMSE, and residual metrics.
6. **Data Provenance & Pedigree Registry Modal**: Full inspection table showing the origin, standard reference, confidence interval, and uncertainty margin of every model parameter.
7. **SAP Plant Maintenance (PM) Dispatch Modal**: Generates standardized industrial work order notifications (IW21/IW31 format) with priority horizons, recommended technician actions, and required spare parts.

---

## 7. Deployment & Execution Guide

The repository supports three deployment workflows depending on the host machine environment:

### Option 1: 1-Click Standalone Portable Run (Needs ONLY Python — Zero Node.js Required!)
Because the production 3D frontend is pre-compiled into `frontend/dist`, you **do not even need Node.js or npm installed**:
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/conveyor-digital-twin.git
   cd conveyor-digital-twin
   ```
2. Double-click:
   ```cmd
   run-portable.bat
   ```
3. The script verifies Python 3.10+, installs dependencies from `backend/requirements.txt`, starts the unified FastAPI server on port 8000, and automatically opens `http://localhost:8000` in your default browser.

---

### Option 2: Full Developer Environment (Python + Node.js with Hot-Reloading)
For active development with Vite HMR and FastAPI automatic reload:
1. Double-click **`start-all.bat`**, or launch both terminals manually:
   ```bash
   # Terminal 1: Backend API & WebSocket
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

   # Terminal 2: Frontend Vite Dev Server
   cd frontend
   npm install
   npm run dev
   ```
2. Open `http://localhost:3000` (proxied to backend on port 8000).

---

### Option 3: Production Docker Container
Run as a single multi-stage, hardened Docker container:
```bash
# Using Docker Compose
docker compose up -d

# Or using the 1-click script
scripts\docker_build_run.bat
```
- Open `http://localhost:8000`
- To export a standalone shareable image tarball:
  ```bash
  scripts\docker_export.bat
  # Produces conveyor-digital-twin.tar
  ```

---

### ⚡ 5-Second USB Flash Transfer Pro-Tip
If copying the project to another computer via a USB pen drive:
> **Delete or exclude `frontend/node_modules/` before copying!**  
> `node_modules` contains >40,000 tiny files (~250 MB) which take 15–20 minutes to copy over Windows Explorer. Without `node_modules`, the entire repository is only **~35 MB** and transfers in **3 to 5 seconds**. The app runs immediately via `run-portable.bat` because `frontend/dist` is already built!

---

## 8. Repository Structure

```
conveyor-digital-twin/
├── .dockerignore                     # Docker build exclusions
├── .gitignore                        # GitHub single-repo exclusions
├── docker-compose.yml                # Docker compose configuration
├── Dockerfile                        # Multi-stage production container build
├── README.md                         # This comprehensive architecture & physics guide
├── run-portable.bat                  # 1-click standalone launcher (Python only)
├── start-all.bat                     # Full dev launcher (FastAPI + Vite)
├── TECHNICAL_FEATURES.md             # Complete mathematical specification document
├── TECHNICAL_FEATURES.pdf            # PDF publication of the technical specification
│
├── backend/                          # FastAPI Backend & Digital Twin Engine
│   ├── requirements.txt              # Locked Python dependencies
│   ├── app/
│   │   ├── main.py                   # FastAPI app, static SPA mount & WebSocket
│   │   ├── config/
│   │   │   ├── conveyor.yaml         # Physical specifications of Conveyor C01
│   │   │   ├── provenance.yaml       # Data provenance & uncertainty registry
│   │   │   └── loader.py             # Pydantic configuration loader
│   │   ├── physics/                  # First-Principles Physics Solvers
│   │   │   ├── material_flow.py      # Eulerian bulk material continuity
│   │   │   ├── resistance.py         # DIN 22101 / CEMA motion resistance
│   │   │   ├── tension.py            # 1D continuous spatial tension solver T(s)
│   │   │   ├── drive.py              # Euler-Eytelwein traction & motor power
│   │   │   ├── sag.py                # Catenary belt sag between idlers
│   │   │   ├── splices.py            # 24-splice kinematic tracking & FEA stress
│   │   │   └── fatigue.py            # Palmgren-Miner S-N damage accumulation
│   │   ├── ml/                       # Machine Learning & Signal Processing
│   │   │   ├── vibration/
│   │   │   │   ├── features.py       # 7 statistical time-domain moments
│   │   │   │   ├── spectral.py       # FFT & kinematic defect frequencies
│   │   │   │   └── iso_severity.py   # ISO 10816-3 severity zones
│   │   │   └── rule_based_health.py  # Analytical health index calculation
│   │   ├── data/                     # Dataset Ingestion Adapters
│   │   │   ├── cwru_loader.py        # Case Western Reserve bearing adapter
│   │   │   ├── paderborn_loader.py   # Paderborn MCSA & vibration adapter
│   │   │   ├── belt_drive_loader.py  # Mendeley belt vibration adapter
│   │   │   └── nasa_ims_loader.py    # NASA IMS run-to-failure adapter
│   │   ├── twin/
│   │   │   ├── engine.py             # 500ms async simulation loop
│   │   │   ├── state_store.py        # Central in-memory state repository
│   │   │   └── fault_injection.py    # Simulator fault perturbation injection
│   │   ├── alarms/                   # Tier-1 & Tier-2 Alarm Matrix
│   │   ├── routers/                  # REST API Endpoints (/api/*)
│   │   └── schemas/                  # Pydantic v2 schemas
│   └── tests/                        # Pytest automated test suites
│
├── frontend/                         # React 18 + Three.js 3D Web Application
│   ├── package.json                  # Frontend dependencies
│   ├── vite.config.ts                # Vite build & proxy configuration
│   ├── dist/                         # Pre-compiled high-performance 3D SPA
│   └── src/
│       ├── components/three/         # Three.js 3D Viewport Components
│       │   ├── Belt.tsx              # Procedural UV-animated conveyor belt
│       │   ├── Conveyor.tsx          # Idlers, pulleys, structure & splices
│       │   └── OreParticles.tsx      # Instanced iron ore bulk stream
│       ├── components/hmi/           # Industrial HMI & Diagnostic Modals
│       │   ├── TopBar.tsx            # Connection, clock, and mode switcher
│       │   ├── KpiBar.tsx            # 7 live industrial KPI readouts
│       │   ├── ControlPanel.tsx      # Start/Stop/Reset/E-STOP panel
│       │   ├── AssetInspector.tsx    # Detailed diagnostic asset sidebar
│       │   ├── TensionProfileModal.tsx # 1D continuous tension profile
│       │   ├── VibrationDiagnosticsModal.tsx # Envelope FFT spectrum
│       │   ├── OpticalSpliceInspectorModal.tsx # Splice FEA stress scanner
│       │   ├── WhatIfSandboxModal.tsx # Operational scenario simulator
│       │   ├── ModelValidationModal.tsx # DIN 22101 benchmark validation
│       │   ├── ProvenanceModal.tsx   # Pedigree & uncertainty registry
│       │   └── SapDispatchModal.tsx  # SAP PM work order dispatch
│       ├── store/twinStore.ts        # Zustand reactive state store
│       └── api/                      # WebSocket and REST client
│
├── docs/                             # Engineering documentation & whitepapers
│   ├── physics_model.md              # DIN 22101 derivation details
│   ├── fatigue_model.md              # Wöhler S-N curve & Miner's rule
│   ├── vibration_model.md            # Bearing defect frequency equations
│   ├── dataset_mapping.md            # Benchmark dataset mapping
│   └── docker_deployment.md          # Container deployment guide
└── scripts/                          # Automation scripts
    ├── docker_build_run.bat          # 1-click Docker build & run
    ├── docker_export.bat             # 1-click Docker image export (.tar)
    ├── validate_physics.py           # Automated DIN 22101 validation script
    └── validate_datasets.py          # Dataset ingestion test script
```

---

## 9. SIH 2026 Innovation Highlights

| Innovation Dimension | Conventional SCADA / Simulation | Conveyor C01 Digital Twin |
| :--- | :--- | :--- |
| **Physics Grounding** | Random noise generator around constant mean | Deterministic DIN 22101 Eulerian continuity & resistance solvers |
| **Tension Profile** | Single scalar tension value everywhere | 1D spatial integration across 100 segments with local slope $\theta(s)$ |
| **Belt Sag Evaluation** | Ignored or treated as constant | Dynamic catenary sag calculated between idler spans ($y_{\text{sag}} \le 1.0\%$) |
| **Splice Condition** | Visual manual walk-around inspection | 24-splice individual kinematic tracking with Wöhler S-N fatigue RUL |
| **Drive Traction** | Constant motor current threshold | Euler-Eytelwein friction limit with live slip risk indexing |
| **Vibration Analytics** | Scalar overall RMS vibration | Envelope FFT harmonics (BPFO, BPFI, BSF, FTF) + ISO 10816-3 zones |
| **Anomaly Detection** | Simple threshold trips | Physics-data hybrid residual tracking ($y_{\text{meas}} - \hat{y}_{\text{physics}}$) |
| **Data Provenance** | Opaque assumptions & hidden numbers | 6-tier pedigree classification with confidence intervals in `provenance.yaml` |
| **Deployment** | Complex multi-server setup | 1-Click portable runner (Python only), full dev mode, or Docker container |

---

## 10. Standards & Engineering References

1. **DIN 22101:2014-12**: *Continuous conveyors — Belt conveyors for bulk materials — Bases for calculation and dimensioning*. Deutsches Institut für Normung.
2. **CEMA 7th Edition (2014)**: *Belt Conveyors for Bulk Materials*. Conveyor Equipment Manufacturers Association.
3. **DIN 22131:1988-11**: *Steel cord conveyor belts for bulk materials handling — Splices and joint dimensions*.
4. **ISO 10816-3:2009**: *Mechanical vibration — Evaluation of machine vibration by measurements on non-rotating parts — Part 3: Industrial machines with nominal power above 15 kW*.
5. **IEC 60034-1**: *Rotating electrical machines — Part 1: Rating and performance*.
6. **Case Western Reserve University**: *Bearing Data Center Seeded Fault Test Results*, Cleveland, OH.
7. **Paderborn University**: *Condition Monitoring Data of Rolling Bearings (KAt Data Center)*, Germany.
8. **NASA Prognostics Data Repository**: *IMS Bearing Run-to-Failure Dataset*, University of Cincinnati.
9. **Miner, M. A. (1945)**: *Cumulative damage in fatigue*. Journal of Applied Mechanics, 12(3), A159-A164.

---

## 11. License & Academic Attribution
Developed for the **Smart India Hackathon (SIH 2026)**.  
Licensed under the **Apache License, Version 2.0**.
