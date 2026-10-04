export type AssetStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'STOPPED' | 'MAINTENANCE' | 'UNKNOWN';
export type ConveyorRunState = 'RUNNING' | 'STOPPED' | 'FAULTED' | 'STARTING' | 'STOPPING';
export type Severity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
export type TwinMode = 'LIVE' | 'SIMULATION' | 'PLAYBACK';

export interface JointState {
  id: string;
  health: number;
  temperature: number;
  vibration: number;
  tension: number;  // Dynamic tension Tj (kN)
  stressMpa: number;  // Multi-axis bending + tensile stress sigma_total (MPa)
  loadKn: number;  // Normal idler reaction load (kN)
  dynamicSagMm: number;  // Local catenary sag (mm)
  minerDamage: number;  // Miner's cumulative fatigue index D (0.0 to 1.0)
  feaColor: string;  // Multi-spectral heatmap hex color
  status: AssetStatus;
  failureProbability: number;
}

export interface MotorState {
  id: string;
  rpm: number;
  temperature: number;
  vibration: number;
  current: number;
  power: number;
  status: AssetStatus;
}

export interface ConveyorState {
  id: string;
  runState: ConveyorRunState;
  speed: number;
  targetSpeed: number;
  load: number;
  oreFlow: number;  // legacy compatibility
  coalFlow: number;  // CEMA bulk coal throughput (TPH)
  linearMassQm: number;  // Coal payload linear density q_m (kg/m)
  tension: number;  // Head tension (kN)
  cemaHeadTension: number;  // CEMA DIN 22101 T_head (kN)
  cemaSlackTension: number;  // CEMA T_slack (kN)
  beltSagMm: number;  // Dynamic catenary sag (mm)
  peakStressMpa: number;  // Peak splice stress across 24 joints
  avgStressMpa: number;  // Mean splice stress
  tracking: number;
  beltHealth: number;
  jointHealth: Record<string, JointState>;
  motor: MotorState;
  mode: TwinMode;
  moisturePct: number;  // Coal moisture content (%)
  smartThrottleEnabled: boolean;  // AI Smart Throttle closed loop toggle
  smartThrottleActive: boolean;  // AI auto-derating active
  smartThrottleDeratePct: number;  // Current throttle derate percentage (%)
  updatedAt: string;
}

export interface Alarm {
  id: string;
  assetId: string;
  type: string;
  severity: Severity;
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface FaultInjectionConfig {
  misalignment: boolean;
  highTension: boolean;
  highVibration: boolean;
  motorOverheat: boolean;
  bearingFailure: boolean;
  jointDamageId: string | null;
  jointDamageEnabled: boolean;
  beltTear: boolean;
  conveyorJam: boolean;
}

export interface PredictionResult {
  assetId: string;
  failureProbability: number;
  healthScore: number;
  contributingFactors: string[];
  riskHorizonHours: number | null;
  stressMpa?: number;
  minerDamage?: number;
}

// --- What-If Digital Sandbox Types ---
export interface WhatIfRequest {
  coalTph: number;
  moisturePct: number;
  beltSpeed: number;
  frictionFactor: number;
}

export interface WhatIfResponse {
  linearMassQm: number;
  cemaHeadTension: number;
  cemaSlackTension: number;
  cemaMotorPowerKw: number;
  peakJointStressMpa: number;
  tensileStressMpa: number;
  bendingStressMpa: number;
  beltSagMm: number;
  cemaSagPct: number;
  safetyFactor: number;
  estimatedSpliceLifeHours: number;
  stressStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL';
  recommendations: string[];
}

// --- SAP / CMMS Work Order Types ---
export interface SapDispatchWorkOrderRequest {
  assetId: string;
  technician?: string;
  downtimeWindowHours?: number;
  notes?: string;
}

export interface SapDispatchWorkOrderResponse {
  workOrderId: string;
  assetId: string;
  equipmentTag: string;
  sapStatus: string;
  priority: string;
  failureMode: string;
  requiredSpareParts: string[];
  downtimeWindowHours: number;
  costEstimateUsd: number;
  scheduledStart: string;
  dispatchedAt: string;
  notificationMsg: string;
}
