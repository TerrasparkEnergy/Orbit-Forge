export enum ModuleId {
  MissionConfig = 'mission-config',
  OrbitDesign = 'orbit-design',
  PowerBudget = 'power-budget',
  GroundPasses = 'ground-passes',
  OrbitalLifetime = 'orbital-lifetime',
  Constellation = 'constellation',
}

export const MODULE_LABELS: Record<ModuleId, string> = {
  [ModuleId.MissionConfig]: 'Mission',
  [ModuleId.OrbitDesign]: 'Orbit',
  [ModuleId.PowerBudget]: 'Power',
  [ModuleId.GroundPasses]: 'Passes',
  [ModuleId.OrbitalLifetime]: 'Lifetime',
  [ModuleId.Constellation]: 'Constellation',
}

export const MODULE_NUMBERS: Record<ModuleId, number> = {
  [ModuleId.MissionConfig]: 1,
  [ModuleId.OrbitDesign]: 2,
  [ModuleId.PowerBudget]: 3,
  [ModuleId.GroundPasses]: 4,
  [ModuleId.OrbitalLifetime]: 5,
  [ModuleId.Constellation]: 6,
}

export interface Vec3 {
  x: number
  y: number
  z: number
}
