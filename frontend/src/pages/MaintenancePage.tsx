import React, { useEffect, useState } from 'react'
import { AlertOctagon, AlertTriangle, Plus } from 'lucide-react'
import { api } from '../api/client'

interface MaintenanceRecord {
  id: number;
  assetId: string;
  description: string;
  status: string;
  priority: string;
  riskHorizonHours: number | null;
  createdAt: string;
}

function PriorityChip({ priority }: { priority: string }) {
  const cls = priority === 'CRITICAL'
    ? 'bg-status-red/10 text-status-red border-status-red/30'
    : priority === 'HIGH'
    ? 'bg-status-amber/10 text-status-amber border-status-amber/30'
    : 'bg-surface-high text-on-surface-variant border-outline-variant'
  const Icon = priority === 'CRITICAL' ? AlertOctagon : AlertTriangle
  return (
    <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${cls}`}>
      <Icon size={10} /> {priority} risk
    </span>
  )
}

function RecordCard({ record }: { record: MaintenanceRecord }) {
  const borderColor = record.priority === 'CRITICAL' ? 'border-l-status-red' :
    record.priority === 'HIGH' ? 'border-l-status-amber' : 'border-l-outline-variant'

  return (
    <div className={`bg-surface-container rounded border border-outline-variant border-l-2 ${borderColor} p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-on-surface">{record.assetId}</span>
        <PriorityChip priority={record.priority} />
      </div>
      <p className="text-xs text-on-surface-variant leading-relaxed">{record.description}</p>
      {record.riskHorizonHours && (
        <p className="text-xs">
          <span className="text-on-surface-variant">Estimated risk horizon: </span>
          <span className="font-mono text-on-surface">~{record.riskHorizonHours.toFixed(0)}h</span>
        </p>
      )}
      <div className="flex items-center gap-2 mt-1">
        <button className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary-container text-primary rounded hover:bg-primary hover:text-surface transition-colors">
          <Plus size={11} /> Create ticket
        </button>
        <button className="text-xs text-on-surface-variant hover:text-on-surface">Dismiss</button>
      </div>
    </div>
  )
}

export function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  useEffect(() => { api.getMaintenance().then((r: any) => setRecords(r)).catch(() => {}) }, [])

  const openRecords = records.filter((r) => r.status === 'OPEN')
  const criticalCount = openRecords.filter((r) => r.priority === 'CRITICAL').length
  const avgHealth = 91

  return (
    <div className="flex flex-col h-full p-4 gap-3 overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0">
        <span className="text-base font-semibold text-on-surface">Maintenance</span>
        <div className="flex gap-3 mt-2">
          {[
            { label: 'Assets at risk', value: String(criticalCount) },
            { label: 'Open recommendations', value: String(openRecords.length) },
            { label: 'Avg. fleet health', value: `${avgHealth}%` },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container rounded border border-outline-variant px-4 py-2 flex flex-col">
              <span className="font-mono text-lg font-semibold text-on-surface">{s.value}</span>
              <span className="text-[10px] text-on-surface-variant">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Records list */}
      <div className="flex flex-col gap-3">
        {records.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-8">No maintenance records.</p>
        ) : (
          records.map((r) => <RecordCard key={r.id} record={r} />)
        )}
      </div>
    </div>
  )
}
