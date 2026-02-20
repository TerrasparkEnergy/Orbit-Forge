import { StateCreator } from 'zustand'

export interface RadiationSlice {
  shieldingThicknessMm: number
  setShieldingThickness: (mm: number) => void
}

export const createRadiationSlice: StateCreator<RadiationSlice, [], [], RadiationSlice> = (set) => ({
  shieldingThicknessMm: 1,
  setShieldingThickness: (mm) => set({ shieldingThicknessMm: Math.max(0, Math.min(20, mm)) }),
})
