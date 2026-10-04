import React, { useMemo } from 'react'
import { Crosshair, AlertTriangle, ArrowLeft, Activity, ShieldAlert, Wrench, Zap } from 'lucide-react'
import { useTwinStore } from '../../store/twinStore'
import { TrendChart } from '../charts/TrendChart'
import { useNavigate } from 'react-router-dom'

const QUICK_ACCESS = [
  { id: 'joint-J023', label: 'Splice J023 (Fatigued)' },
  { id: 'motor-M01', label: 'Drive M01' },
  { id: 'joint-J012', label: 'Splice J012' },
  { id: 'pulley-HP01', label: 'Head Pulley' },
]

export function AssetInspector() {
  const { selectedAssetId, setSelectedAsset, conveyor, liveHistory, openSapModal } = useTwinStore()
  const navigate = useNavigate()

  // Extract joint / motor / asset info from live twin state
  const jointId = selectedAssetId?.startsWith('joint-') ? selectedAssetId.replace('joint-', '') : null
  const jointData = jointId && conveyor?.jointHealth[jointId] ? conveyor.jointHealth[jointId] : null
  const motorData = selectedAssetId === 'motor-M01' ? conveyor?.motor : null
  const isHeadPulley = selectedAssetId === 'pulley-HP01'
  const isTakeup = selectedAssetId === 'takeup-01'

  // Formatted title
  const assetTitle = jointId
    ? `Belt Splice Joint ${jointId}`
    : selectedAssetId === 'motor-M01'
    ? 'Drive Motor M01'
    : isHeadPulley
    ? 'Head Pulley HP01'
    : isTakeup
    ? 'Take-up Trolley'
    : selectedAssetId ?? 'Asset Details'

  // Dynamic status
  const currentStatus = jointData
    ? jointData.status
    : motorData
    ? motorData.status
    : 'NORMAL'

  // Live failure probability
  const failureProbability = useMemo(() => {
    if (jointData) return jointData.failureProbability ?? 0.08
    if (motorData) {
      if (motorData.temperature > 100 || motorData.vibration > 7) return 0.85
      if (motorData.temperature > 85 || motorData.vibration > 4.5) return 0.55
      return 0.05
    }
    return 0.04
  }, [jointData, motorData])

  // FEA Stress & Miner damage
  const stressMpa = jointData?.stressMpa ?? (jointId ? 11.2 : 0)
  const minerDamage = jointData?.minerDamage ?? 0
  const normalLoadKn = jointData?.loadKn ?? 1.52
  const localSagMm = jointData?.dynamicSagMm ?? 14.2

  // Live detected conditions derived from active sensor telemetry & CEMA calculations
  const detectedConditions = useMemo(() => {
    const list: string[] = []
    if (jointData) {
      if (stressMpa >= 15.0) {
        list.push(`CRITICAL: Splice stress ${stressMpa.toFixed(1)} MPa exceeds DIN peel threshold (15.0 MPa)`)
      } else if (stressMpa >= 13.8) {
        list.push(`Warning: Splice multi-axis stress ${stressMpa.toFixed(1)} MPa accelerating cord shear`)
      }

      if (minerDamage >= 0.75) {
        list.push(`Miner fatigue damage D = ${minerDamage.toFixed(2)} (High splice fatigue accumulation)`)
      }

      if (jointData.vibration >= 4.5) {
        list.push(`Vibration anomaly: ${jointData.vibration.toFixed(1)} mm/s (harmonic splice slap)`)
      }

      if (localSagMm > 24.0) {
        list.push(`Local catenary sag ${localSagMm.toFixed(1)} mm exceeds 2.0% CEMA allowance`)
      }

      if (jointData.health < 60.0) {
        list.push(`Splice structural integrity compromised (${jointData.health.toFixed(0)}%)`)
      }
    } else if (motorData) {
      if (motorData.temperature >= 90.0) {
        list.push(`Stator winding overheat: ${motorData.temperature.toFixed(1)}°C (limit: 85.0)`)
      }
      if (motorData.vibration >= 5.0) {
        list.push(`Severe bearing race / cage degradation: ${motorData.vibration.toFixed(2)} mm/s`)
      }
    }
    return list
  }, [jointData, motorData, stressMpa, minerDamage, localSagMm])

  // Risk horizon estimation
  const riskHorizonHours = useMemo(() => {
    if (failureProbability > 0.7) return +(14 * (1 - failureProbability) + 4).toFixed(1)
    if (failureProbability > 0.4) return +(48 * (1 - failureProbability) + 12).toFixed(1)
    return null
  }, [failureProbability])

  const statusColor =
    currentStatus === 'CRITICAL'
      ? 'bg-status-red/15 text-status-red border-status-red/50 animate-pulse'
      : currentStatus === 'WARNING'
      ? 'bg-status-amber/15 text-status-amber border-status-amber/50'
      : 'bg-status-green/15 text-status-green border-status-green/40'

  const chartData = liveHistory.selectedAssetVibration

  return (
    <aside className="w-80 flex flex-col bg-surface-container border-l border-outline-variant flex-shrink-0 h-full overflow-hidden z-20 shadow-xl">
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-outline-variant flex-shrink-0">
        <div className="flex items-center gap-2">
          {selectedAssetId && (
            <button
              onClick={() => setSelectedAsset(null)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded transition-colors cursor-pointer"
              title="Back to all assets"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <span className="text-sm font-semibold text-on-surface">Asset inspector</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-status-green">
          <Activity size={13} className="animate-pulse" />
          <span>CEMA LIVE</span>
        </div>
      </div>

      {/* Body Area */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto min-h-0">
        {!selectedAssetId ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <div className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center mb-4 text-on-surface-variant">
              <Crosshair size={24} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-on-surface mb-1">Select an asset to inspect</p>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-[220px] mb-8">
              Click any splice joint, motor, or pulley to view CEMA DIN 22101 diagnostics.
            </p>

            <div className="w-full">
              <p className="text-[11px] font-medium text-on-surface-variant text-left mb-2.5">Key showcase assets</p>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_ACCESS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedAsset(item.id)}
                    className="text-xs font-medium px-3 py-2 rounded bg-surface-high border border-outline-variant/60 text-on-surface hover:border-primary hover:text-primary transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-[10px] text-on-surface-variant">{item.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Populated live state */
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex flex-col gap-3.5">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-on-surface block leading-tight">{assetTitle}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant">{selectedAssetId}</span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${statusColor}`}>
                  {currentStatus}
                </span>
              </div>

              {/* CEMA / DIN 22101 Advanced Physics Metric Grid */}
              {jointData ? (
                <div className="grid grid-cols-2 gap-2 bg-surface-high/60 border border-outline-variant/50 p-2.5 rounded-lg">
                  <div>
                    <span className="text-[9px] text-on-surface-variant block uppercase tracking-wider mb-0.5">FEA Stress (σ)</span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        stressMpa > 15.0 ? 'text-status-red' : stressMpa > 13.8 ? 'text-status-amber' : 'text-primary'
                      }`}
                    >
                      {stressMpa.toFixed(1)} <span className="text-[10px] font-normal text-on-surface-variant">MPa</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-on-surface-variant block uppercase tracking-wider mb-0.5">Normal Load</span>
                    <span className="font-mono text-sm font-bold text-on-surface">
                      {normalLoadKn.toFixed(2)} <span className="text-[10px] font-normal text-on-surface-variant">kN</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-on-surface-variant block uppercase tracking-wider mb-0.5">Dynamic Sag</span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        localSagMm > 24.0 ? 'text-status-amber' : 'text-on-surface'
                      }`}
                    >
                      {localSagMm.toFixed(1)} <span className="text-[10px] font-normal text-on-surface-variant">mm</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-on-surface-variant block uppercase tracking-wider mb-0.5">Vibration</span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        jointData.vibration > 4.5 ? 'text-status-red' : 'text-on-surface'
                      }`}
                    >
                      {jointData.vibration.toFixed(1)} <span className="text-[10px] font-normal text-on-surface-variant">mm/s</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 bg-surface-high/60 border border-outline-variant/50 p-2.5 rounded-lg">
                  <div>
                    <span className="text-[9px] text-on-surface-variant block uppercase tracking-wider mb-0.5">Temp</span>
                    <span className="font-mono text-sm font-bold text-on-surface">
                      {motorData?.temperature.toFixed(1) ?? '55'}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-on-surface-variant block uppercase tracking-wider mb-0.5">Power</span>
                    <span className="font-mono text-sm font-bold text-on-surface">
                      {motorData?.power.toFixed(0) ?? '0'} kW
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-on-surface-variant block uppercase tracking-wider mb-0.5">Vibration</span>
                    <span className="font-mono text-sm font-bold text-on-surface">
                      {motorData?.vibration.toFixed(2) ?? '1.2'} mm/s
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-on-surface-variant block uppercase tracking-wider mb-0.5">Current</span>
                    <span className="font-mono text-sm font-bold text-on-surface">
                      {motorData?.current.toFixed(1) ?? '0'} A
                    </span>
                  </div>
                </div>
              )}

              {/* Miner's Cumulative Fatigue Indicator (Joints) */}
              {jointData && (
                <div className="p-2.5 rounded-lg bg-surface-high/40 border border-outline-variant/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-on-surface-variant font-medium">Miner's Fatigue Damage D</span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        minerDamage > 0.85 ? 'text-status-red' : minerDamage > 0.65 ? 'text-status-amber' : 'text-status-green'
                      }`}
                    >
                      {(minerDamage * 100).toFixed(1)}% (D={minerDamage.toFixed(2)})
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        minerDamage > 0.85
                          ? 'bg-status-red'
                          : minerDamage > 0.65
                          ? 'bg-status-amber'
                          : 'bg-status-green'
                      }`}
                      style={{ width: `${Math.min(100, minerDamage * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Failure probability */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-on-surface-variant font-medium">Splice Failure Risk</span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      failureProbability > 0.65 ? 'text-status-red' : failureProbability > 0.35 ? 'text-status-amber' : 'text-status-green'
                    }`}
                  >
                    {(failureProbability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-surface-high rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      failureProbability > 0.65
                        ? 'bg-status-red'
                        : failureProbability > 0.35
                        ? 'bg-status-amber'
                        : 'bg-status-green'
                    }`}
                    style={{ width: `${Math.max(6, failureProbability * 100)}%` }}
                  />
                </div>
              </div>

              {/* Estimated Risk Horizon */}
              {riskHorizonHours && (
                <div className="flex items-center justify-between px-3 py-2 rounded bg-status-red/10 border border-status-red/30 text-xs">
                  <span className="text-on-surface font-medium flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-status-red" />
                    Est. Remaining Life
                  </span>
                  <span className="font-mono font-bold text-status-red">~{riskHorizonHours}h until rupture</span>
                </div>
              )}

              {/* Detected conditions */}
              <div>
                <span className="text-[11px] font-medium text-on-surface-variant block mb-1">Active Physics Diagnostics</span>
                {detectedConditions.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {detectedConditions.map((cond, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-on-surface bg-surface-high/50 p-2 rounded border border-outline-variant/40">
                        <AlertTriangle size={13} className="text-status-amber flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{cond}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
                    <span>Operating within DIN 22101 tolerances</span>
                  </div>
                )}
              </div>

              {/* Live vibration trend chart */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-on-surface-variant">
                    Dynamic sensor waveform
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant">60-pt buffer</span>
                </div>
                <div className="bg-surface-high/40 rounded-lg border border-outline-variant/40 p-2">
                  <TrendChart
                    data={chartData}
                    color="#F59E0B"
                    threshold={4.5}
                    height={85}
                    unit="mm/s"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions: SAP PM Dispatch & Focus */}
            <div className="flex flex-col gap-2 pt-3 border-t border-outline-variant/60 mt-3">
              {/* Automated SAP CMMS Maintenance Dispatch Button */}
              <button
                onClick={() => openSapModal(selectedAssetId)}
                className={`w-full py-2 px-3 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  failureProbability > 0.5 || minerDamage > 0.7
                    ? 'bg-status-red text-white hover:bg-red-700 animate-pulse'
                    : 'bg-primary-container text-primary hover:bg-primary hover:text-surface'
                }`}
              >
                <Wrench size={13} />
                <span>Dispatch SAP PM Work Order</span>
              </button>

              <button
                onClick={() => navigate('/maintenance')}
                className="py-1.5 text-xs text-on-surface-variant hover:text-on-surface text-center transition-colors cursor-pointer"
              >
                View Maintenance Records & Spares →
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
