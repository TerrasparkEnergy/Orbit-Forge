import { StateCreator } from 'zustand'
import type {
  BeyondLeoMode,
  BeyondLeoState,
  LagrangeParams,
  LunarParams,
  InterplanetaryParams,
} from '@/types/beyond-leo'
import {
  DEFAULT_BEYOND_LEO_STATE,
} from '@/types/beyond-leo'

export interface BeyondLeoSlice {
  beyondLeo: BeyondLeoState
  setBeyondLeoMode: (mode: BeyondLeoMode) => void
  updateLagrangeParams: (partial: Partial<LagrangeParams>) => void
  updateLunarParams: (partial: Partial<LunarParams>) => void
  updateInterplanetaryParams: (partial: Partial<InterplanetaryParams>) => void
  resetBeyondLeo: () => void
}

export const createBeyondLeoSlice: StateCreator<BeyondLeoSlice, [], [], BeyondLeoSlice> = (set) => ({
  beyondLeo: { ...DEFAULT_BEYOND_LEO_STATE },

  setBeyondLeoMode: (mode) =>
    set((s) => ({ beyondLeo: { ...s.beyondLeo, mode } })),

  updateLagrangeParams: (partial) =>
    set((s) => ({
      beyondLeo: {
        ...s.beyondLeo,
        lagrangeParams: { ...s.beyondLeo.lagrangeParams, ...partial },
      },
    })),

  updateLunarParams: (partial) =>
    set((s) => ({
      beyondLeo: {
        ...s.beyondLeo,
        lunarParams: { ...s.beyondLeo.lunarParams, ...partial },
      },
    })),

  updateInterplanetaryParams: (partial) =>
    set((s) => ({
      beyondLeo: {
        ...s.beyondLeo,
        interplanetaryParams: { ...s.beyondLeo.interplanetaryParams, ...partial },
      },
    })),

  resetBeyondLeo: () =>
    set({ beyondLeo: { ...DEFAULT_BEYOND_LEO_STATE } }),
})
