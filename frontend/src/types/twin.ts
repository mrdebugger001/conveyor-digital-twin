export type AssetStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'STOPPED' | 'MAINTENANCE' | 'UNKNOWN';
export type ConveyorRunState = 'RUNNING' | 'STOPPED' | 'FAULTED' | 'STARTING' | 'STOPPING';
export type Severity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
export type TwinMode = 'LIVE' | 'SIMULATION' | 'PLAYBACK';

export interface JointState {
  id: string;
  health: number;
  temperature: number;
  vibration: number;
  tension: number;
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
  oreFlow: number;
  tension: number;
  tracking: number;
  beltHealth: number;
  jointHealth: Record<string, JointState>;
  motor: MotorState;
  mode: TwinMode;
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
}
