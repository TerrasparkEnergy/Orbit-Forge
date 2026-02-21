import { StateCreator } from 'zustand'
import type {
  PayloadType,
  SharedPayloadConfig,
  EOConfig,
  SARConfig,
  SATCOMConfig,
} from '@/types/payload'
import {
  DEFAULT_SHARED,
  DEFAULT_EO,
  DEFAULT_SAR,
  DEFAULT_SATCOM,
} from '@/types/payload'

export interface PayloadSlice {
  payloadType: PayloadType
  payloadShared: SharedPayloadConfig
  payloadEO: EOConfig
  payloadSAR: SARConfig
  payloadSATCOM: SATCOMConfig
  setPayloadType: (t: PayloadType) => void
  updatePayloadShared: (partial: Partial<SharedPayloadConfig>) => void
  updatePayloadEO: (partial: Partial<EOConfig>) => void
  updatePayloadSAR: (partial: Partial<SARConfig>) => void
  updatePayloadSATCOM: (partial: Partial<SATCOMConfig>) => void
  resetPayload: () => void
}

export const createPayloadSlice: StateCreator<PayloadSlice, [], [], PayloadSlice> = (set) => ({
  payloadType: 'earth-observation',
  payloadShared: { ...DEFAULT_SHARED },
  payloadEO: { ...DEFAULT_EO },
  payloadSAR: { ...DEFAULT_SAR },
  payloadSATCOM: { ...DEFAULT_SATCOM },

  setPayloadType: (t) => set({ payloadType: t }),

  updatePayloadShared: (partial) =>
    set((s) => ({ payloadShared: { ...s.payloadShared, ...partial } })),

  updatePayloadEO: (partial) =>
    set((s) => ({ payloadEO: { ...s.payloadEO, ...partial } })),

  updatePayloadSAR: (partial) =>
    set((s) => ({ payloadSAR: { ...s.payloadSAR, ...partial } })),

  updatePayloadSATCOM: (partial) =>
    set((s) => ({ payloadSATCOM: { ...s.payloadSATCOM, ...partial } })),

  resetPayload: () =>
    set({
      payloadType: 'earth-observation',
      payloadShared: { ...DEFAULT_SHARED },
      payloadEO: { ...DEFAULT_EO },
      payloadSAR: { ...DEFAULT_SAR },
      payloadSATCOM: { ...DEFAULT_SATCOM },
    }),
})
