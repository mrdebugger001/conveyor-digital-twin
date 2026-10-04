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
    const placeholderSegments = [
      { label: 'Speed', unit: 'm/s' },
      { label: 'Coal feed', unit: 'TPH' },
      { label: 'Linear mass qₘ', unit: 'kg/m' },
      { label: 'Head tension', unit: 'kN' },
      { label: 'Peak FEA stress', unit: 'MPa' },
      { label: 'Catenary sag', unit: 'mm' },
      { label: 'Power', unit: 'kW' },
      { label: 'Motor temp', unit: '°C' },
      { label: 'Tracking', unit: 'mm' },
    ]
    return (
      <div className="h-16 bg-surface-container border-t border-outline-variant flex items-stretch flex-shrink-0 z-20 overflow-x-auto">
        {placeholderSegments.map((seg, i) => (
          <div
            key={seg.label}
            className={`flex-1 min-w-[110px] flex flex-col justify-center px-3.5 py-1.5 ${
              i > 0 ? 'border-l border-outline-variant' : ''
            }`}
          >
            <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider mb-0.5 truncate">
              {seg.label}
            </span>
            <div className="flex items-baseline gap-1 animate-pulse">
              <span className="font-mono text-base font-semibold text-on-surface-variant">--</span>
              <span className="font-mono text-[11px] text-on-surface-variant font-normal">{seg.unit}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const trackingStatus =
    Math.abs(conveyor.tracking) > 5 ? 'critical' : Math.abs(conveyor.tracking) > 2 ? 'warning' : 'normal'
  const tensionStatus =
    conveyor.tension > 165 ? 'critical' : conveyor.tension > 150 ? 'warning' : 'normal'
  const tempStatus =
    conveyor.motor.temperature > 85 ? 'critical' : conveyor.motor.temperature > 70 ? 'warning' : 'normal'
  const stressStatus =
    (conveyor.peakStressMpa ?? 11.0) > 15.0 ? 'critical' : (conveyor.peakStressMpa ?? 11.0) > 13.8 ? 'warning' : 'normal'
  const sagStatus =
    (conveyor.beltSagMm ?? 14.0) > 28.0 ? 'critical' : (conveyor.beltSagMm ?? 14.0) > 22.0 ? 'warning' : 'normal'

  const coalTph = conveyor.coalFlow ?? (conveyor.load * 12.0)
  const linearMass = conveyor.linearMassQm ?? (conveyor.speed > 0 ? (coalTph / (3.6 * Math.max(0.2, conveyor.speed))) : 0.0)

  const segments: KpiSegment[] = [
    { label: 'Speed', value: conveyor.speed.toFixed(2), unit: 'm/s' },
    { label: 'Coal feed', value: coalTph.toFixed(0), unit: 'TPH' },
    { label: 'Linear mass qₘ', value: linearMass.toFixed(1), unit: 'kg/m' },
    { label: 'Head tension', value: conveyor.tension.toFixed(0), unit: 'kN', status: tensionStatus },
    { label: 'Peak FEA stress', value: (conveyor.peakStressMpa ?? 11.2).toFixed(1), unit: 'MPa', status: stressStatus },
    { label: 'Catenary sag', value: (conveyor.beltSagMm ?? 14.2).toFixed(1), unit: 'mm', status: sagStatus },
    { label: 'Power', value: conveyor.motor.power.toFixed(0), unit: 'kW' },
    { label: 'Motor temp', value: conveyor.motor.temperature.toFixed(1), unit: '°C', status: tempStatus },
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
    <div className="h-16 bg-surface-container border-t border-outline-variant flex items-stretch flex-shrink-0 z-20 overflow-x-auto">
      {segments.map((seg, i) => (
        <div
          key={seg.label}
          className={`flex-1 min-w-[110px] flex flex-col justify-center px-3.5 py-1.5 ${
            i > 0 ? 'border-l border-outline-variant' : ''
          }`}
        >
          <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider mb-0.5 truncate">{seg.label}</span>
          <div className="flex items-baseline gap-1">
            <span className={`font-mono text-base font-semibold tracking-tight ${statusColor(seg.status)}`}>
              {seg.value}
            </span>
            <span className="font-mono text-[11px] text-on-surface-variant font-normal">
              {seg.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
