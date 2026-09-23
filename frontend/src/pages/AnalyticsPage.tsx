import React from 'react'
import { TrendChart } from '../components/charts/TrendChart'
import { useTwinStore } from '../store/twinStore'

const METRIC_CONFIGS = [
  { key: 'speed', label: 'Belt speed', unit: 'm/s', threshold: 5.0, color: '#0284C7' },
  { key: 'tension', label: 'Belt tension', unit: 'kN', threshold: 165.0, color: '#F59E0B' },
  { key: 'vibration', label: 'Drive motor vibration', unit: 'mm/s', threshold: 6.0, color: '#8B5CF6' },
  { key: 'temperature', label: 'Motor temperature', unit: '°C', threshold: 85.0, color: '#EF4444' },
] as const

export function AnalyticsPage() {
  const conveyor = useTwinStore((s) => s.conveyor)
  const liveHistory = useTwinStore((s) => s.liveHistory)
  const joints = conveyor ? Object.values(conveyor.jointHealth) : []

  const getCurrentVal = (key: string) => {
    if (!conveyor) return '--'
    if (key === 'speed') return conveyor.speed.toFixed(2)
    if (key === 'tension') return conveyor.tension.toFixed(1)
    if (key === 'vibration') return conveyor.motor.vibration.toFixed(2)
    if (key === 'temperature') return conveyor.motor.temperature.toFixed(1)
    return '--'
  }

  return (
    <div className="flex flex-col h-full p-4 gap-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-on-surface">Analytics & Telemetry Streams</span>
          <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-status-green/15 text-status-green border border-status-green/30 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
            Live streaming @ 2 Hz
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-surface-container border border-outline-variant rounded font-mono text-on-surface-variant">
            Conveyor C01 · Active
          </span>
        </div>
      </div>

      {/* 2x2 live streaming chart grid */}
      <div className="grid grid-cols-2 gap-3">
        {METRIC_CONFIGS.map((metric) => {
          const streamData = (liveHistory as any)[metric.key] ?? []
          const current = getCurrentVal(metric.key)
          const numVal = parseFloat(current)
          const isOverThreshold = !isNaN(numVal) && numVal >= metric.threshold

          return (
            <div
              key={metric.key}
              className={`bg-surface-container rounded-lg border p-3.5 flex flex-col shadow-sm transition-colors ${
                isOverThreshold ? 'border-status-red/60 bg-status-red/5' : 'border-outline-variant'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-on-surface">{metric.label}</span>
                  {isOverThreshold && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-status-red text-white uppercase tracking-wider animate-pulse">
                      Exceeded
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className={`text-base font-bold ${isOverThreshold ? 'text-status-red' : 'text-on-surface'}`}>
                    {current}
                  </span>
                  <span className="text-xs text-on-surface-variant">{metric.unit}</span>
                </div>
              </div>

              <div className="h-40">
                <TrendChart
                  data={streamData}
                  color={metric.color}
                  threshold={metric.threshold}
                  height={155}
                  unit={metric.unit}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* 24-Joint health fleet overview */}
      <div className="bg-surface-container rounded-lg border border-outline-variant p-4 flex-1 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-on-surface">24-Joint Splice Health Matrix</p>
            <p className="text-[11px] text-on-surface-variant">Click any joint in the 3D scene or below to view detailed sensor trace</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="w-2 h-2 rounded bg-status-green" /> Nominal (&gt;80%)
            </span>
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="w-2 h-2 rounded bg-status-amber" /> Degraded (60-80%)
            </span>
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="w-2 h-2 rounded bg-status-red" /> Critical (&lt;60%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1.5 pt-2">
          {joints.map((j) => {
            const barColor =
              j.status === 'CRITICAL'
                ? 'bg-status-red animate-pulse'
                : j.status === 'WARNING'
                ? 'bg-status-amber'
                : 'bg-status-green'

            return (
              <div
                key={j.id}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
                title={`${j.id}: Health ${j.health.toFixed(0)}%, Vib ${j.vibration.toFixed(1)} mm/s, Tens ${j.tension.toFixed(0)} kN`}
              >
                <span className="font-mono text-[9px] text-on-surface font-semibold">{j.health.toFixed(0)}%</span>
                <div className="w-full h-24 bg-surface-high rounded-sm overflow-hidden flex flex-col-reverse p-0.5">
                  <div
                    className={`w-full ${barColor} rounded-sm transition-all duration-300`}
                    style={{ height: `${Math.max(8, j.health)}%` }}
                  />
                </div>
                <span className="font-mono text-[9px] text-on-surface-variant group-hover:text-primary font-medium">
                  {j.id}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
