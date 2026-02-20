import { SOLAR_FLUX } from './constants'
import { computeOrbitalPeriod, computeEclipseFraction } from './orbital-mechanics'
import type { SpacecraftConfig } from '@/types/mission'
import type { OrbitalElements } from '@/types/orbit'

/**
 * A single subsystem entry in the power budget table
 */
export interface PowerSubsystem {
  id: string
  name: string
  mode: string
  powerW: number       // Watts when active
  dutyCycle: number    // 0-1 fraction
  isEclipseOnly: boolean
}

export const DEFAULT_SUBSYSTEMS: PowerSubsystem[] = [
  { id: 'obc', name: 'OBC', mode: 'Continuous', powerW: 0.5, dutyCycle: 1.0, isEclipseOnly: false },
  { id: 'radio-tx', name: 'Radio TX', mode: 'Transmit', powerW: 2.0, dutyCycle: 0.15, isEclipseOnly: false },
  { id: 'camera', name: 'Camera', mode: 'Imaging', powerW: 3.0, dutyCycle: 0.10, isEclipseOnly: false },
  { id: 'adcs', name: 'ADCS', mode: 'Active', powerW: 1.0, dutyCycle: 1.0, isEclipseOnly: false },
  { id: 'heater', name: 'Heater', mode: 'Eclipse', powerW: 1.5, dutyCycle: 0.40, isEclipseOnly: true },
]

/**
 * Compute average power draw of a subsystem
 * dutyCycle is stored as 0-1 fraction; clamp for safety
 */
export function subsystemAvgPower(sub: PowerSubsystem): number {
  const clampedDuty = Math.max(0, Math.min(1, sub.dutyCycle))
  return sub.powerW * clampedDuty
}

/**
 * Compute total average power draw from all subsystems
 */
export function totalAvgPowerDraw(subsystems: PowerSubsystem[]): number {
  return subsystems.reduce((sum, s) => sum + subsystemAvgPower(s), 0)
}

/**
 * Compute solar panel power generation in sunlight
 * Returns peak power in Watts
 */
export function computeSolarPowerPeak(spacecraft: SpacecraftConfig): number {
  // P = solar_flux * panel_area * efficiency * cos(average_incidence)
  // Incidence factor depends on both panel config and pointing mode:
  // - Body-mounted tumbling: only ~25% effective (random orientation)
  // - Body-mounted nadir: ~30% (one long face illuminated at varying angles)
  // - Body-mounted sun-pointing: ~50% (best face toward sun)
  // - Deployable panels are less affected by pointing mode
  const incidenceFactors: Record<string, Record<string, number>> = {
    'body-mounted':       { 'tumbling': 0.25, 'nadir-pointing': 0.30, 'sun-pointing': 0.50 },
    '1-axis-deployable':  { 'tumbling': 0.40, 'nadir-pointing': 0.55, 'sun-pointing': 0.70 },
    '2-axis-deployable':  { 'tumbling': 0.50, 'nadir-pointing': 0.70, 'sun-pointing': 0.90 },
  }
  const pointingMode = spacecraft.pointingMode || 'nadir-pointing'
  const configFactors = incidenceFactors[spacecraft.solarPanelConfig] || incidenceFactors['body-mounted']
  const factor = configFactors[pointingMode] || 0.30
  return SOLAR_FLUX * spacecraft.solarPanelArea * spacecraft.solarCellEfficiency * factor
}

/**
 * Compute average power generation over one orbit (accounting for eclipse)
 */
export function computeAvgPowerGeneration(
  spacecraft: SpacecraftConfig,
  eclipseFraction: number,
  degradationYears = 0,
  degradationRate = 0.03, // 3% per year
): number {
  const peakPower = computeSolarPowerPeak(spacecraft)
  const sunlightFraction = 1 - eclipseFraction
  const degradation = Math.pow(1 - degradationRate, degradationYears)
  return peakPower * sunlightFraction * degradation
}

/**
 * Compute power margin
 * Returns fraction (e.g. 0.25 = 25% margin)
 */
export function computePowerMargin(
  avgGeneration: number,
  avgConsumption: number,
): number {
  if (avgConsumption === 0) return 1
  return (avgGeneration - avgConsumption) / avgConsumption
}

/**
 * Get status color for power margin
 */
export function powerMarginStatus(margin: number): 'nominal' | 'warning' | 'critical' {
  if (margin >= 0.20) return 'nominal'
  if (margin >= 0.05) return 'warning'
  return 'critical'
}

/**
 * Battery depth of discharge per orbit
 * Returns DoD as fraction (0-1)
 */
export function computeBatteryDoD(
  avgConsumption: number,
  eclipseDurationSec: number,
  batteryCapacityWh: number,
): number {
  if (batteryCapacityWh === 0) return 1
  const eclipseHours = eclipseDurationSec / 3600
  const energyConsumedWh = avgConsumption * eclipseHours
  return Math.min(1, energyConsumedWh / batteryCapacityWh)
}

/**
 * Compute power generation profile over one orbit
 * Returns arrays for a timeline chart
 */
export interface OrbitPowerProfile {
  timeMinutes: number[]
  powerGeneration: number[]
  powerConsumption: number[]
  batteryCharge: number[]  // Wh remaining
  inSunlight: boolean[]
}

export function computeOrbitPowerProfile(
  elements: OrbitalElements,
  spacecraft: SpacecraftConfig,
  subsystems: PowerSubsystem[],
  numPoints = 120,
): OrbitPowerProfile {
  const periodSec = computeOrbitalPeriod(elements.semiMajorAxis)
  const avgAlt = elements.semiMajorAxis - 6378.137
  const eclipseFrac = computeEclipseFraction(avgAlt)

  const peakSolarPower = computeSolarPowerPeak(spacecraft)

  // Simple eclipse model: eclipse is centered on one side of orbit
  // Eclipse starts at (0.5 - eclipseFrac/2)*period, ends at (0.5 + eclipseFrac/2)*period
  const eclipseStart = (0.5 - eclipseFrac / 2) * periodSec
  const eclipseEnd = (0.5 + eclipseFrac / 2) * periodSec

  // Sunlight: all non-eclipse-only subsystems
  const sunlightConsumption = subsystems
    .filter((s) => !s.isEclipseOnly)
    .reduce((sum, s) => sum + subsystemAvgPower(s), 0)

  // Eclipse: non-eclipse-only + eclipse-only subsystems
  const eclipseConsumption = subsystems
    .reduce((sum, s) => sum + subsystemAvgPower(s), 0)

  const timeMinutes: number[] = []
  const powerGeneration: number[] = []
  const powerConsumption: number[] = []
  const batteryCharge: number[] = []
  const inSunlight: boolean[] = []

  let batteryWh = spacecraft.batteryCapacity

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * periodSec
    const tMin = t / 60
    const isSun = t < eclipseStart || t > eclipseEnd

    timeMinutes.push(tMin)
    inSunlight.push(isSun)

    const gen = isSun ? peakSolarPower : 0
    const consumption = isSun ? sunlightConsumption : eclipseConsumption

    powerGeneration.push(gen)
    powerConsumption.push(consumption)

    // Battery charge/discharge
    const dt = periodSec / numPoints / 3600 // hours
    const netPower = gen - consumption
    batteryWh = Math.max(0, Math.min(spacecraft.batteryCapacity, batteryWh + netPower * dt))
    batteryCharge.push(batteryWh)
  }

  return { timeMinutes, powerGeneration, powerConsumption, batteryCharge, inSunlight }
}

/**
 * Compute full power analysis summary
 */
export interface PowerAnalysis {
  peakSolarPower: number
  avgPowerGeneration: number
  avgPowerConsumption: number
  powerMargin: number
  marginStatus: 'nominal' | 'warning' | 'critical'
  batteryDoD: number
  dodStatus: 'nominal' | 'warning' | 'critical'
  eclipseFraction: number
  eclipseDurationMin: number
  sunlightDurationMin: number
  periodMin: number
  eolPowerGeneration: number
  eolMargin: number
  eolMarginStatus: 'nominal' | 'warning' | 'critical'
}

export function computePowerAnalysis(
  elements: OrbitalElements,
  spacecraft: SpacecraftConfig,
  subsystems: PowerSubsystem[],
  lifetimeYears: number,
): PowerAnalysis {
  const periodSec = computeOrbitalPeriod(elements.semiMajorAxis)
  const avgAlt = elements.semiMajorAxis - 6378.137
  const eclipseFraction = computeEclipseFraction(avgAlt)
  const eclipseDurationSec = eclipseFraction * periodSec
  const sunlightDurationSec = (1 - eclipseFraction) * periodSec

  const peakSolarPower = computeSolarPowerPeak(spacecraft)
  const avgPowerGeneration = computeAvgPowerGeneration(spacecraft, eclipseFraction)
  const avgPowerConsumption = totalAvgPowerDraw(subsystems)
  const powerMargin = computePowerMargin(avgPowerGeneration, avgPowerConsumption)
  const marginStatus = powerMarginStatus(powerMargin)

  const batteryDoD = computeBatteryDoD(avgPowerConsumption, eclipseDurationSec, spacecraft.batteryCapacity)
  const dodStatus: 'nominal' | 'warning' | 'critical' =
    batteryDoD <= 0.2 ? 'nominal' : batteryDoD <= 0.4 ? 'warning' : 'critical'

  // End of life analysis
  const eolPowerGeneration = computeAvgPowerGeneration(spacecraft, eclipseFraction, lifetimeYears)
  const eolMargin = computePowerMargin(eolPowerGeneration, avgPowerConsumption)
  const eolMarginStatus = powerMarginStatus(eolMargin)

  return {
    peakSolarPower,
    avgPowerGeneration,
    avgPowerConsumption,
    powerMargin,
    marginStatus,
    batteryDoD,
    dodStatus,
    eclipseFraction,
    eclipseDurationMin: eclipseDurationSec / 60,
    sunlightDurationMin: sunlightDurationSec / 60,
    periodMin: periodSec / 60,
    eolPowerGeneration,
    eolMargin,
    eolMarginStatus,
  }
}
