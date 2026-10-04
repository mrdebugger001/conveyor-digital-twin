import React, { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertOctagon, AlertTriangle, RefreshCw, Cpu, Gauge, Activity, ShieldCheck, Wrench } from 'lucide-react'
import { api } from '../../api/client'

interface ResidualMetric {
  metricName: string
  unit: string
  measuredValue: number | null
  predictedValue: number
  residual: number
  normalizedResidualZ: number
  healthStatus: string
  faultHypothesis: string
}

interface ResidualState {
  tension: ResidualMetric
  power: ResidualMetric
  current: ResidualMetric
  temperature: ResidualMetric
  vibration: ResidualMetric
  rmse: number
  mae: number
  sensorFaultsDetected: string[]
  mechanicalFaultsDetected: string[]
}

interface CalibrationResult {
  parameterName: string
  nominalValue: number
  calibratedValue: number
  unit: string
  rmseBefore: number
  rmseAfter: number
  improvementPct: number
}

interface Props {
  onClose: () => void
}

export function ModelValidationModal({ onClose }: Props) {
  const [residuals, setResiduals] = useState<ResidualState | null>(null)
  const [calibrating, setCalibrating] = useState(false)
  const [calibrationLog, setCalibrationLog] = useState<CalibrationResult | null>(null)
  const [operatingProfile, setOperatingProfile] = useState<string>('CALIBRATED_SIMULATION_MODE')

  const fetchResiduals = async () => {
    try {
      const res = await api.getResiduals()
      setResiduals(res)
    } catch (e) {
      console.error('Failed to fetch residuals', e)
    }
  }

  const fetchProfile = async () => {
    try {
      const p = await api.getOperatingProfile()
      setOperatingProfile(p.operatingProfile)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchResiduals()
    fetchProfile()
    const timer = setInterval(fetchResiduals, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleCalibrate = async (targetParam: 'friction_factor' | 'thermal_resistance') => {
    setCalibrating(true)
    try {
      const res = await api.calibrate(targetParam)
      setCalibrationLog(res)
      fetchResiduals()
    } catch (e) {
      console.error('Calibration failed', e)
    } finally {
      setCalibrating(false)
    }
  }

  const handleProfileChange = async (profile: string) => {
    setOperatingProfile(profile)
    try {
      await api.setOperatingProfile(profile)
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-status-green/20 text-status-green">NORMAL</span>
      case 'NOISY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-status-amber/20 text-status-amber">NOISY</span>
      case 'STUCK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-status-red/20 text-status-red">STUCK VALUE</span>
      case 'OUT_OF_RANGE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-status-red/20 text-status-red">OUT OF RANGE</span>
      case 'SENSOR_FAULT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-status-red/20 text-status-red">SENSOR FAULT</span>
      case 'MECHANICAL_ANOMALY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary-container text-primary">MACHINE OVERLOAD</span>
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-high text-on-surface-variant">{status}</span>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-high/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-status-green/20 border border-status-green/40 flex items-center justify-center text-status-green">
              <Gauge size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface tracking-tight">
                  Physics Residuals & Analytical Redundancy Dashboard
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-container text-primary font-medium">
                  ε = y_measured - ŷ_physics
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Isolates instrument sensor failure from true equipment mechanical degradation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Operating Profile Selector */}
          <div className="flex items-center justify-between bg-surface-high/40 border border-outline-variant rounded-xl p-3">
            <div>
              <span className="text-xs font-semibold text-on-surface block">Digital Twin Operating Profile:</span>
              <span className="text-[10px] text-on-surface-variant">
                Determines state estimation source and data calibration mode.
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-high p-1 rounded-lg border border-outline-variant">
              {(['CALIBRATED_SIMULATION_MODE', 'REAL_DATA_MODE', 'DEMO_MODE'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleProfileChange(mode)}
                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                    operatingProfile === mode
                      ? 'bg-primary-container text-primary font-bold shadow'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {mode.replace('_MODE', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Model Accuracy Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                Normalized RMSE
              </span>
              <span className="text-lg font-mono font-bold text-primary">
                {residuals ? residuals.rmse.toFixed(2) : '--'} σ
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">Root Mean Squared Z-score</span>
            </div>

            <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                Normalized MAE
              </span>
              <span className="text-lg font-mono font-bold text-on-surface">
                {residuals ? residuals.mae.toFixed(2) : '--'} σ
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">Mean Absolute Error</span>
            </div>

            <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                Sensor Hardware Faults
              </span>
              <span
                className={`text-lg font-mono font-bold ${
                  (residuals?.sensorFaultsDetected.length ?? 0) > 0 ? 'text-status-red' : 'text-status-green'
                }`}
              >
                {residuals?.sensorFaultsDetected.length ?? 0} Detected
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">Transducer / Wiring failures</span>
            </div>

            <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                Mechanical Overload Faults
              </span>
              <span
                className={`text-lg font-mono font-bold ${
                  (residuals?.mechanicalFaultsDetected.length ?? 0) > 0 ? 'text-status-amber' : 'text-status-green'
                }`}
              >
                {residuals?.mechanicalFaultsDetected.length ?? 0} Anomaly
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">Physical machine degradation</span>
            </div>
          </div>

          {/* Residuals Comparison Table */}
          <div className="bg-surface-high/30 border border-outline-variant rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-high/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Telemetry Residuals Matrix (Measured vs First-Principles Predicted)
              </span>
              <span className="text-[10px] text-on-surface-variant font-mono">
                Threshold: |Z| ≤ 2.0 (Normal), |Z| &gt; 3.0 (Discrepancy)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant text-[10px] text-on-surface-variant uppercase font-mono bg-surface-high/20">
                    <th className="py-2.5 px-4">Telemetry Channel</th>
                    <th className="py-2.5 px-3">Measured Value</th>
                    <th className="py-2.5 px-3">Physics Prediction</th>
                    <th className="py-2.5 px-3">Residual (ε)</th>
                    <th className="py-2.5 px-3">Normalized (Z)</th>
                    <th className="py-2.5 px-3">Sensor Health State</th>
                    <th className="py-2.5 px-4">Fault Hypothesis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 font-mono">
                  {residuals &&
                    [
                      residuals.tension,
                      residuals.power,
                      residuals.current,
                      residuals.temperature,
                      residuals.vibration,
                    ].map((m, idx) => (
                      <tr key={idx} className="hover:bg-surface-high/40 transition-colors">
                        <td className="py-3 px-4 font-sans font-semibold text-on-surface">
                          {m.metricName}
                        </td>
                        <td className="py-3 px-3 text-on-surface">
                          {m.measuredValue !== null ? `${m.measuredValue} ${m.unit}` : 'DISCONNECTED'}
                        </td>
                        <td className="py-3 px-3 text-primary">
                          {m.predictedValue} {m.unit}
                        </td>
                        <td
                          className={`py-3 px-3 font-bold ${
                            Math.abs(m.normalizedResidualZ) > 3.0
                              ? 'text-status-red'
                              : Math.abs(m.normalizedResidualZ) > 2.0
                              ? 'text-status-amber'
                              : 'text-status-green'
                          }`}
                        >
                          {m.residual >= 0 ? `+${m.residual}` : m.residual} {m.unit}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              Math.abs(m.normalizedResidualZ) > 3.0
                                ? 'bg-status-red/20 text-status-red'
                                : 'text-on-surface'
                            }`}
                          >
                            {m.normalizedResidualZ >= 0 ? `+${m.normalizedResidualZ.toFixed(1)}` : m.normalizedResidualZ.toFixed(1)}σ
                          </span>
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(m.healthStatus)}</td>
                        <td className="py-3 px-4 font-sans text-xs text-on-surface-variant">
                          {m.faultHypothesis}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Calibration Section */}
          <div className="bg-surface-high/40 border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench size={16} className="text-primary" />
                <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                  Site Data Calibration Engine (Scipy L-BFGS-B Optimization)
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono">
                Minimizes error against reference empirical datasets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-on-surface block">
                    DIN 22101 Global Friction Factor (f)
                  </span>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Calibrates belt indentation rolling resistance from measured drive power.
                  </span>
                </div>
                <button
                  disabled={calibrating}
                  onClick={() => handleCalibrate('friction_factor')}
                  className="px-3 py-1.5 rounded-lg bg-primary-container text-primary hover:bg-primary hover:text-surface text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {calibrating ? <RefreshCw size={12} className="animate-spin" /> : <Cpu size={12} />}
                  <span>Calibrate f</span>
                </button>
              </div>

              <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-on-surface block">
                    Motor Thermal Resistance (R_th)
                  </span>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Calibrates steady-state stator heat transfer coefficient from loss power.
                  </span>
                </div>
                <button
                  disabled={calibrating}
                  onClick={() => handleCalibrate('thermal_resistance')}
                  className="px-3 py-1.5 rounded-lg bg-primary-container text-primary hover:bg-primary hover:text-surface text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {calibrating ? <RefreshCw size={12} className="animate-spin" /> : <Cpu size={12} />}
                  <span>Calibrate R_th</span>
                </button>
              </div>
            </div>

            {/* Calibration Result Banner */}
            {calibrationLog && (
              <div className="bg-status-green/10 border border-status-green/30 rounded-lg p-3 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-status-green" />
                  <span className="text-on-surface">
                    Successfully calibrated <strong>{calibrationLog.parameterName}</strong>: {calibrationLog.nominalValue} →{' '}
                    <strong className="text-status-green">{calibrationLog.calibratedValue} {calibrationLog.unit}</strong>
                  </span>
                </div>
                <div className="text-on-surface-variant">
                  RMSE: {calibrationLog.rmseBefore} → {calibrationLog.rmseAfter} (
                  <strong className="text-status-green">+{calibrationLog.improvementPct}% accuracy gain</strong>)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant bg-surface-high/40">
          <span className="text-[11px] text-on-surface-variant">
            Cross-sensor analytical redundancy verifies electrical power vs current to prevent false alarm trips.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-high border border-outline-variant text-on-surface hover:text-primary text-xs font-semibold transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
