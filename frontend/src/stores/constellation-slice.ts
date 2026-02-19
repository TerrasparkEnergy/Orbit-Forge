import { StateCreator } from 'zustand'
import { DEFAULT_WALKER, type WalkerParams, type WalkerType } from '@/lib/constellation'

export interface ConstellationSlice {
  walkerParams: WalkerParams
  updateWalkerParams: (partial: Partial<WalkerParams>) => void
  setWalkerParams: (params: WalkerParams) => void
  resetWalkerParams: () => void
}

export const createConstellationSlice: StateCreator<ConstellationSlice, [], [], ConstellationSlice> = (set) => ({
  walkerParams: { ...DEFAULT_WALKER },

  updateWalkerParams: (partial) =>
    set((s) => ({ walkerParams: { ...s.walkerParams, ...partial } })),

  setWalkerParams: (params) => set({ walkerParams: params }),

  resetWalkerParams: () => set({ walkerParams: { ...DEFAULT_WALKER } }),
})
