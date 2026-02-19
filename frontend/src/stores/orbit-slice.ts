import { StateCreator } from 'zustand'
import type { Vec3 } from '@/types'
import { OrbitalElements, ORBIT_PRESETS } from '@/types/orbit'
import { propagateOrbitPositions, computeDerivedParams } from '@/lib/orbital-mechanics'
import type { DerivedOrbitalParams } from '@/lib/orbital-mechanics'

export interface OrbitSlice {
  elements: OrbitalElements
  derivedParams: DerivedOrbitalParams | null
  orbitPositions: Vec3[]
  updateElements: (partial: Partial<OrbitalElements>) => void
  setFromPreset: (presetKey: string) => void
  recompute: () => void
}

const DEFAULT_ELEMENTS = ORBIT_PRESETS.iss.elements

function computeAll(elements: OrbitalElements) {
  const orbitPositions = propagateOrbitPositions(elements, 180)
  const derivedParams = computeDerivedParams(elements)
  return { orbitPositions, derivedParams }
}

export const createOrbitSlice: StateCreator<OrbitSlice, [], [], OrbitSlice> = (set, get) => {
  const initial = computeAll(DEFAULT_ELEMENTS)

  return {
    elements: DEFAULT_ELEMENTS,
    derivedParams: initial.derivedParams,
    orbitPositions: initial.orbitPositions,

    updateElements: (partial) => {
      const elements = { ...get().elements, ...partial }
      const computed = computeAll(elements)
      set({
        elements,
        ...computed,
      })
    },

    setFromPreset: (presetKey) => {
      const preset = ORBIT_PRESETS[presetKey]
      if (!preset) return
      const elements = { ...preset.elements }
      const computed = computeAll(elements)
      set({
        elements,
        ...computed,
      })
    },

    recompute: () => {
      const elements = get().elements
      const computed = computeAll(elements)
      set(computed)
    },
  }
}
