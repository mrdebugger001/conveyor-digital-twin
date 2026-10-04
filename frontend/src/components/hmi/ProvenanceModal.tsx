import React, { useEffect, useState } from 'react'
import { X, ShieldCheck, Database, Search, Filter, ExternalLink, HelpCircle } from 'lucide-react'
import { api } from '../../api/client'

interface ProvenanceItem {
  value: any
  unit: string
  source: string
  classification: string
  confidence: string
  uncertaintyPercent: number
}

interface Props {
  onClose: () => void
}

export function ProvenanceModal({ onClose }: Props) {
  const [params, setParams] = useState<Record<string, ProvenanceItem>>({})
  const [search, setSearch] = useState('')
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL')

  useEffect(() => {
    api.getDataProvenance().then((res) => {
      if (res?.parameters) {
        setParams(res.parameters)
      }
    }).catch(console.error)
  }, [])

  const classifications = [
    'ALL',
    'REAL_MEASURED',
    'MANUFACTURER_SPECIFIED',
    'STANDARD_REFERENCE',
    'DATASET_CALIBRATED',
    'ESTIMATED',
    'DEMO_ONLY',
  ]

  const getBadgeColor = (c: string) => {
    switch (c) {
      case 'REAL_MEASURED':
        return 'bg-status-green/20 text-status-green border-status-green/40'
      case 'MANUFACTURER_SPECIFIED':
        return 'bg-primary-container text-primary border-primary/40'
      case 'STANDARD_REFERENCE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40'
      case 'DATASET_CALIBRATED':
        return 'bg-status-amber/20 text-status-amber border-status-amber/40'
      case 'ESTIMATED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40'
      default:
        return 'bg-surface-high text-on-surface-variant border-outline-variant'
    }
  }

  const filteredEntries = Object.entries(params).filter(([key, item]) => {
    const matchesSearch = key.toLowerCase().includes(search.toLowerCase()) || item.source.toLowerCase().includes(search.toLowerCase())
    const matchesClass = selectedClassification === 'ALL' || item.classification === selectedClassification
    return matchesSearch && matchesClass
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-high/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container/30 border border-primary/40 flex items-center justify-center text-primary">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface tracking-tight">
                  Parameter Data Provenance & Uncertainty Registry
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-container text-primary font-medium">
                  ISO / ASME V&V 40
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Full scientific traceability: Every parameter is classified by origin, confidence level, and uncertainty bounds.
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

        {/* Search & Filter Toolbar */}
        <div className="px-6 py-3 border-b border-outline-variant bg-surface-high/20 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parameter key, source standard, OEM..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-high border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {classifications.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedClassification(c)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${
                  selectedClassification === c
                    ? 'bg-primary-container text-primary font-bold shadow'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-high'
                }`}
              >
                {c.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Table of Parameters */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="bg-surface-high/30 border border-outline-variant rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant text-[10px] text-on-surface-variant uppercase font-mono bg-surface-high/40">
                    <th className="py-2.5 px-4">Parameter Key</th>
                    <th className="py-2.5 px-3">Nominal Value</th>
                    <th className="py-2.5 px-2">Unit</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-2">Confidence</th>
                    <th className="py-2.5 px-2">Uncertainty</th>
                    <th className="py-2.5 px-4">Source Standard / OEM / Dataset Citation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 font-mono">
                  {filteredEntries.map(([key, item]) => (
                    <tr key={key} className="hover:bg-surface-high/40 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-primary">
                        {key}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface font-bold">
                        {String(item.value)}
                      </td>
                      <td className="py-2.5 px-2 text-on-surface-variant">
                        {item.unit || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] border font-bold ${getBadgeColor(item.classification)}`}>
                          {item.classification}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`text-[10px] font-bold ${item.confidence === 'HIGH' ? 'text-status-green' : 'text-status-amber'}`}>
                          {item.confidence}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-on-surface">
                        ±{item.uncertaintyPercent}%
                      </td>
                      <td className="py-2.5 px-4 font-sans text-xs text-on-surface-variant">
                        {item.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant bg-surface-high/40">
          <span className="text-[11px] text-on-surface-variant">
            Showing {filteredEntries.length} of {Object.keys(params).length} parameter provenance records.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-high border border-outline-variant text-on-surface hover:text-primary text-xs font-semibold transition-colors"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  )
}
