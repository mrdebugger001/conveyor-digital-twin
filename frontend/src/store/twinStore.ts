import { create } from 'zustand'
import type { ConveyorState, Alarm } from '../types/twin'

type ConnectionStatus = 'ONLINE' | 'RECONNECTING' | 'OFFLINE'
export type ThemeMode = 'dark' | 'light'

export interface HistoryPoint {
  ts: string
  value: number
}

interface TwinStore {
  conveyor: ConveyorState | null
  alarms: Alarm[]
  connectionStatus: ConnectionStatus
  selectedAssetId: string | null
  theme: ThemeMode
  liveHistory: {
    speed: HistoryPoint[]
    tension: HistoryPoint[]
    vibration: HistoryPoint[]
    temperature: HistoryPoint[]
    load: HistoryPoint[]
    selectedAssetVibration: HistoryPoint[]
  }
  setConveyor: (state: ConveyorState) => void
  addAlarm: (alarm: Alarm) => void
  updateAlarm: (alarm: Alarm) => void
  acknowledgeAlarmLocal: (id: string) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setSelectedAsset: (id: string | null) => void
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
}

// Generate initial seed points so charts look alive immediately on startup
const initSeedHistory = (baseVal: number, spread: number): HistoryPoint[] => {
  const points: HistoryPoint[] = []
  const now = Date.now()
  for (let i = 40; i >= 0; i--) {
    points.push({
      ts: new Date(now - i * 1500).toISOString(),
      value: +(baseVal + (Math.sin(i * 0.3) * spread * 0.7) + (Math.random() - 0.5) * spread * 0.3).toFixed(2),
    })
  }
  return points
}

// Read initial theme from localStorage or default to dark
const initialTheme: ThemeMode =
  typeof window !== 'undefined' && localStorage.getItem('twin_theme') === 'light'
    ? 'light'
    : 'dark'

// Ensure html element has correct class on load
if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const useTwinStore = create<TwinStore>((set) => ({
  conveyor: null,
  alarms: [],
  connectionStatus: 'OFFLINE',
  selectedAssetId: null,
  theme: initialTheme,
  liveHistory: {
    speed: initSeedHistory(3.2, 0.2),
    tension: initSeedHistory(142, 6),
    vibration: initSeedHistory(1.4, 0.4),
    temperature: initSeedHistory(58, 3),
    load: initSeedHistory(75, 4),
    selectedAssetVibration: initSeedHistory(1.5, 0.5),
  },
  setConveyor: (state) =>
    set((s) => {
      const ts = state.updatedAt ? new Date(state.updatedAt).toISOString() : new Date().toISOString()
      const maxPts = 50

      // Extract selected asset vibration
      let selVib = state.motor.vibration
      if (s.selectedAssetId) {
        const cleanId = s.selectedAssetId.replace('joint-', '')
        if (state.jointHealth && state.jointHealth[cleanId]) {
          selVib = state.jointHealth[cleanId].vibration
        }
      }

      const appendPt = (arr: HistoryPoint[], val: number) => {
        return [...arr.slice(-(maxPts - 1)), { ts, value: +val.toFixed(2) }]
      }

      return {
        conveyor: state,
        liveHistory: {
          speed: appendPt(s.liveHistory.speed, state.speed),
          tension: appendPt(s.liveHistory.tension, state.tension),
          vibration: appendPt(s.liveHistory.vibration, state.motor.vibration),
          temperature: appendPt(s.liveHistory.temperature, state.motor.temperature),
          load: appendPt(s.liveHistory.load, state.load),
          selectedAssetVibration: appendPt(s.liveHistory.selectedAssetVibration, selVib),
        },
      }
    }),
  addAlarm: (alarm) =>
    set((s) => ({
      alarms: [alarm, ...s.alarms].slice(0, 200),
    })),
  updateAlarm: (alarm) =>
    set((s) => ({
      alarms: s.alarms.map((a) => (a.id === alarm.id ? alarm : a)),
    })),
  acknowledgeAlarmLocal: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    })),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setSelectedAsset: (id) =>
    set((s) => {
      // Re-seed selectedAssetVibration when selecting a new asset
      let baseVib = 1.5
      if (id && s.conveyor) {
        const cleanId = id.replace('joint-', '')
        if (s.conveyor.jointHealth[cleanId]) {
          baseVib = s.conveyor.jointHealth[cleanId].vibration
        } else if (id === 'motor-M01') {
          baseVib = s.conveyor.motor.vibration
        }
      }
      return {
        selectedAssetId: id,
        liveHistory: {
          ...s.liveHistory,
          selectedAssetVibration: initSeedHistory(baseVib, 0.3),
        },
      }
    }),
  toggleTheme: () =>
    set((s) => {
      const nextTheme: ThemeMode = s.theme === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') {
        localStorage.setItem('twin_theme', nextTheme)
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      return { theme: nextTheme }
    }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('twin_theme', theme)
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    set({ theme })
  },
}))
