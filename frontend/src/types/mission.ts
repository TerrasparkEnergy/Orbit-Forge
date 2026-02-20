export type CubeSatSize = '1U' | '1.5U' | '2U' | '3U' | '6U' | '12U'

export interface CubeSatSizeSpec {
  label: string
  dimensions: string  // e.g. "10x10x10 cm"
  typicalMass: { min: number; max: number } // kg
  typicalPanelArea: number // m^2 body-mounted
}

export const CUBESAT_SIZES: Record<CubeSatSize, CubeSatSizeSpec> = {
  '1U': { label: '1U', dimensions: '10\u00D710\u00D710 cm', typicalMass: { min: 1, max: 1.33 }, typicalPanelArea: 0.03 },
  '1.5U': { label: '1.5U', dimensions: '10\u00D710\u00D715 cm', typicalMass: { min: 1.5, max: 2 }, typicalPanelArea: 0.04 },
  '2U': { label: '2U', dimensions: '10\u00D710\u00D720 cm', typicalMass: { min: 2, max: 2.66 }, typicalPanelArea: 0.05 },
  '3U': { label: '3U', dimensions: '10\u00D710\u00D730 cm', typicalMass: { min: 3, max: 4 }, typicalPanelArea: 0.07 },
  '6U': { label: '6U', dimensions: '20\u00D710\u00D730 cm', typicalMass: { min: 6, max: 12 }, typicalPanelArea: 0.12 },
  '12U': { label: '12U', dimensions: '20\u00D720\u00D730 cm', typicalMass: { min: 12, max: 24 }, typicalPanelArea: 0.18 },
}

export type SolarPanelConfig = 'body-mounted' | '1-axis-deployable' | '2-axis-deployable'
export type AntennaType = 'dipole' | 'patch' | 'helical' | 'parabolic'
export type FrequencyBand = 'UHF' | 'S-band' | 'X-band' | 'Ka-band'
export type MissionType = 'earth-observation' | 'communications' | 'technology-demo' | 'science' | 'iot-m2m'
export type PointingMode = 'tumbling' | 'nadir-pointing' | 'sun-pointing'

export const ANTENNA_GAINS: Record<AntennaType, number> = {
  dipole: 2.15,
  patch: 6,
  helical: 12,
  parabolic: 20,
}

export const SOLAR_EFFICIENCIES = [
  { label: 'Triple-junction GaAs', value: 0.28 },
  { label: 'Silicon', value: 0.22 },
  { label: 'Advanced GaAs', value: 0.30 },
]

export interface SpacecraftConfig {
  size: CubeSatSize
  mass: number               // kg
  solarPanelConfig: SolarPanelConfig
  solarPanelArea: number     // m^2
  solarCellEfficiency: number // 0-1
  pointingMode: PointingMode  // affects solar power incidence angle
  batteryCapacity: number    // Wh
  powerIdle: number          // W
  powerPeak: number          // W
  powerAverage: number       // W
  antennaType: AntennaType
  antennaGain: number        // dBi
  transmitPower: number      // W
  dataRate: number           // kbps
  frequencyBand: FrequencyBand
}

export interface MissionConfig {
  name: string
  epoch: Date
  missionType: MissionType
  lifetimeTarget: number     // years
  spacecraft: SpacecraftConfig
}

export const DEFAULT_SPACECRAFT: SpacecraftConfig = {
  size: '3U',
  mass: 4,
  solarPanelConfig: 'body-mounted',
  solarPanelArea: 0.07,
  solarCellEfficiency: 0.28,
  pointingMode: 'nadir-pointing',
  batteryCapacity: 40,
  powerIdle: 0.5,
  powerPeak: 5,
  powerAverage: 2,
  antennaType: 'dipole',
  antennaGain: 2.15,
  transmitPower: 1,
  dataRate: 9.6,
  frequencyBand: 'UHF',
}

export const DEFAULT_MISSION: MissionConfig = {
  name: 'Untitled Mission',
  epoch: new Date(),
  missionType: 'earth-observation',
  lifetimeTarget: 2,
  spacecraft: DEFAULT_SPACECRAFT,
}
