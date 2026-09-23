import React, { useState } from 'react'
import { Plus, Minus, Play, Square, RotateCcw, AlertOctagon } from 'lucide-react'
import { useTwinStore } from '../../store/twinStore'
import { useControlStore } from '../../store/controlStore'
import { api } from '../../api/client'

export function ControlPanel() {
  const conveyor = useTwinStore((s) => s.conveyor)
  const { speedInput, setSpeedInput, isManual, setManual } = useControlStore()
  const [loading, setLoading] = useState(false)

  const runState = conveyor?.runState ?? 'STOPPED'

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

  return (
    <div className="h-14 bg-surface-high border-t border-outline-variant flex items-center px-4 justify-between flex-shrink-0 z-30">
      {/* Left group */}
      <div className="flex items-center gap-2.5">
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

      {/* Center group */}
      <div className="flex items-center gap-5">
        {/* Buttons: Start (green tint), Stop (outlined), Reset (outlined) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => withLoad(api.startConveyor)}
            disabled={loading || runState === 'RUNNING' || runState === 'FAULTED'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium bg-status-green/15 text-status-green border border-status-green/30 hover:bg-status-green hover:text-surface disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <Play size={13} fill="currentColor" />
            <span>Start</span>
          </button>
          <button
            onClick={() => withLoad(api.stopConveyor)}
            disabled={loading || runState === 'STOPPED' || runState === 'FAULTED'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <Square size={13} fill="currentColor" />
            <span>Stop</span>
          </button>
          <button
            onClick={() => withLoad(api.resetConveyor)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

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

        {/* Speed stepper: flanked by minus/plus Icon Buttons */}
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
      </div>

      {/* Far Right: E-STOP button */}
      <div className="flex items-center gap-4">
        <div className="w-px h-7 bg-outline-variant" />
        <button
          onClick={() => withLoad(api.estop)}
          className="flex items-center gap-2 px-6 py-2 bg-status-red text-white font-bold text-sm tracking-wider rounded uppercase hover:bg-red-700 active:scale-95 transition-all shadow-lg hover:shadow-red-900/30 cursor-pointer"
        >
          <AlertOctagon size={16} />
          <span>E-STOP</span>
        </button>
      </div>
    </div>
  )
}
