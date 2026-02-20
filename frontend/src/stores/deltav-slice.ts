import { StateCreator } from 'zustand'
import { DEFAULT_PROPULSION, DEFAULT_MANEUVERS } from '@/types/propulsion'
import type { PropulsionConfig, DeltaVManeuver } from '@/types/propulsion'

export interface DeltaVSlice {
  propulsion: PropulsionConfig
  maneuvers: DeltaVManeuver[]
  updatePropulsion: (partial: Partial<PropulsionConfig>) => void
  setPropulsion: (config: PropulsionConfig) => void
  setManeuvers: (m: DeltaVManeuver[]) => void
  updateManeuver: (id: string, partial: Partial<DeltaVManeuver>) => void
  addManeuver: (m: DeltaVManeuver) => void
  removeManeuver: (id: string) => void
  resetDeltaV: () => void
}

export const createDeltaVSlice: StateCreator<DeltaVSlice, [], [], DeltaVSlice> = (set) => ({
  propulsion: { ...DEFAULT_PROPULSION },
  maneuvers: DEFAULT_MANEUVERS.map((m) => ({ ...m })),

  updatePropulsion: (partial) =>
    set((s) => ({ propulsion: { ...s.propulsion, ...partial } })),

  setPropulsion: (config) => set({ propulsion: config }),

  setManeuvers: (m) => set({ maneuvers: m }),

  updateManeuver: (id, partial) =>
    set((s) => ({
      maneuvers: s.maneuvers.map((m) => (m.id === id ? { ...m, ...partial } : m)),
    })),

  addManeuver: (m) =>
    set((s) => ({ maneuvers: [...s.maneuvers, m] })),

  removeManeuver: (id) =>
    set((s) => ({ maneuvers: s.maneuvers.filter((m) => m.id !== id) })),

  resetDeltaV: () =>
    set({
      propulsion: { ...DEFAULT_PROPULSION },
      maneuvers: DEFAULT_MANEUVERS.map((m) => ({ ...m })),
    }),
})
