import React, { useMemo } from 'react'
import { Crosshair, Search, AlertTriangle, ArrowLeft, Activity, ShieldAlert } from 'lucide-react'
import { useTwinStore } from '../../store/twinStore'
import { TrendChart } from '../charts/TrendChart'
import { useNavigate } from 'react-router-dom'

const QUICK_ACCESS = [
  { id: 'motor-M01', label: 'Drive M01' },
  { id: 'joint-J023', label: 'Splice J023' },
  { id: 'pulley-HP01', label: 'Head pulley' },
  { id: 'takeup-01', label: 'Take-up trolley' },
]

export function AssetInspector() {
  const { selectedAssetId, setSelectedAsset, conveyor, liveHistory } = useTwinStore()
  const navigate = useNavigate()

  // Extract joint / motor / asset info from live twin state
  const jointId = selectedAssetId?.startsWith('joint-') ? selectedAssetId.replace('joint-', '') : null
  const jointData = jointId && conveyor?.jointHealth[jointId] ? conveyor.jointHealth[jointId] : null
  const motorData = selectedAssetId === 'motor-M01' ? conveyor?.motor : null
  const isHeadPulley = selectedAssetId === 'pulley-HP01'
  const isTakeup = selectedAssetId === 'takeup-01'

  // Formatted title
  const assetTitle = jointId
    ? `Joint ${jointId}`
    : selectedAssetId === 'motor-M01'
    ? 'Drive M01'
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

  // Live failure probability calculation from real-time physics
  const failureProbability = useMemo(() => {
    if (jointData) {
      return jointData.failureProbability ?? 0.08
    }
    if (motorData) {
      if (motorData.temperature > 100 || motorData.vibration > 7) return 0.85
      if (motorData.temperature > 85 || motorData.vibration > 4.5) return 0.55
      return 0.05
    }
    return 0.04
  }, [jointData, motorData])

  // Live detected conditions derived from active sensor telemetry
  const detectedConditions = useMemo(() => {
    const list: string[] = []
    if (jointData) {
      if (jointData.vibration >= 6.0) {
        list.push(`Critical vibration anomaly: ${jointData.vibration.toFixed(1)} mm/s (limit: 6.0)`)
      } else if (jointData.vibration >= 3.5) {
        list.push(`Moderate vibration trend: ${jointData.vibration.toFixed(1)} mm/s`)
      }
      if (jointData.tension >= 170.0) {
        list.push(`Severe splice tension stress: ${jointData.tension.toFixed(0)} kN (limit: 165)`)
      } else if (jointData.tension >= 155.0) {
        list.push(`Elevated belt tension: ${jointData.tension.toFixed(0)} kN`)
      }
      if (jointData.temperature >= 80.0) {
        list.push(`Excessive splice friction heat: ${jointData.temperature.toFixed(0)}°C`)
      }
      if (jointData.health < 60.0) {
        list.push(`Splice structural integrity compromised (${jointData.health.toFixed(0)}%)`)
      }
    } else if (motorData) {
      if (motorData.temperature >= 90.0) {
        list.push(`Stator winding overheat: ${motorData.temperature.toFixed(1)}°C (limit: 85.0)`)
      }
      if (motorData.vibration >= 6.0) {
        list.push(`Severe bearing race / cage degradation: ${motorData.vibration.toFixed(2)} mm/s`)
      }
      if (motorData.current >= 95.0) {
        list.push(`Motor electrical overload current: ${motorData.current.toFixed(0)} A`)
      }
    }
    return list
  }, [jointData, motorData])

  // Live risk horizon estimation
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
              className="text-on-surface-variant hover:text-on-surface p-1 rounded transition-colors"
              title="Back to all assets"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <span className="text-sm font-semibold text-on-surface">Asset inspector</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-status-green">
          <Activity size={13} className="animate-pulse" />
          <span>LIVE</span>
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
              Click any joint, motor, or roller to see live diagnostics.
            </p>

            <div className="w-full">
              <p className="text-[11px] font-medium text-on-surface-variant text-left mb-2.5">Quick access</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACCESS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedAsset(item.id)}
                    className="text-xs font-medium px-3 py-2 rounded bg-surface-high border border-outline-variant/60 text-on-surface hover:border-primary hover:text-primary transition-all text-left"
                  >
                    {item.label}
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
                <span className="text-base font-semibold text-on-surface">{assetTitle}</span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                  {currentStatus}
                </span>
              </div>

              {/* 4 Compact Live Stat Blocks */}
              <div className="grid grid-cols-2 gap-2.5 bg-surface-high/60 border border-outline-variant/50 p-3 rounded-lg">
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider mb-0.5">Health</span>
                  <span
                    className={`font-mono text-base font-bold ${
                      (jointData?.health ?? 100) < 60 ? 'text-status-red' : (jointData?.health ?? 100) < 80 ? 'text-status-amber' : 'text-on-surface'
                    }`}
                  >
                    {jointData ? jointData.health.toFixed(0) : motorData ? (motorData.status === 'NORMAL' ? '96' : '48') : '100'}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider mb-0.5">Temperature</span>
                  <span
                    className={`font-mono text-base font-bold ${
                      (jointData?.temperature ?? motorData?.temperature ?? 0) > 85 ? 'text-status-red' : 'text-on-surface'
                    }`}
                  >
                    {jointData
                      ? jointData.temperature.toFixed(0)
                      : motorData
                      ? motorData.temperature.toFixed(0)
                      : '45'}°C
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider mb-0.5">Vibration</span>
                  <span
                    className={`font-mono text-base font-bold ${
                      (jointData?.vibration ?? motorData?.vibration ?? 0) > 6.0 ? 'text-status-red' : 'text-on-surface'
                    }`}
                  >
                    {jointData
                      ? jointData.vibration.toFixed(1)
                      : motorData
                      ? motorData.vibration.toFixed(1)
                      : '1.2'} mm/s
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider mb-0.5">Tension</span>
                  <span
                    className={`font-mono text-base font-bold ${
                      (jointData?.tension ?? conveyor?.tension ?? 0) > 165 ? 'text-status-red' : 'text-on-surface'
                    }`}
                  >
                    {jointData
                      ? jointData.tension.toFixed(0)
                      : conveyor?.tension.toFixed(0) ?? '145'} kN
                  </span>
                </div>
              </div>

              {/* Labeled linear progress indicator: Failure probability */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-on-surface-variant font-medium">Failure probability</span>
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
                <div className="flex items-center justify-between px-3 py-2 rounded bg-status-amber/10 border border-status-amber/30 text-xs">
                  <span className="text-on-surface font-medium flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-status-amber" />
                    Est. Risk Horizon
                  </span>
                  <span className="font-mono font-bold text-status-amber">~{riskHorizonHours}h</span>
                </div>
              )}

              {/* Detected conditions */}
              <div>
                <span className="text-[11px] font-medium text-on-surface-variant block mb-1.5">Detected conditions</span>
                {detectedConditions.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {detectedConditions.map((cond, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-on-surface bg-surface-high/50 p-2 rounded border border-outline-variant/40">
                        <AlertTriangle size={14} className="text-status-amber flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{cond}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
                    <span>Operating within nominal tolerances</span>
                  </div>
                )}
              </div>

              {/* Thin Material divider */}
              <div className="border-t border-outline-variant/60 my-0.5" />

              {/* Live vibration trend chart */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-on-surface-variant">
                    Vibration trace (streaming)
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant">Limit: 6.0 mm/s</span>
                </div>
                <div className="bg-surface-high/40 rounded-lg border border-outline-variant/40 p-2">
                  <TrendChart
                    data={chartData}
                    color="#F59E0B"
                    threshold={6.0}
                    height={95}
                    unit="mm/s"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/60 mt-3">
              <button
                onClick={() => {
                  // Focus view in 3D
                  const btn = document.querySelector(`[data-focus="${selectedAssetId}"]`) as HTMLElement
                  if (btn) btn.click()
                }}
                className="flex-1 py-2 px-3 rounded bg-primary-container text-primary font-medium text-xs hover:bg-primary hover:text-surface transition-colors text-center cursor-pointer shadow-sm"
              >
                Focus in 3D view
              </button>
              <button
                onClick={() => navigate('/maintenance')}
                className="py-2 px-3 text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Maintenance
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
