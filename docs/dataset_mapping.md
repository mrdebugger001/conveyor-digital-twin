# Condition Monitoring Dataset Mapping & Calibration Reference

## 1. Scientific Integrity & Data Provenance Philosophy
To maintain rigorous scientific and engineering integrity for the Smart India Hackathon (SIH 2026), this digital twin explicitly delineates between:
1. **First-Principles Deterministic Physics Models** (governed by continuum mechanics, DIN 22101, CEMA 7th Edition, Euler-Eytelwein, and Palmgren-Miner rules).
2. **Empirical Reference Datasets** (used for parameter calibration, sensor noise characterization, and baseline defect signature benchmarking).

> [!IMPORTANT]
> The public datasets referenced herein (CWRU, Paderborn, Mendeley, NASA IMS) are canonical industrial condition monitoring benchmarks. They serve as **calibration reference baselines** and **defect envelope validators**. The digital twin does **not** falsely claim that these public laboratory datasets were recorded directly from Conveyor C01 in the field.

---

## 2. Ingested Dataset Matrix

| Dataset | Origin & Authors | Mapped Conveyor Component | Telemetry Channels | Sample Rate | Operating Envelope | Calibration Purpose |
|---|---|---|---|---|---|---|
| **CWRU Bearing Data** | Case Western Reserve University (Loparo et al.) | Drive Motor M01 Drive-End & Non-Drive End Bearings (SKF 6205 / 6203) | Accelerometer (Drive End DE, Fan End FE, Base) | 12 kHz & 48 kHz | 0–3 HP Load, 1797–1730 RPM | Defect frequency envelope (BPFO, BPFI, BSF, FTF) & kurtosis shock metrics |
| **Paderborn University Bearing Dataset** | Paderborn University KatData (Lessmeier et al., 2016) | Drive Motor M01 Stator Current & Bearings | 3-Phase Motor Current ($I_u, I_v, I_w$), Vibration, Torque, Radial Load | 64 kHz | Controlled speeds, radial loads up to 10 kN | Motor Current Signature Analysis (MCSA) & current-vibration sideband synchronization |
| **Mendeley Belt Drive Dataset** | Mendeley Data (Industrial Belt Drive Faults) | Belt B01 & Idler Roll Assemblies | Multi-axial Vibration, Speed, Tension | 5 kHz | Variable belt speeds (1–5 m/s), Tight/Slack tensions | Idler passing frequency ($f_{\text{idler}}$), belt strand transverse resonance, tracking misalignment |
| **NASA IMS Run-to-Failure** | Center for Intelligent Maintenance Systems (Qiu, Lee, Lin 2006) | Head Pulley HP01 Pillow Block Spherical Roller Bearings | Accelerometers (Ch 1–4 across 4 bearings) | 20.48 kHz | 2000 RPM, 6000 lbs radial load, 35-day run to failure | Bathtub degradation curve, kurtosis early warning spike, Remaining Useful Life (RUL) trajectory |

---

## 3. Component-by-Component Mapping Details

### 3.1 Drive Motor M01 Bearings (CWRU Bearing Data Center)
- **Physical Asset**: 450 kW 4-pole Squirrel Cage Induction Motor driving Conveyor C01 head pulley through a 24.2:1 planetary helical gearbox.
- **Reference Bearing**: SKF 6205-2RS JEM deep groove ball bearing on drive end.
- **Calibrated Kinematic Multipliers**:
  - Cage Speed ($\text{FTF}$): $0.3982 \times f_{\text{shaft}}$
  - Outer Race ($\text{BPFO}$): $3.5848 \times f_{\text{shaft}}$
  - Inner Race ($\text{BPFI}$): $5.4152 \times f_{\text{shaft}}$
  - Ball Spin ($\text{BSF}$): $2.3570 \times f_{\text{shaft}}$
- **Digital Twin Role**:
  Under healthy operation, background vibration reflects 1X and 2X shaft rotational harmonics with Gaussian noise. When a bearing fault condition is injected or simulated, decaying structural resonance ringdowns ($f_{\text{res}} \approx 3200\text{–}3500\text{ Hz}$) appear at the precise theoretical kinematic frequencies.

### 3.2 Motor Current Signature Analysis (Paderborn KatData)
- **Physical Asset**: 415 V 50 Hz stator electrical feed to Motor M01.
- **Calibrated Dynamics**:
  Synchronized motor phase current displaying characteristic MCSA sidebands:
  $$f_{\text{sideband}} = |f_{\text{supply}} \pm k \cdot f_{\text{vibration}}|$$
- **Digital Twin Role**:
  Provides analytical redundancy. If mechanical bearing vibration spikes, the twin verifies whether corresponding stator current sidebands are present, distinguishing electrical noise from true mechanical loading.

### 3.3 Belt B01 Transverse Resonance (Mendeley Belt Drive)
- **Physical Asset**: Continental ContiTech ST2500 steel-cord conveyor belt on 1.2 m carrying idler pitch.
- **Calibrated Dynamics**:
  - Idler roll passing frequency: $f_{\text{idler}} = \frac{v}{\pi \cdot D_{\text{idler}}} = \frac{3.2}{\pi \times 0.152} \approx 6.70\text{ Hz}$
  - Belt strand fundamental transverse frequency:
    $$f_{\text{strand}} = \frac{1}{2 L_i} \sqrt{\frac{T}{q_B}} = \frac{1}{2 \times 1.2} \sqrt{\frac{145,000}{24.5}} \approx 32.05\text{ Hz}$$
- **Digital Twin Role**:
  Evaluates resonance amplification when idler roll frequencies or belt splice passage harmonics coincide with transverse string frequencies.

### 3.4 Head Pulley Pillow Block Bearings (NASA IMS Run-to-Failure)
- **Physical Asset**: Head Pulley HP01 drive pillow block spherical roller bearing.
- **Calibrated Dynamics**:
  Longitudinal degradation trajectory mapping:
  - **Stage 1 (0–75% lifetime)**: Stationary low RMS ($\approx 0.12\text{ g}$), Gaussian kurtosis ($\approx 3.0$).
  - **Stage 2 (75–90% lifetime)**: Incipient micro-spalling. Kurtosis spikes sharply ($8\text{–}12$), Crest factor increases, RMS begins parabolic inflection.
  - **Stage 3 (90–100% lifetime)**: Severe surface flaking. High broadband RMS ($> 1.5\text{ g}$), kurtosis drops toward 3.5 as impacts merge into continuous noise.
- **Digital Twin Role**:
  Enables condition-based Remaining Useful Life (RUL) estimation grounded in real empirical run-to-failure curves.
