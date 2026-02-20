import { R_EARTH_EQUATORIAL, MU_EARTH_KM } from './constants'
import type { PropulsionConfig, DeltaVManeuver } from '@/types/propulsion'

const G0 = 9.80665 // m/s^2, standard gravity

// ─── Core Equations ───

/**
 * Tsiolkovsky rocket equation: ΔV = Isp × g0 × ln(m0 / mf)
 * @param isp - Specific impulse in seconds
 * @param dryMass - Dry mass in kg
 * @param propMass - Propellant mass in kg
 * @returns Available delta-v in m/s
 */
export function tsiolkovskyDeltaV(isp: number, dryMass: number, propMass: number): number {
  if (isp <= 0 || dryMass <= 0 || propMass <= 0) return 0
  const m0 = dryMass + propMass
  const mf = dryMass
  return isp * G0 * Math.log(m0 / mf)
}

/**
 * Propellant mass required for a given delta-v maneuver
 * From Tsiolkovsky: mp = m_dry * (exp(ΔV / (Isp × g0)) - 1)
 */
export function propellantForDeltaV(isp: number, dryMass: number, deltaV: number): number {
  if (isp <= 0 || dryMass <= 0 || deltaV <= 0) return 0
  return dryMass * (Math.exp(deltaV / (isp * G0)) - 1)
}

/**
 * Hohmann transfer delta-v for deorbit from current altitude to ~200km decay orbit
 */
export function computeDeorbitDeltaV(altitudeKm: number): number {
  if (altitudeKm <= 200) return 0
  const r1 = R_EARTH_EQUATORIAL + altitudeKm  // current orbit radius (km)
  const r2 = R_EARTH_EQUATORIAL + 200          // target perigee (km)
  // ΔV for Hohmann transfer (first burn only — lower perigee into atmosphere)
  const v1 = Math.sqrt(MU_EARTH_KM / r1) // current circular velocity (km/s)
  const vTransfer = Math.sqrt(MU_EARTH_KM * (2 / r1 - 2 / (r1 + r2))) // transfer orbit velocity at r1
  return Math.abs(v1 - vTransfer) * 1000 // convert km/s to m/s
}

/**
 * Annual delta-v to counteract atmospheric drag (station keeping)
 * Based on drag deceleration integrated over one year
 */
export function computeDragDeltaV(altitudeKm: number, ballisticCoeffM2Kg: number, solarActivity: 'low' | 'moderate' | 'high' = 'moderate'): number {
  // Atmospheric density (simplified exponential model)
  const scaleHeights: [number, number, number][] = [
    [200, 2.789e-10, 37.5], [300, 7.248e-11, 53.6], [400, 2.803e-11, 58.5],
    [500, 1.184e-11, 60.8], [600, 5.215e-12, 63.8], [700, 2.390e-12, 65.2],
    [800, 1.170e-12, 68.9], [900, 5.790e-13, 72.0], [1000, 3.000e-13, 76.0],
  ]

  const solarFactors = { low: 0.5, moderate: 1.0, high: 2.5 }
  const solarFactor = solarFactors[solarActivity]

  // Find nearest density
  let rho = 1e-12 // default
  let found = false
  for (let i = 0; i < scaleHeights.length - 1; i++) {
    if (altitudeKm >= scaleHeights[i][0] && altitudeKm < scaleHeights[i + 1][0]) {
      const [h0, rho0, H] = scaleHeights[i]
      rho = rho0 * Math.exp(-(altitudeKm - h0) / H) * solarFactor
      found = true
      break
    }
  }
  if (!found && altitudeKm < 200) {
    rho = 2.789e-10 * solarFactor
  }

  // Orbital velocity (m/s)
  const r = (R_EARTH_EQUATORIAL + altitudeKm) * 1000
  const v = Math.sqrt(MU_EARTH_KM * 1e9 / r) // m/s

  // Drag deceleration: a_drag = 0.5 * rho * v^2 * B* (kg/m^2 → need area/mass)
  // B* = Cd * A / (2 * m), so drag_accel = rho * v^2 * B*
  const dragAccel = rho * v * v * ballisticCoeffM2Kg // m/s^2

  // Integrate over one year (seconds)
  const secondsPerYear = 365.25 * 86400
  return dragAccel * secondsPerYear
}

// ─── Budget Computation ───

export interface DeltaVBudgetResult {
  availableDeltaV: number         // m/s (from Tsiolkovsky)
  deorbitDeltaV: number           // m/s (Hohmann to 200km)
  dragDeltaVPerYear: number       // m/s/yr
  maneuverBreakdown: Array<{
    id: string
    name: string
    deltaV: number          // total m/s (including lifetime multiplication)
    propellantKg: number    // propellant consumed
  }>
  totalRequiredDeltaV: number     // m/s
  marginDeltaV: number            // m/s (available - required)
  marginPercent: number           // fraction
  marginStatus: 'nominal' | 'warning' | 'critical'
  propellantRemainingKg: number
  massRatio: number               // wet/dry
}

export function computeDeltaVBudget(
  propulsion: PropulsionConfig,
  maneuvers: DeltaVManeuver[],
  dryMass: number,
  altitudeKm: number,
  lifetimeYears: number,
  ballisticCoeffM2Kg: number = 0.01,
): DeltaVBudgetResult {
  const availableDeltaV = tsiolkovskyDeltaV(propulsion.specificImpulse, dryMass, propulsion.propellantMass)
  const deorbitDV = computeDeorbitDeltaV(altitudeKm)
  const dragDV = computeDragDeltaV(altitudeKm, ballisticCoeffM2Kg)

  const wetMass = dryMass + propulsion.propellantMass
  const massRatio = propulsion.propellantMass > 0 ? wetMass / dryMass : 1

  // Build maneuver breakdown
  let remainingProp = propulsion.propellantMass
  let currentDryMass = dryMass
  const breakdown: DeltaVBudgetResult['maneuverBreakdown'] = []

  for (const m of maneuvers) {
    let dv = m.deltaV
    if (m.id === 'deorbit') dv = deorbitDV
    if (m.perYear) dv *= lifetimeYears

    const propNeeded = propellantForDeltaV(propulsion.specificImpulse, currentDryMass, dv)
    const propUsed = Math.min(propNeeded, remainingProp)
    remainingProp = Math.max(0, remainingProp - propUsed)

    breakdown.push({ id: m.id, name: m.name, deltaV: dv, propellantKg: propNeeded })
  }

  // Add 10% margin
  const subtotal = breakdown.reduce((sum, b) => sum + b.deltaV, 0)
  const marginAlloc = subtotal * 0.10
  breakdown.push({ id: 'margin', name: 'Margin (10%)', deltaV: marginAlloc, propellantKg: propellantForDeltaV(propulsion.specificImpulse, dryMass, marginAlloc) })

  const totalRequired = subtotal + marginAlloc
  const marginDV = availableDeltaV - totalRequired
  const marginPercent = availableDeltaV > 0 ? marginDV / availableDeltaV : -1

  // Compute remaining propellant after all maneuvers
  const totalPropNeeded = propellantForDeltaV(propulsion.specificImpulse, dryMass, totalRequired)
  const propRemaining = Math.max(0, propulsion.propellantMass - totalPropNeeded)

  const marginStatus: 'nominal' | 'warning' | 'critical' =
    marginPercent > 0.10 ? 'nominal' :
    marginPercent > 0 ? 'warning' : 'critical'

  return {
    availableDeltaV,
    deorbitDeltaV: deorbitDV,
    dragDeltaVPerYear: dragDV,
    maneuverBreakdown: breakdown,
    totalRequiredDeltaV: totalRequired,
    marginDeltaV: marginDV,
    marginPercent,
    marginStatus,
    propellantRemainingKg: propRemaining,
    massRatio,
  }
}
