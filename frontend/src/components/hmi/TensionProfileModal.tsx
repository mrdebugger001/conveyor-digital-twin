import React, { useEffect, useState } from 'react'
import { X, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert, Activity, Info } from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'
import { api } from '../../api/client'

interface JointMarker {
  id: string
  positionSM: number
  tensionKn: number
  zone: string
  totalStressMpa: number
  tensileStressMpa: number
  bendingStressMpa: number
  safetyFactor: number
  healthPct: number
  cumulativeDamageD: number
  cyclesCompleted: number
}

interface TensionData {
  totalLengthM: number
  headTensionKn: number
  slackTensionKn: number
  effectiveTensionKn: number
  tractionMargin: number
  isSlipWarning: boolean
  spatialSM: number[]
  tensionKn: number[]
  joints: JointMarker[]
}

interface Props {
  onClose: () => void
  onSelectJoint?: (jointId: string) => void
}

export function TensionProfileModal({ onClose, onSelectJoint }: Props) {
  const [data, setData] = useState<TensionData | null>(null)
  const [selectedJoint, setSelectedJoint] = useState<JointMarker | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await api.getTensionProfile()
      setData(res)
      if (!selectedJoint && res.joints?.length > 0) {
        // Default select J023 if present, or first
        const j23 = res.joints.find((j: JointMarker) => j.id === 'J023')
        setSelectedJoint(j23 || res.joints[0])
      }
    } catch (e) {
      console.error('Failed to load tension profile', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 1000)
    return () => clearInterval(interval)
  }, [])

  // Prepare chart series from spatial points
  const chartData = (data?.spatialSM || []).map((s, idx) => ({
    s,
    tensionKn: data?.tensionKn[idx] || 0,
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-high/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container/30 border border-primary/40 flex items-center justify-center text-primary">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface tracking-tight">
                  1D Distributed Belt Tension Profile & Splice Kinematics
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-container text-primary font-medium">
                  DIN 22101 / CEMA 7th Ed.
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Continuous numerical integration of dT/ds along the 720m loop with Euler-Eytelwein traction limits.
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                Tight Side Tension (T₁)
              </span>
              <span className="text-lg font-mono font-bold text-primary">
                {data ? `${data.headTensionKn.toFixed(1)} kN` : '--'}
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">At drive head pulley wrap</span>
            </div>

            <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                Slack Side Tension (T₂)
              </span>
              <span className="text-lg font-mono font-bold text-on-surface">
                {data ? `${data.slackTensionKn.toFixed(1)} kN` : '--'}
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">Gravity takeup / return strand</span>
            </div>

            <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                Effective Pull (Tₑ)
              </span>
              <span className="text-lg font-mono font-bold text-on-surface">
                {data ? `${data.effectiveTensionKn.toFixed(1)} kN` : '--'}
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">Tₑ = T₁ - T₂ (Motion resistance)</span>
            </div>

            <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                Euler Traction Margin
              </span>
              <span
                className={`text-lg font-mono font-bold ${
                  (data?.tractionMargin ?? 2.0) < 1.15 ? 'text-status-red' : 'text-status-green'
                }`}
              >
                {data ? `${data.tractionMargin.toFixed(2)}x` : '--'}
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">e^(μ·α) limit / actual ratio</span>
            </div>

            <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                Drive Pulley Slip Status
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {data?.isSlipWarning ? (
                  <>
                    <ShieldAlert size={16} className="text-status-red" />
                    <span className="text-xs font-bold text-status-red">SLIP WARNING</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="text-status-green" />
                    <span className="text-xs font-bold text-status-green">NO SLIP (SAFE)</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">Ceramic lagging μ = 0.38</span>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="bg-surface-high/30 border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                  Spatial Tension Profile T(s) along 720m Conveyor Loop
                </span>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  (Carrying: 0→350m | Drive Wrap: 350→355m | Return: 355→720m)
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-primary rounded-full inline-block" /> Belt Tension T(s)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-status-red inline-block" /> Splice J023
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-status-green inline-block" /> Healthy Splices (23)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <defs>
                    <linearGradient id="tensionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8ECDFF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8ECDFF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="s"
                    tick={{ fontSize: 10, fill: '#9AA3AC', fontFamily: 'JetBrains Mono, monospace' }}
                    unit="m"
                    domain={[0, 720]}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9AA3AC', fontFamily: 'JetBrains Mono, monospace' }}
                    unit=" kN"
                    domain={[20, 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1B1F24',
                      border: '1px solid #33383F',
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)} kN`, 'Local Tension']}
                    labelFormatter={(label) => `Conveyor Loop Position: ${Number(label).toFixed(1)} m`}
                  />
                  {/* Zone indicators */}
                  <ReferenceArea x1={0} x2={350} fill="#8ECDFF" fillOpacity={0.04} label={{ value: 'CARRYING STRAND', fill: '#9AA3AC', fontSize: 9, position: 'insideTopLeft' }} />
                  <ReferenceArea x1={350} x2={355} fill="#F2555A" fillOpacity={0.15} label={{ value: 'DRIVE', fill: '#F2555A', fontSize: 9, position: 'insideTop' }} />
                  <ReferenceArea x1={355} x2={720} fill="#4ADE80" fillOpacity={0.04} label={{ value: 'RETURN STRAND', fill: '#9AA3AC', fontSize: 9, position: 'insideTopRight' }} />

                  {/* Allowable threshold lines */}
                  <ReferenceLine y={165} stroke="#F2B84B" strokeDasharray="3 3" label={{ value: 'Warning 165 kN', fill: '#F2B84B', fontSize: 9 }} />
                  <ReferenceLine y={195} stroke="#F2555A" strokeDasharray="3 3" label={{ value: 'Critical 195 kN', fill: '#F2555A', fontSize: 9 }} />

                  <Area type="monotone" dataKey="tensionKn" stroke="#8ECDFF" strokeWidth={2} fillOpacity={1} fill="url(#tensionGrad)" />

                  {/* Render 24 joint markers on the tension curve */}
                  {data?.joints?.map((j) => (
                    <ReferenceLine
                      key={j.id}
                      x={j.positionSM}
                      stroke={j.id === 'J023' ? '#F2555A' : '#4ADE80'}
                      strokeWidth={j.id === 'J023' ? 2 : 1}
                      strokeDasharray={j.id === 'J023' ? undefined : '2 2'}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 24 Splices Kinematic Track & Selected Joint Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: 24 Splices Visual Grid */}
            <div className="lg:col-span-2 bg-surface-high/30 border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                  24 Splice Kinematic Loop Status (30m Equal Pitch)
                </span>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  Click joint to inspect local stress & fatigue
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {data?.joints?.map((j) => {
                  const isSelected = selectedJoint?.id === j.id
                  const isJ23 = j.id === 'J023'
                  return (
                    <button
                      key={j.id}
                      onClick={() => {
                        setSelectedJoint(j)
                        if (onSelectJoint) onSelectJoint(`joint-${j.id}`)
                      }}
                      className={`flex flex-col items-center p-2 rounded-lg border transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-primary-container/40 border-primary ring-1 ring-primary'
                          : isJ23
                          ? 'bg-status-red/10 border-status-red/40 hover:bg-status-red/20'
                          : 'bg-surface-high/60 border-outline-variant hover:border-primary/50'
                      }`}
                    >
                      <span className={`text-[11px] font-mono font-bold ${isJ23 ? 'text-status-red' : 'text-on-surface'}`}>
                        {j.id}
                      </span>
                      <span className="text-[9px] font-mono text-on-surface-variant mt-0.5">
                        {j.positionSM.toFixed(0)}m
                      </span>
                      <span
                        className={`text-[9px] font-mono font-semibold mt-1 px-1 rounded ${
                          j.totalStressMpa > 14.5
                            ? 'bg-status-red/20 text-status-red'
                            : j.totalStressMpa > 12.0
                            ? 'bg-status-amber/20 text-status-amber'
                            : 'bg-status-green/20 text-status-green'
                        }`}
                      >
                        {j.totalStressMpa.toFixed(1)} MPa
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right 1 Col: Selected Splice Deep Drill-down */}
            <div className="bg-surface-high/50 border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-on-surface font-mono">
                    Splice {selectedJoint?.id ?? '--'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-high border border-outline-variant text-primary font-semibold">
                    {selectedJoint?.zone.replace('_', ' ') ?? '--'}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    (selectedJoint?.healthPct ?? 100) < 60
                      ? 'bg-status-red/20 text-status-red'
                      : (selectedJoint?.healthPct ?? 100) < 80
                      ? 'bg-status-amber/20 text-status-amber'
                      : 'bg-status-green/20 text-status-green'
                  }`}
                >
                  Health: {selectedJoint ? `${selectedJoint.healthPct.toFixed(0)}%` : '--'}
                </span>
              </div>

              {selectedJoint && (
                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span className="text-on-surface-variant">Loop Coordinate s:</span>
                    <span className="font-mono text-on-surface">{selectedJoint.positionSM.toFixed(1)} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span className="text-on-surface-variant">Local Belt Tension T(s):</span>
                    <span className="font-mono text-on-surface">{selectedJoint.tensionKn.toFixed(1)} kN</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span className="text-on-surface-variant">Tensile Stress (T/A_eff):</span>
                    <span className="font-mono text-on-surface">{selectedJoint.tensileStressMpa.toFixed(2)} MPa</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span className="text-on-surface-variant">Pulley Bending Stress (Et/2R):</span>
                    <span className="font-mono text-on-surface">{selectedJoint.bendingStressMpa.toFixed(2)} MPa</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span className="text-on-surface-variant font-semibold">Total Combined Stress (Kt):</span>
                    <span className="font-mono font-bold text-primary">{selectedJoint.totalStressMpa.toFixed(2)} MPa</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span className="text-on-surface-variant">Safety Factor (S_ut / σ):</span>
                    <span
                      className={`font-mono font-bold ${
                        selectedJoint.safetyFactor < 1.5 ? 'text-status-red' : 'text-status-green'
                      }`}
                    >
                      {selectedJoint.safetyFactor.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span className="text-on-surface-variant">Palmgren-Miner Damage (D):</span>
                    <span className="font-mono text-status-amber">
                      {selectedJoint.cumulativeDamageD.toFixed(4)} / 1.0000
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-on-surface-variant">Loop Revolutions:</span>
                    <span className="font-mono text-on-surface">{selectedJoint.cyclesCompleted} cycles</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant bg-surface-high/40">
          <span className="text-[11px] text-on-surface-variant">
            Data calibrated against DIN 22101 standards & Mendeley Industrial Belt Drive datasets.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-high border border-outline-variant text-on-surface hover:text-primary text-xs font-semibold transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  )
}
