import React, { useState } from 'react'
import { Plus, Minus, Play, Square, RotateCcw, AlertOctagon, Zap, Sliders, Eye } from 'lucide-react'
import { useTwinStore } from '../../store/twinStore'
import { useControlStore } from '../../store/controlStore'
import { api } from '../../api/client'

export function ControlPanel() {
  const { conveyor, setWhatIfOpen, setOpticalInspectorOpen } = useTwinStore()
  const { speedInput, setSpeedInput, isManual, setManual } = useControlStore()
  const [loading, setLoading] = useState(false)

  const runState = conveyor?.runState ?? 'STOPPED'
  const isThrottleEnabled = conveyor?.smartThrottleEnabled ?? true
  const isThrottleActive = conveyor?.smartThrottleActive ?? false
  const deratePct = conveyor?.smartThrottleDeratePct ?? 0

  const runColor =
    runState === 'RUNNING'
      ? 'text-status-green'
      : runState === 'FAULTED'
      ? 'text-status-red'
      : runState === 'STARTING' || runState === 'STOPPING'
      ? 'text-status-amber'
      : 'text-status-gray'

  async function withLoad(fn: () => Promise<any>) {
    setLoading(true)
    try {
      await fn()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const adjustSpeed = (delta: number) => {
    const next = Math.max(0.1, Math.min(5.0, speedInput + delta))
    setSpeedInput(parseFloat(next.toFixed(2)))
    withLoad(() => api.setSpeed(next))
  }

  const toggleThrottle = () => {
    withLoad(() => api.toggleSmartThrottle(!isThrottleEnabled))
  }

  return (
    <div className="h-14 bg-surface-high border-t border-outline-variant flex items-center px-4 justify-between flex-shrink-0 z-30">
      {/* Left group: Status and Start/Stop */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              runState === 'RUNNING'
                ? 'bg-status-green'
                : runState === 'FAULTED'
                ? 'bg-status-red animate-pulse'
                : 'bg-status-gray'
            }`}
          />
          <span className="text-sm font-medium text-on-surface">Conveyor C01</span>
          <span className={`text-xs font-mono font-semibold uppercase tracking-wider ${runColor}`}>
            {runState}
          </span>
        </div>

        <div className="w-px h-6 bg-outline-variant" />

        {/* Buttons: Start, Stop, Reset */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => withLoad(api.startConveyor)}
            disabled={loading || runState === 'RUNNING' || runState === 'FAULTED'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-status-green/15 text-status-green border border-status-green/30 hover:bg-status-green hover:text-surface disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <Play size={12} fill="currentColor" />
            <span>Start</span>
          </button>
          <button
            onClick={() => withLoad(api.stopConveyor)}
            disabled={loading || runState === 'STOPPED' || runState === 'FAULTED'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <Square size={12} fill="currentColor" />
            <span>Stop</span>
          </button>
          <button
            onClick={() => withLoad(api.resetConveyor)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Center group: Auto/Manual, Speed, AI Throttle */}
      <div className="flex items-center gap-4">
        {/* Auto / Manual Segmented Button */}
        <div className="flex items-center rounded bg-surface-container border border-outline-variant p-0.5">
          {(['Auto', 'Manual'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setManual(m === 'Manual')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                isManual === (m === 'Manual')
                  ? 'bg-primary-container text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Speed stepper */}
        <div className="flex items-center gap-1.5 bg-surface-container border border-outline-variant px-1.5 py-1 rounded">
          <button
            onClick={() => adjustSpeed(-0.1)}
            className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-high rounded transition-colors"
            title="Decrease speed"
          >
            <Minus size={13} />
          </button>
          <span className="font-mono text-xs font-medium text-on-surface w-16 text-center">
            {speedInput.toFixed(2)} m/s
          </span>
          <button
            onClick={() => adjustSpeed(0.1)}
            className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-high rounded transition-colors"
            title="Increase speed"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* AI Closed-Loop Smart Throttle Toggle Button */}
        <button
          onClick={toggleThrottle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
            isThrottleActive
              ? 'bg-status-amber/20 border-status-amber text-status-amber animate-pulse shadow-md'
              : isThrottleEnabled
              ? 'bg-primary-container/30 border-primary/50 text-primary hover:bg-primary-container/50'
              : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface'
          }`}
          title="Automatic speed/feed derating under high splice stress"
        >
          <Zap size={13} className={isThrottleActive ? 'animate-bounce text-status-amber' : ''} />
          <span>
            {isThrottleActive
              ? `AI THROTTLE (-${deratePct.toFixed(0)}%)`
              : isThrottleEnabled
              ? 'AI THROTTLE: ON'
              : 'AI THROTTLE: OFF'}
          </span>
        </button>
      </div>

      {/* Right group: Digital Sandbox, Optical Splice Inspector, and E-STOP */}
      <div className="flex items-center gap-3">
        {/* Launch What-If Sandbox */}
        <button
          onClick={() => setWhatIfOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-primary transition-all cursor-pointer"
          title="Open CEMA / DIN 22101 Digital Sandbox"
        >
          <Sliders size={13} className="text-primary" />
          <span>What-If Sandbox</span>
        </button>

        {/* Launch Edge AI Optical Splice Inspector */}
        <button
          onClick={() => setOpticalInspectorOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-primary transition-all cursor-pointer"
          title="Open High-Speed Line-Scan YOLOv8 Splice Vision"
        >
          <Eye size={13} className="text-status-green" />
          <span>Optical Inspector</span>
        </button>

        <div className="w-px h-6 bg-outline-variant" />

        {/* E-STOP button */}
        <button
          onClick={() => withLoad(api.estop)}
          className="flex items-center gap-1.5 px-5 py-2 bg-status-red text-white font-bold text-xs tracking-wider rounded uppercase hover:bg-red-700 active:scale-95 transition-all shadow-lg hover:shadow-red-900/30 cursor-pointer"
        >
          <AlertOctagon size={15} />
          <span>E-STOP</span>
        </button>
      </div>
    </div>
  )
}
