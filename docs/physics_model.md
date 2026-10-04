# First-Principles Physics Model: Conveyor C01 Digital Twin

## 1. Executive Engineering Summary
This digital twin replaces artificial random simulation with a physically grounded, parameterized, and data-calibrated model of **Main Decline Transfer Conveyor C01** operating at an iron-ore beneficiation facility. 

The digital twin combines:
1. **Bulk Material Continuum Mechanics**: Eulerian continuity and dynamic mass flow rate.
2. **DIN 22101 / CEMA 7th Edition Motion Resistance**: Primary, secondary, and elevation lift work.
3. **1D Distributed Belt Tension Profile**: Spatial numerical integration of the differential equation $dT/ds$ along the continuous 720 m closed loop.
4. **Euler-Eytelwein Drive Traction Limits**: Prevention of drive pulley slip.
5. **Catenary Belt Sag Equations**: Parabolic and hyperbolic catenary formulation between idler sets.
6. **Electromechanical & Thermal Motor Dynamics**: Synchronous torque conversion and first-order stator thermal ODE.
7. **24-Joint Moving Kinematics & Stress Concentration**: Dynamic tracking of splices J01–J24 with combined tensile and pulley bending stresses.
8. **Goodman Mean-Stress Correction & Palmgren-Miner Fatigue**: Cumulative fatigue degradation $D = \sum (n_i / N_i)$ and Remaining Useful Life (RUL) estimation.

---

## 2. Eulerian Material Flow & Bulk Mechanics

### 2.1 Throughput and Mass Flow Rate
Given volumetric or gravimetric throughput in metric tonnes per hour ($\text{TPH}$):

$$\dot{m} = \frac{\text{TPH}}{3.6} \quad [\text{kg/s}]$$

### 2.2 Linear Material Payload Density ($q_m$)
For belt velocity $v > 0$:

$$q_m = \frac{\dot{m}}{v} = \frac{\text{TPH}}{3.6 \cdot v} \quad [\text{kg/m}]$$

*Validation Example*: At rated capacity $\text{TPH} = 1200\text{ t/h}$ and belt speed $v = 3.2\text{ m/s}$:

$$q_m = \frac{1200}{3.6 \times 3.2} = 104.1667 \quad [\text{kg/m}]$$

### 2.3 Total Inventory Mass on Carrying Strand
For carrying length $L = 350.0\text{ m}$:

$$M_{\text{payload}} = q_m \cdot L = 104.1667 \times 350.0 = 36,458.33 \quad [\text{kg}] \approx 36.46 \quad [\text{t}]$$

### 2.4 Dynamic Transient Lag Filter
Material loading changes are filtered via a continuous first-order lag filter representing chute discharge lag ($\tau_{\text{load}} = 2.5\text{ s}$):

$$\frac{dq_m}{dt} = \frac{q_{\text{target}} - q_m}{\tau_{\text{load}}}$$

---

## 3. Motion Resistance (DIN 22101 & CEMA)

### 3.1 Primary Resistance ($F_H$)
Primary motion resistance accounts for idler rolling bearing friction and cyclic indentation rolling resistance of the rubber belt cover:

$$F_H = f \cdot L \cdot g \cdot \left[ (q_B + q_{R,\text{carry}} + q_m)\cos\theta + (q_B + q_{R,\text{return}})\cos\theta \right]$$

Where:
- $f$: Calibrated effective friction factor ($f_0 = 0.020$)
- $L$: Horizontal projection / centerline length ($350.0\text{ m}$)
- $g$: Standard gravitational acceleration ($9.80665\text{ m/s}^2$)
- $q_B$: Belt mass ($24.5\text{ kg/m}$ for ST2500)
- $q_{R,\text{carry}}$: Rotating idler mass per meter carrying ($18.0\text{ kg} / 1.2\text{ m} = 15.0\text{ kg/m}$)
- $q_{R,\text{return}}$: Rotating idler mass per meter return ($8.5\text{ kg} / 3.0\text{ m} = 2.833\text{ kg/m}$)
- $\theta$: Incline angle ($\arcsin(14.0 / 350.0) = 2.292^\circ$, $\cos\theta \approx 0.9992$)

### 3.2 Secondary Resistance ($F_N$)
Accounts for skirting plate friction, belt scrapers, and pulley bending resistance:

$$F_N = (C - 1) F_H + F_{\text{skirt}} + F_{\text{scrapers}}$$

Where $C = 1.08$ is the DIN 22101 secondary resistance coefficient.

### 3.3 Lift Resistance ($F_{\text{St}}$)
Work done against gravitational potential energy across lift height $H = 14.0\text{ m}$:

$$F_{\text{St}} = q_m \cdot g \cdot H = 104.1667 \times 9.80665 \times 14.0 = 14,301.4 \quad [\text{N}]$$

### 3.4 Total Motion Resistance Force ($F_U$)
$$F_U = C \cdot F_H + F_{\text{St}}$$

---

## 4. 1D Distributed Belt Tension Profile & Euler-Eytelwein Drive

### 4.1 Governing Differential Equation
Along the spatial coordinate $s \in [0, L_{\text{loop}}]$:

$$\frac{dT}{ds} = g \cdot q_{\text{total}}(s) \cdot \left[ f(s) \cos\theta(s) \pm \sin\theta(s) \right]$$

The continuous profile $T(s)$ is integrated numerically:

$$T(s) = T(0) + \int_0^s \frac{dT}{ds} \, ds$$

### 4.2 Euler-Eytelwein Drive Pulley Traction Limit
To avoid belt slip across the ceramic lagged drive head pulley ($\mu = 0.38$, wrap angle $\alpha = 210^\circ = 3.665\text{ rad}$):

$$\frac{T_1}{T_2} \le e^{\mu \alpha} = e^{0.38 \times 3.665} = 4.026$$

The effective pull is $T_e = T_1 - T_2$. Therefore, the minimum slack-side tension $T_2$ required to transmit power without slip is:

$$T_{2,\min} = \frac{T_e}{e^{\mu \alpha} - 1}$$

The **Traction Margin** is continuously computed:

$$\text{Traction Margin} = \frac{e^{\mu \alpha}}{T_1 / T_2}$$

*Condition*: If $\text{Traction Margin} < 1.15$, the digital twin raises a `DRIVE_SLIP_WARNING` alarm.

---

## 5. Catenary Belt Sag Equations

### 5.1 CEMA Parabolic Approximation
Between carrying idler stations spaced at $a_0 = 1.2\text{ m}$:

$$S_{\text{CEMA}} \approx \frac{(q_B + q_m) \cdot g \cdot a_0^2}{8 \cdot T(s)}$$

### 5.2 Exact Hyperbolic Catenary
Accounting for geometric non-linearity:

$$S_{\text{catenary}} = \frac{T(s)}{(q_B + q_m)g} \left[ \cosh\left( \frac{(q_B + q_m) g a_0}{2 T(s)} \right) - 1 \right]$$

*Operational Limit*: Sag percentage must not exceed $2.0\%$ of idler spacing:

$$\text{Sag \%} = \frac{S}{a_0} \times 100\% \le 2.0\%$$

---

## 6. Drive Motor Electromechanical & Thermal ODE

### 6.1 Mechanical and Electrical Power
$$P_{\text{mech}} = T_e \cdot v \quad [\text{W}]$$

$$P_{\text{elec}} = \frac{P_{\text{mech}}}{\eta_{\text{motor}} \cdot \eta_{\text{gearbox}} \cdot \eta_{\text{drive}}} \quad [\text{W}]$$

Where $\eta_{\text{total}} = 0.955 \times 0.96 \times 0.97 \approx 0.889$.

### 6.2 3-Phase Stator Line Current
$$I_{\text{rms}} = \frac{P_{\text{elec}}}{\sqrt{3} \cdot V_{\text{LL}} \cdot \cos\phi} \quad [\text{A}]$$

Where $V_{\text{LL}} = 415\text{ V}$ and rated power factor $\cos\phi = 0.87$.

### 6.3 Stator Thermal Dynamics (1st-Order ODE)
Electrical power loss dissipated as heat:

$$P_{\text{loss}} = P_{\text{elec}} - P_{\text{mech}} \quad [\text{W}]$$

Stator temperature $T_m$ evolves according to thermal capacitance $C_{\text{th}} = 450,000\text{ J/K}$ and convective thermal resistance $R_{\text{th}} = 0.00018\text{ K/W}$:

$$C_{\text{th}} \frac{dT_m}{dt} = P_{\text{loss}} - \frac{T_m - T_{\text{ambient}}}{R_{\text{th}}}$$

---

## 7. 24-Joint Moving Kinematics & Stress Engine

### 7.1 Kinematic Tracking
The 24 physical splices (spaced at $30.0\text{ m}$ pitch along the $720.0\text{ m}$ loop) advance continuously:

$$s_j(t) = \left( s_{j,0} + \int_0^t v(\tau) \, d\tau \right) \bmod L_{\text{loop}}$$

### 7.2 Multi-Axis Stress Calculation
At any point $s_j(t)$, the splice experiences:

1. **Nominal Tensile Stress**:
   $$\sigma_{\text{tension}} = \frac{T(s_j)}{\eta_{\text{splice}} \cdot W \cdot t} \quad [\text{Pa}]$$
   Where $W = 1.4\text{ m}$, $t = 0.018\text{ m}$, $\eta_{\text{splice}} = 0.88$.

2. **Pulley Bending Stress**:
   When traversing pulleys of radius $R(s)$:
   $$\sigma_{\text{bending}} = \frac{E \cdot t}{2 \cdot R(s)} \quad [\text{Pa}]$$
   Where $E = 450\text{ MPa}$ and $R = 0.5\text{ m}$ (head drive) or $0.4\text{ m}$ (tail). Over flat idlers, $\sigma_{\text{bending}} = 0$.

3. **Combined Peak Stress with Stress Concentration ($K_t = 1.25$)**:
   $$\sigma_{\text{total}} = K_t \cdot (\sigma_{\text{tension}} + \sigma_{\text{bending}})$$

### 7.3 Instantaneous Safety Factor
$$SF = \frac{S_{\text{splice, ultimate}}}{\sigma_{\text{total}}}$$

---

## 8. Goodman Mean Stress Correction & Palmgren-Miner Fatigue

### 8.1 Stress Cycle Parameters
For each loop cycle, the stress oscillates between $\sigma_{\max}$ (at head drive pulley) and $\sigma_{\min}$ (on return strand):
- Stress range: $\Delta\sigma = \sigma_{\max} - \sigma_{\min}$
- Alternating amplitude: $\sigma_a = \Delta\sigma / 2$
- Mean stress: $\sigma_m = (\sigma_{\max} + \sigma_{\min}) / 2$

### 8.2 Goodman Mean Stress Correction
To account for tensile mean stress accelerating fatigue crack growth:

$$\sigma_{a,\text{eq}} = \frac{\sigma_a}{1 - \frac{\sigma_m}{S_u}}$$

Where $S_u = 22.0\text{ MPa}$ is the ultimate splice strength.

### 8.3 Basquin S-N Power-Law
Allowable cycles to failure $N$:

$$N = N_0 \left( \frac{S_e}{\sigma_{a,\text{eq}}} \right)^m$$

Where $N_0 = 10^6\text{ cycles}$, endurance limit $S_e = 8.5\text{ MPa}$, and Wohler exponent $m = 5.5$.

### 8.4 Palmgren-Miner Cumulative Damage
For each completed revolution cycle:

$$\Delta D = \frac{1}{N}$$

$$D = \sum_{i} \frac{n_i}{N_i}$$

Failure occurs when $D \ge 1.0$.
- **Normal Operation**: $D < 0.65$
- **Inspection Recommended**: $0.65 \le D < 0.85$
- **Splice Replacement Mandatory**: $D \ge 0.85$
