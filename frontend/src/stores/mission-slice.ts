import { StateCreator } from 'zustand'
import { MissionConfig, SpacecraftConfig, DEFAULT_MISSION } from '@/types/mission'

export interface MissionSlice {
  mission: MissionConfig
  updateMission: (partial: Partial<MissionConfig>) => void
  updateSpacecraft: (partial: Partial<SpacecraftConfig>) => void
  resetMission: () => void
}

export const createMissionSlice: StateCreator<MissionSlice, [], [], MissionSlice> = (set) => ({
  mission: { ...DEFAULT_MISSION, epoch: new Date() },
  updateMission: (partial) =>
    set((s) => ({ mission: { ...s.mission, ...partial } })),
  updateSpacecraft: (partial) =>
    set((s) => ({
      mission: {
        ...s.mission,
        spacecraft: { ...s.mission.spacecraft, ...partial },
      },
    })),
  resetMission: () => set({ mission: { ...DEFAULT_MISSION, epoch: new Date() } }),
})
