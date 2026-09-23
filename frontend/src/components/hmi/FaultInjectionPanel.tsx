import React, { useState, useEffect } from 'react'
import { X, Zap } from 'lucide-react'
import { api } from '../../api/client'
import type { FaultInjectionConfig } from '../../types/twin'

const DEFAULT_CONFIG: FaultInjectionConfig = {
  misalignment: false,
  highTension: false,
  highVibration: false,
  motorOverheat: false,
  bearingFailure: false,
  jointDamageId: 'J023',
  jointDamageEnabled: false,
  beltTear: false,
  conveyorJam: false,
}

const JOINT_OPTIONS = Array.from({ length: 24 }, (_, i) => `J${String(i + 1).padStart(3, '0')}`)

interface Props { onClose: () => void }

export function FaultInjectionPanel({ onClose }: Props) {
  const [config, setConfig] = useState<FaultInjectionConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getFaults().then((c) => setConfig({ ...DEFAULT_CONFIG, ...c })).catch(() => {})
  }, [])

  const toggle = (key: keyof FaultInjectionConfig) => {
    const next = { ...config, [key]: !config[key] }
    setConfig(next)
    api.setFaults(next).catch(() => {})
  }

  const FAULTS: { key: keyof FaultInjectionConfig; label: string }[] = [
    { key: 'misalignment', label: 'Misalignment' },
    { key: 'highTension', label: 'High tension' },
    { key: 'highVibration', label: 'High vibration' },
    { key: 'motorOverheat', label: 'Motor overheat' },
    { key: 'bearingFailure', label: 'Bearing failure' },
    { key: 'beltTear', label: 'Belt tear' },
    { key: 'conveyorJam', label: 'Conveyor jam' },
  ]

  const SLIDERS = [
    { key: 'speed', label: 'Belt speed', unit: 'm/s', min: 0, max: 5, step: 0.1, defaultVal: 3.2 },
    { key: 'load', label: 'Load', unit: '%', min: 0, max: 100, step: 1, defaultVal: 75 },
    { key: 'tension', label: 'Tension', unit: 'kN', min: 100, max: 220, step: 1, defaultVal: 145 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container border border-outline-variant rounded-lg w-[440px] max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <span className="text-sm font-semibold text-on-surface">Simulator</span>
            <span className="text-[10px] bg-primary-container text-primary px-2 py-0.5 rounded">SIMULATION</span>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Sliders */}
          {SLIDERS.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-on-surface-variant">{s.label}</span>
                <span className="font-mono text-xs text-on-surface">{s.defaultVal} {s.unit}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                defaultValue={s.defaultVal}
                className="w-full accent-primary"
              />
            </div>
          ))}

          <div className="border-t border-outline-variant" />

          {/* Fault injection */}
          <div>
            <p className="text-xs text-on-surface-variant mb-3 uppercase tracking-wider">Fault injection</p>
            <div className="flex flex-col gap-2">
              {FAULTS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!config[key]}
                    onChange={() => toggle(key)}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm text-on-surface">{label}</span>
                </label>
              ))}

              {/* Joint damage with dropdown */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.jointDamageEnabled}
                  onChange={() => toggle('jointDamageEnabled')}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-on-surface">Joint damage</span>
                {config.jointDamageEnabled && (
                  <select
                    value={config.jointDamageId ?? 'J023'}
                    onChange={(e) => {
                      const next = { ...config, jointDamageId: e.target.value }
                      setConfig(next)
                      api.setFaults(next).catch(() => {})
                    }}
                    className="ml-auto text-xs bg-surface-high border border-outline-variant rounded px-2 py-1 text-on-surface"
                  >
                    {JOINT_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
                  </select>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-outline-variant">
          <button onClick={onClose} className="text-sm text-on-surface-variant hover:text-on-surface">Cancel</button>
          <button
            onClick={async () => {
              setSaving(true)
              const reset: FaultInjectionConfig = { ...DEFAULT_CONFIG }
              setConfig(reset)
              await api.setFaults(reset).catch(() => {})
              setSaving(false)
            }}
            className="px-4 py-2 bg-status-red text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
          >
            {saving ? 'Resetting...' : 'Reset simulation'}
          </button>
        </div>
      </div>
    </div>
  )
}
