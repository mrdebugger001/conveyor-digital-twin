import React, { useState } from 'react'
import { AlertOctagon, AlertTriangle, Info, Check } from 'lucide-react'
import { useTwinStore } from '../store/twinStore'
import { api } from '../api/client'
import type { Alarm } from '../types/twin'

const FILTER_OPTIONS = ['All', 'CRITICAL', 'WARNING', 'INFO', 'Unacknowledged'] as const

function SeverityBadge({ severity }: { severity: string }) {
  const cls = severity === 'CRITICAL' || severity === 'EMERGENCY'
    ? 'text-status-red'
    : severity === 'WARNING' ? 'text-status-amber'
    : 'text-on-surface-variant'
  const Icon = severity === 'CRITICAL' || severity === 'EMERGENCY'
    ? AlertOctagon
    : severity === 'WARNING' ? AlertTriangle : Info
  return (
    <div className={`flex items-center gap-1 ${cls}`}>
      <Icon size={13} />
      <span className="text-xs">{severity}</span>
    </div>
  )
}

function AlarmTableRow({ alarm, onAck }: { alarm: Alarm; onAck: (id: string) => void }) {
  const borderColor =
    alarm.severity === 'CRITICAL' || alarm.severity === 'EMERGENCY' ? 'border-l-status-red' :
    alarm.severity === 'WARNING' ? 'border-l-status-amber' : 'border-l-primary'

  return (
    <tr className={`border-l-2 ${borderColor} hover:bg-surface-high transition-colors`}>
      <td className="px-4 py-2.5"><SeverityBadge severity={alarm.severity} /></td>
      <td className="px-4 py-2.5 font-mono text-xs text-on-surface-variant">
        {new Date(alarm.timestamp).toLocaleTimeString()}
      </td>
      <td className="px-4 py-2.5 text-xs text-on-surface">
        {alarm.assetId.replace('joint-', '').replace('motor-', '').replace('belt-', '')}
      </td>
      <td className="px-4 py-2.5 text-xs text-on-surface">{alarm.type.replace(/_/g, ' ')}</td>
      <td className="px-4 py-2.5 font-mono text-xs text-on-surface">
        {alarm.value.toFixed(1)} / {alarm.threshold.toFixed(1)}
      </td>
      <td className="px-4 py-2.5">
        {alarm.acknowledged
          ? <Check size={14} className="text-status-green" />
          : <button onClick={() => onAck(alarm.id)} className="text-xs text-primary hover:text-on-surface">Acknowledge</button>
        }
      </td>
    </tr>
  )
}

export function AlarmsPage() {
  const { alarms, acknowledgeAlarmLocal } = useTwinStore()
  const [filter, setFilter] = useState<typeof FILTER_OPTIONS[number]>('All')

  const filtered = alarms.filter((a) => {
    if (filter === 'All') return true
    if (filter === 'Unacknowledged') return !a.acknowledged
    return a.severity === filter
  })

  const unackedCount = alarms.filter((a) => !a.acknowledged).length

  const handleAck = async (id: string) => {
    try {
      await api.acknowledgeAlarm(id, 'operator')
      acknowledgeAlarmLocal(id)
    } catch {}
  }

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="bg-surface-container rounded border border-outline-variant flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant flex-shrink-0">
          <span className="text-base font-semibold text-on-surface">Alarms</span>
          <div className="flex items-center gap-2">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  filter === f
                    ? 'bg-primary-container text-primary border-primary/30'
                    : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {f}
                {f === 'Unacknowledged' && unackedCount > 0 && (
                  <span className="ml-1.5 bg-primary-container text-primary text-[9px] px-1 rounded-full">
                    {unackedCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-surface-container">
              <tr className="border-b border-outline-variant">
                {['Severity', 'Time', 'Asset', 'Alarm type', 'Value / Threshold', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-on-surface-variant">
                    No alarms match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => <AlarmTableRow key={a.id} alarm={a} onAck={handleAck} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
