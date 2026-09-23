import React from 'react'
import { useTwinStore } from '../../store/twinStore'

interface KpiSegment {
  label: string
  value: string
  unit: string
  status?: 'normal' | 'warning' | 'critical'
}

export function KpiBar() {
  const conveyor = useTwinStore((s) => s.conveyor)

  if (!conveyor) {
    return (
      <div className="h-16 bg-surface-container border-t border-outline-variant flex items-center justify-center flex-shrink-0">
        <span className="text-on-surface-variant text-xs font-mono">Connecting to telemetry stream...</span>
      </div>
    )
  }

  const trackingStatus =
    Math.abs(conveyor.tracking) > 5 ? 'critical' : Math.abs(conveyor.tracking) > 2 ? 'warning' : 'normal'
  const tensionStatus =
    conveyor.tension > 165 ? 'critical' : conveyor.tension > 150 ? 'warning' : 'normal'
  const vibStatus =
    conveyor.motor.vibration > 6 ? 'critical' : conveyor.motor.vibration > 3 ? 'warning' : 'normal'
  const tempStatus =
    conveyor.motor.temperature > 85 ? 'critical' : conveyor.motor.temperature > 70 ? 'warning' : 'normal'

  const segments: KpiSegment[] = [
    { label: 'Speed', value: conveyor.speed.toFixed(2), unit: 'm/s' },
    { label: 'Load', value: conveyor.load.toFixed(1), unit: '%' },
    { label: 'Tension', value: conveyor.tension.toFixed(0), unit: 'kN', status: tensionStatus },
    { label: 'Vibration', value: conveyor.motor.vibration.toFixed(2), unit: 'mm/s', status: vibStatus },
    { label: 'Motor temp', value: conveyor.motor.temperature.toFixed(1), unit: '°C', status: tempStatus },
    { label: 'Power', value: conveyor.motor.power.toFixed(0), unit: 'kW' },
    {
      label: 'Tracking',
      value: (conveyor.tracking >= 0 ? '+' : '') + conveyor.tracking.toFixed(1),
      unit: 'mm',
      status: trackingStatus,
    },
  ]

  const statusColor = (s?: string) =>
    s === 'critical' ? 'text-status-red' : s === 'warning' ? 'text-status-amber' : 'text-on-surface'

  return (
    <div className="h-16 bg-surface-container border-t border-outline-variant flex items-stretch flex-shrink-0 z-20">
      {segments.map((seg, i) => (
        <div
          key={seg.label}
          className={`flex-1 flex flex-col justify-center px-4 py-2 ${
            i > 0 ? 'border-l border-outline-variant' : ''
          }`}
        >
          <span className="text-[11px] font-medium text-on-surface-variant mb-0.5">{seg.label}</span>
          <div className="flex items-baseline gap-1">
            <span className={`font-mono text-lg font-semibold tracking-tight ${statusColor(seg.status)}`}>
              {seg.value}
            </span>
            <span className="font-mono text-xs text-on-surface-variant font-normal">
              {seg.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
