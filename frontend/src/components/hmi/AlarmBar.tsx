import React, { useState } from 'react'
import { ChevronUp, ChevronDown, Check } from 'lucide-react'
import { useTwinStore } from '../../store/twinStore'
import { api } from '../../api/client'
import type { Alarm } from '../../types/twin'

export function AlarmBar() {
  const [expanded, setExpanded] = useState(false)
  const alarms = useTwinStore((s) => s.alarms)
  const { acknowledgeAlarmLocal } = useTwinStore()

  const unacknowledged = alarms.filter((a) => !a.acknowledged)
  const activeCount = unacknowledged.length
  const latestAlarm = unacknowledged[0] ?? alarms[0]

  const hasCritical = unacknowledged.some(
    (a) => a.severity === 'CRITICAL' || a.severity === 'EMERGENCY'
  )
  const hasWarning = unacknowledged.some((a) => a.severity === 'WARNING')

  const dotColor = hasCritical
    ? 'bg-status-red animate-pulse'
    : hasWarning
    ? 'bg-status-amber'
    : 'bg-status-green'

  const handleAck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.acknowledgeAlarm(id, 'operator')
      acknowledgeAlarmLocal(id)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="border-t border-outline-variant bg-surface-container flex-shrink-0 z-20">
      {/* Collapsed Single-Row Summary Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-5 py-2.5 hover:bg-surface-high/60 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Status dot */}
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />

          {/* Alarm count */}
          <span className="text-xs font-medium text-on-surface whitespace-nowrap">
            {activeCount > 0 ? `${activeCount} active alarm${activeCount > 1 ? 's' : ''}` : 'No active alarms'}
          </span>

          {/* Short excerpt of the latest alarm */}
          {latestAlarm && (
            <span className="text-xs text-on-surface-variant truncate">
              — {latestAlarm.message}
            </span>
          )}
        </div>

        {/* Trailing chevron icon button to expand into a drawer */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="text-on-surface-variant hover:text-on-surface p-1 rounded transition-colors ml-4 flex-shrink-0"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Expanded Alarm Drawer */}
      {expanded && (
        <div className="max-h-48 overflow-y-auto border-t border-outline-variant divide-y divide-outline-variant/40 bg-surface-container">
          {alarms.length === 0 ? (
            <p className="px-5 py-4 text-xs text-on-surface-variant">No alarm records in system.</p>
          ) : (
            alarms.slice(0, 30).map((alarm) => {
              const isCrit = alarm.severity === 'CRITICAL' || alarm.severity === 'EMERGENCY'
              const isWarn = alarm.severity === 'WARNING'
              const colorStrip = isCrit ? 'border-l-status-red' : isWarn ? 'border-l-status-amber' : 'border-l-primary'

              return (
                <div
                  key={alarm.id}
                  className={`flex items-center justify-between px-5 py-2 hover:bg-surface-high/40 transition-colors border-l-4 ${colorStrip}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[11px] text-on-surface-variant">
                      {new Date(alarm.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-xs font-medium text-on-surface">
                      {alarm.assetId.replace('joint-', '').replace('motor-', '')}
                    </span>
                    <span className="text-xs text-on-surface truncate">
                      {alarm.message}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className="font-mono text-xs text-on-surface-variant">
                      {alarm.value.toFixed(1)} / {alarm.threshold.toFixed(0)}
                    </span>
                    {alarm.acknowledged ? (
                      <span className="flex items-center gap-1 text-[11px] text-status-green font-medium">
                        <Check size={13} /> Acked
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleAck(alarm.id, e)}
                        className="text-xs text-primary hover:text-white px-2.5 py-1 rounded bg-primary-container/40 hover:bg-primary-container transition-colors font-medium"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
