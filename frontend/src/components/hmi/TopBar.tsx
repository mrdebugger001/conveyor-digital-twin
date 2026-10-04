import React, { useState, useEffect } from 'react'
import { User, Volume2, VolumeX, Sun, Moon, Zap } from 'lucide-react'
import { useTwinStore } from '../../store/twinStore'
import { useControlStore } from '../../store/controlStore'

const MODES = ['Live', 'Simulation', 'Playback'] as const

export function TopBar() {
  const { connectionStatus, theme, toggleTheme, conveyor } = useTwinStore()
  const { mode, setMode } = useControlStore()
  const [currentTime, setCurrentTime] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(false)

  // Live UTC timestamp
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const str = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 8) + ' UTC'
      setCurrentTime(str)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const isOnline = connectionStatus === 'ONLINE'
  const isDark = theme === 'dark'
  const throttleActive = conveyor?.smartThrottleActive ?? false
  const deratePct = conveyor?.smartThrottleDeratePct ?? 0

  return (
    <header className="flex items-center justify-between px-5 h-14 bg-surface-container border-b border-outline-variant flex-shrink-0 z-30 transition-colors">
      {/* Left side: title + subtitle + AI throttle alert pill */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col justify-center">
          <h1 className="text-sm font-semibold text-on-surface tracking-tight leading-none">
            Coal Conveyor C01 — Digital Twin
          </h1>
          <span className="text-[11px] text-on-surface-variant font-mono mt-1">
            CEMA / DIN 22101 · ST2500 Steel-Cord Splice Physics
          </span>
        </div>

        {/* AI Smart Throttle Active Badge */}
        {throttleActive && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-amber/20 border border-status-amber text-status-amber text-[11px] font-bold animate-pulse shadow-lg">
            <Zap size={13} className="text-status-amber animate-bounce" />
            <span>AI THROTTLE ACTIVE (-{deratePct.toFixed(0)}% LOAD)</span>
          </div>
        )}
      </div>

      {/* Right side: segmented button + theme toggle + sound + status chip + clock + user */}
      <div className="flex items-center gap-3.5">
        {/* Material 3 Segmented Button */}
        <div className="flex items-center rounded-full bg-surface-high border border-outline-variant p-0.5">
          {MODES.map((m) => {
            const isSelected = mode.toUpperCase() === m.toUpperCase()
            return (
              <button
                key={m}
                onClick={() => setMode(m.toUpperCase() as any)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  isSelected
                    ? 'bg-primary-container text-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>

        {/* Theme Toggle: Sun / Moon */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-full border border-outline-variant bg-surface-high text-on-surface-variant hover:text-on-surface hover:border-primary transition-all flex items-center justify-center cursor-pointer shadow-sm"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={15} className="text-status-amber" /> : <Moon size={15} className="text-primary" />}
        </button>

        {/* Audio Alert Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 rounded-full border border-outline-variant bg-surface-high text-xs transition-colors flex items-center justify-center ${
            soundEnabled ? 'text-primary bg-primary-container/40 border-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          title={soundEnabled ? 'Alarm sounds enabled' : 'Muted'}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        {/* Status chip: "System online", green dot */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-high border border-outline-variant text-xs font-medium text-on-surface">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-status-green animate-pulse' : 'bg-status-red'
            }`}
          />
          <span>{isOnline ? 'System online' : 'Reconnecting'}</span>
        </div>

        {/* Current timestamp in monospace label-small */}
        <span className="text-xs font-mono text-on-surface-variant tracking-tight">
          {currentTime}
        </span>

        {/* Circular account icon button */}
        <button
          className="w-8 h-8 rounded-full bg-surface-high border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-primary transition-colors cursor-pointer"
          title="Operator Console"
        >
          <User size={15} />
        </button>
      </div>
    </header>
  )
}
