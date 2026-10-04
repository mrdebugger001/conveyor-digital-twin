import React, { useState, useEffect } from 'react'
import {
  X,
  Sliders,
  RotateCcw,
  Play,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  Zap,
} from 'lucide-react'
import { useTwinStore } from '../../store/twinStore'
import { api } from '../../api/client'
import type { WhatIfRequest, WhatIfResponse } from '../../types/twin'

const PRESETS = [
  {
    name: 'Nominal Clean',
    desc: 'Rated operational baseline',
    params: { coalTph: 1200, moisturePct: 6.5, beltSpeed: 3.2, frictionFactor: 0.022 },
  },
  {
    name: 'Monsoon Wet Surge',
    desc: 'Heavy rain moisture & clumping',
    params: { coalTph: 1750, moisturePct: 18.5, beltSpeed: 3.2, frictionFactor: 0.032 },
  },
  {
    name: 'High-Capacity Peak',
    desc: 'Maximum throughput rate',
    params: { coalTph: 2200, moisturePct: 7.0, beltSpeed: 4.2, frictionFactor: 0.024 },
  },
  {
    name: 'Slow Haul Choke',
    desc: 'Low speed, deep trough sag',
    params: { coalTph: 1600, moisturePct: 12.0, beltSpeed: 2.1, frictionFactor: 0.027 },
  },
]

export function WhatIfSandboxModal() {
  const { isWhatIfOpen, setWhatIfOpen } = useTwinStore()

  const [params, setParams] = useState<WhatIfRequest>({
    coalTph: 1200,
    moisturePct: 6.5,
    beltSpeed: 3.2,
    frictionFactor: 0.022,
  })

  const [results, setResults] = useState<WhatIfResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState(false)

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWhatIfOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setWhatIfOpen])

  // Run calculation whenever sliders change
  useEffect(() => {
    if (!isWhatIfOpen) return
    let isCancelled = false
    setLoading(true)

    api
      .calculateWhatIf(params)
      .then((res) => {
        if (!isCancelled) {
          setResults(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error(err)
        if (!isCancelled) setLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [params, isWhatIfOpen])

  if (!isWhatIfOpen) return null

  const handleApply = async () => {
    try {
      await api.applyWhatIf(params)
      setApplied(true)
      setTimeout(() => setApplied(false), 3000)
    } catch (e) {
      console.error(e)
    }
  }

  const handleReset = async () => {
    try {
      await api.resetWhatIf()
      setParams({
        coalTph: 1200,
        moisturePct: 6.5,
        beltSpeed: 3.2,
        frictionFactor: 0.022,
      })
      setApplied(false)
    } catch (e) {
      console.error(e)
    }
  }

  const statusColor =
    results?.stressStatus === 'CRITICAL'
      ? 'bg-status-red/15 text-status-red border-status-red/50'
      : results?.stressStatus === 'WARNING'
      ? 'bg-status-amber/15 text-status-amber border-status-amber/50'
      : 'bg-status-green/15 text-status-green border-status-green/50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-high flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-container/40 border border-primary/40 flex items-center justify-center text-primary">
              <Sliders size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface">What-If Scenario Simulator</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary-container text-primary border border-primary/30">
                  CEMA / DIN 22101 ENGINE
                </span>
                {applied && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-status-green/20 text-status-green border border-status-green animate-pulse">
                    APPLIED TO TWIN
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                Dynamic payload simulation for coal throughput surges, moisture spikes, and splice stress limits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Baseline</span>
            </button>
            <button
              onClick={() => setWhatIfOpen(false)}
              className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body: Two Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Sliders & Presets */}
          <div className="w-[440px] border-r border-outline-variant flex flex-col justify-between overflow-y-auto p-6 bg-surface">
            <div className="flex flex-col gap-6">
              {/* Scenario Presets */}
              <div>
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2.5">
                  Pre-Configured Scenarios
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((pr) => (
                    <button
                      key={pr.name}
                      onClick={() => setParams({ ...pr.params })}
                      className="p-2.5 rounded-lg bg-surface-high border border-outline-variant text-left hover:border-primary transition-all cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-on-surface group-hover:text-primary block">
                        {pr.name}
                      </span>
                      <span className="text-[10px] text-on-surface-variant line-clamp-1">
                        {pr.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-outline-variant/60" />

              {/* Sliders */}
              <div className="flex flex-col gap-5">
                {/* 1. Coal Throughput */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-on-surface">Coal Throughput Rate</span>
                    <span className="font-mono text-sm font-bold text-primary">
                      {params.coalTph} <span className="text-[11px] font-normal text-on-surface-variant">TPH</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={400}
                    max={2500}
                    step={25}
                    value={params.coalTph}
                    onChange={(e) => setParams({ ...params, coalTph: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mt-1">
                    <span>400 TPH (Low)</span>
                    <span>1,200 (Nominal)</span>
                    <span>2,500 TPH (Peak)</span>
                  </div>
                </div>

                {/* 2. Moisture Content */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-on-surface">Moisture Content</span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        params.moisturePct > 15 ? 'text-status-amber' : 'text-primary'
                      }`}
                    >
                      {params.moisturePct.toFixed(1)} <span className="text-[11px] font-normal text-on-surface-variant">%</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={25.0}
                    step={0.5}
                    value={params.moisturePct}
                    onChange={(e) => setParams({ ...params, moisturePct: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mt-1">
                    <span>2.0% (Dry)</span>
                    <span>6.5% (Base)</span>
                    <span>25.0% (Monsoon Wet)</span>
                  </div>
                </div>

                {/* 3. Belt Speed */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-on-surface">Belt Velocity (v)</span>
                    <span className="font-mono text-sm font-bold text-primary">
                      {params.beltSpeed.toFixed(1)} <span className="text-[11px] font-normal text-on-surface-variant">m/s</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1.5}
                    max={5.0}
                    step={0.1}
                    value={params.beltSpeed}
                    onChange={(e) => setParams({ ...params, beltSpeed: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mt-1">
                    <span>1.5 m/s</span>
                    <span>3.2 m/s (Design)</span>
                    <span>5.0 m/s</span>
                  </div>
                </div>

                {/* 4. Idler Friction Factor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-on-surface">DIN 22101 Friction Factor (f)</span>
                    <span className="font-mono text-sm font-bold text-primary">
                      {params.frictionFactor.toFixed(3)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.015}
                    max={0.045}
                    step={0.001}
                    value={params.frictionFactor}
                    onChange={(e) => setParams({ ...params, frictionFactor: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mt-1">
                    <span>0.015 (Sealed/New)</span>
                    <span>0.022 (Standard)</span>
                    <span>0.045 (Worn/Muddy)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Commit Button */}
            <div className="pt-6 border-t border-outline-variant/60 flex flex-col gap-2">
              <button
                onClick={handleApply}
                className="w-full py-2.5 px-4 rounded-lg bg-primary text-surface font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all cursor-pointer shadow-lg"
              >
                <Zap size={14} />
                <span>Simulate & Apply to Live Digital Twin</span>
              </button>
            </div>
          </div>

          {/* Right Column: CEMA Physics Results & Engineering Diagnostics */}
          <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 bg-surface-container">
            <div className="flex flex-col gap-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${statusColor}`}>
                <div className="flex items-center gap-3">
                  {results?.stressStatus === 'CRITICAL' ? (
                    <AlertTriangle size={24} className="text-status-red flex-shrink-0 animate-bounce" />
                  ) : results?.stressStatus === 'WARNING' ? (
                    <AlertTriangle size={24} className="text-status-amber flex-shrink-0" />
                  ) : (
                    <CheckCircle2 size={24} className="text-status-green flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      CEMA Compliance: {results?.stressStatus ?? 'CALCULATING'}
                    </span>
                    <span className="text-xs text-on-surface">
                      Safety factor: <span className="font-mono font-bold">{results?.safetyFactor ?? '---'}</span> (ST2500 design limit: 1.50)
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-on-surface-variant block uppercase">Splice Fatigue Life</span>
                  <span className="text-base font-bold text-on-surface">
                    ~{results?.estimatedSpliceLifeHours.toLocaleString() ?? '---'} hrs
                  </span>
                </div>
              </div>

              {/* 6 Metric Analytical Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-surface border border-outline-variant">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold block mb-1">
                    Linear Payload qₘ
                  </span>
                  <div className="font-mono text-lg font-bold text-on-surface">
                    {results?.linearMassQm ?? '---'}{' '}
                    <span className="text-xs font-normal text-on-surface-variant">kg/m</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    Bulk density: 800 kg/m³
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface border border-outline-variant">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold block mb-1">
                    Head Tension T₁
                  </span>
                  <div className="font-mono text-lg font-bold text-on-surface">
                    {results?.cemaHeadTension ?? '---'}{' '}
                    <span className="text-xs font-normal text-on-surface-variant">kN</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    Slack T₂: {results?.cemaSlackTension ?? '---'} kN
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface border border-outline-variant">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold block mb-1">
                    Peak Joint Stress σ
                  </span>
                  <div
                    className={`font-mono text-lg font-bold ${
                      (results?.peakJointStressMpa ?? 0) > 15
                        ? 'text-status-red'
                        : (results?.peakJointStressMpa ?? 0) > 13.8
                        ? 'text-status-amber'
                        : 'text-primary'
                    }`}
                  >
                    {results?.peakJointStressMpa ?? '---'}{' '}
                    <span className="text-xs font-normal text-on-surface-variant">MPa</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    Tensile: {results?.tensileStressMpa ?? '---'} MPa
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface border border-outline-variant">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold block mb-1">
                    Catenary Belt Sag
                  </span>
                  <div
                    className={`font-mono text-lg font-bold ${
                      (results?.beltSagMm ?? 0) > 24 ? 'text-status-amber' : 'text-on-surface'
                    }`}
                  >
                    {results?.beltSagMm ?? '---'}{' '}
                    <span className="text-xs font-normal text-on-surface-variant">mm</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    {results?.cemaSagPct ?? '---'}% of idler pitch (limit: 2.0%)
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface border border-outline-variant">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold block mb-1">
                    Motor Drive Power
                  </span>
                  <div className="font-mono text-lg font-bold text-on-surface">
                    {results?.cemaMotorPowerKw ?? '---'}{' '}
                    <span className="text-xs font-normal text-on-surface-variant">kW</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    Rated nameplate: 450 kW
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface border border-outline-variant">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold block mb-1">
                    Bending Flex Stress
                  </span>
                  <div className="font-mono text-lg font-bold text-on-surface">
                    {results?.bendingStressMpa ?? '---'}{' '}
                    <span className="text-xs font-normal text-on-surface-variant">MPa</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    Idler radius: 76 mm
                  </span>
                </div>
              </div>

              {/* Engineering Recommendations List */}
              <div className="p-4 rounded-xl bg-surface border border-outline-variant">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                  <Activity size={14} className="text-primary" />
                  Engineering Advisory & Operating Window
                </span>
                <div className="flex flex-col gap-2">
                  {results?.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-on-surface leading-relaxed">
                      <span className="text-primary font-bold">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Note */}
            <div className="text-[11px] text-on-surface-variant font-mono pt-4 border-t border-outline-variant/60 flex items-center justify-between">
              <span>Standard: DIN 22101 / CEMA 7th Edition Continuous Bulk Handling</span>
              <span>Conveyor: CV-01 (ST2500 steel-cord belt, 1400 mm)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
