import { create } from 'zustand'
import type { TwinMode } from '../types/twin'

interface ControlStore {
  mode: TwinMode;
  speedInput: number;
  isManual: boolean;
  setMode: (mode: TwinMode) => void;
  setSpeedInput: (speed: number) => void;
  setManual: (manual: boolean) => void;
}

export const useControlStore = create<ControlStore>((set) => ({
  mode: 'SIMULATION',
  speedInput: 3.2,
  isManual: false,
  setMode: (mode) => set({ mode }),
  setSpeedInput: (speedInput) => set({ speedInput }),
  setManual: (isManual) => set({ isManual }),
}))
