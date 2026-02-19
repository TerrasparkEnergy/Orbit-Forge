import { StateCreator } from 'zustand'
import { ModuleId } from '@/types'

export interface UISlice {
  activeModule: ModuleId
  bottomPanelExpanded: boolean
  setActiveModule: (id: ModuleId) => void
  toggleBottomPanel: () => void
  setBottomPanelExpanded: (expanded: boolean) => void
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  activeModule: ModuleId.OrbitDesign,
  bottomPanelExpanded: true,
  setActiveModule: (id) => set({ activeModule: id }),
  toggleBottomPanel: () => set((s) => ({ bottomPanelExpanded: !s.bottomPanelExpanded })),
  setBottomPanelExpanded: (expanded) => set({ bottomPanelExpanded: expanded }),
})
