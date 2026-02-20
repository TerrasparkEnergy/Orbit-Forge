export type PropulsionType = 'none' | 'cold-gas' | 'resistojet' | 'ion' | 'hall-thruster'

export interface PropulsionConfig {
  type: PropulsionType
  specificImpulse: number  // seconds
  propellantMass: number   // kg
}

export interface DeltaVManeuver {
  id: string
  name: string
  deltaV: number       // m/s
  perYear: boolean      // if true, multiply by mission lifetime
}

export const PROPULSION_PRESETS: Record<PropulsionType, { isp: number; label: string }> = {
  'none': { isp: 0, label: 'No Propulsion' },
  'cold-gas': { isp: 70, label: 'Cold Gas' },
  'resistojet': { isp: 150, label: 'Resistojet' },
  'ion': { isp: 3000, label: 'Ion Thruster' },
  'hall-thruster': { isp: 1500, label: 'Hall Thruster' },
}

export const DEFAULT_PROPULSION: PropulsionConfig = {
  type: 'none',
  specificImpulse: 0,
  propellantMass: 0,
}

export const DEFAULT_MANEUVERS: DeltaVManeuver[] = [
  { id: 'insertion', name: 'Orbit Insertion Correction', deltaV: 5, perYear: false },
  { id: 'stationkeeping', name: 'Station Keeping', deltaV: 2, perYear: true },
  { id: 'collision', name: 'Collision Avoidance', deltaV: 1, perYear: true },
  { id: 'deorbit', name: 'Deorbit', deltaV: 0, perYear: false },
]
