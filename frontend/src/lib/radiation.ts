/**
 * Radiation environment estimation
 * Simplified AP-8/AE-8 trapped particle model for CubeSat mission planning
 */

// ─── Altitude-dependent dose rate lookup table ───
// Approximate unshielded annual TID (krad/yr) at various altitudes
// Based on AP-8 MIN model for circular orbits, equatorial reference
// These are order-of-magnitude estimates suitable for early mission planning

interface DoseRateEntry {
  altKm: number
  doseKradPerYear: number  // unshielded, equatorial
}

const DOSE_RATE_TABLE: DoseRateEntry[] = [
  { altKm: 200,   doseKradPerYear: 0.1 },
  { altKm: 300,   doseKradPerYear: 0.3 },
  { altKm: 400,   doseKradPerYear: 0.8 },
  { altKm: 500,   doseKradPerYear: 1.5 },
  { altKm: 600,   doseKradPerYear: 3.0 },
  { altKm: 700,   doseKradPerYear: 5.0 },
  { altKm: 800,   doseKradPerYear: 8.0 },
  { altKm: 1000,  doseKradPerYear: 15.0 },
  { altKm: 1200,  doseKradPerYear: 30.0 },
  { altKm: 1500,  doseKradPerYear: 80.0 },
  { altKm: 2000,  doseKradPerYear: 200.0 },
  { altKm: 3000,  doseKradPerYear: 500.0 },
  { altKm: 4000,  doseKradPerYear: 300.0 },   // Past inner belt peak
  { altKm: 6000,  doseKradPerYear: 100.0 },   // Slot region
  { altKm: 10000, doseKradPerYear: 30.0 },
  { altKm: 15000, doseKradPerYear: 15.0 },
  { altKm: 20000, doseKradPerYear: 8.0 },     // Outer belt
  { altKm: 25000, doseKradPerYear: 4.0 },
  { altKm: 30000, doseKradPerYear: 2.0 },
  { altKm: 36000, doseKradPerYear: 1.0 },     // GEO
]

/**
 * Interpolate unshielded dose rate from altitude lookup table (log-linear)
 */
function interpolateDoseRate(altKm: number): number {
  if (altKm <= DOSE_RATE_TABLE[0].altKm) return DOSE_RATE_TABLE[0].doseKradPerYear
  if (altKm >= DOSE_RATE_TABLE[DOSE_RATE_TABLE.length - 1].altKm) {
    return DOSE_RATE_TABLE[DOSE_RATE_TABLE.length - 1].doseKradPerYear
  }

  for (let i = 0; i < DOSE_RATE_TABLE.length - 1; i++) {
    const low = DOSE_RATE_TABLE[i]
    const high = DOSE_RATE_TABLE[i + 1]
    if (altKm >= low.altKm && altKm <= high.altKm) {
      // Log-linear interpolation
      const t = (altKm - low.altKm) / (high.altKm - low.altKm)
      const logLow = Math.log(low.doseKradPerYear)
      const logHigh = Math.log(high.doseKradPerYear)
      return Math.exp(logLow + t * (logHigh - logLow))
    }
  }
  return 1.0
}

// ─── Inclination correction ───

/**
 * Inclination correction factor for radiation dose
 * SAA (South Atlantic Anomaly) exposure is highest for 30-60° inclination orbits
 * Polar and equatorial orbits see somewhat less trapped radiation
 */
export function inclinationFactor(incDeg: number): number {
  const inc = Math.abs(incDeg)
  if (inc <= 10) return 0.7          // Equatorial: less SAA exposure
  if (inc <= 30) return 0.9          // Low inclination
  if (inc <= 60) return 1.3          // SAA corridor (ISS-like ~51.6°)
  if (inc <= 80) return 1.1          // High inclination
  return 1.0                          // Polar (SSO ~97°)
}

// ─── Shielding attenuation ───

/**
 * Shielding attenuation factor for aluminum
 * Approximate exponential attenuation: dose = dose_0 * exp(-t / lambda)
 * Lambda varies with particle type; ~2.5mm for protons, ~1.5mm for electrons
 * Using effective lambda ~2.0mm for combined environment
 */
export function computeShieldingFactor(thicknessMmAl: number): number {
  const lambda = 2.0 // mm, effective attenuation length
  return Math.exp(-thicknessMmAl / lambda)
}

// ─── Main computation functions ───

export interface RadiationResult {
  unshieldedDoseKradPerYear: number
  shieldedDoseKradPerYear: number
  missionTotalDoseKrad: number
  shieldingFactor: number
  inclinationFactor: number
  saaExposure: 'low' | 'moderate' | 'high'
  componentRecommendation: string
  componentStatus: 'nominal' | 'warning' | 'critical'
  beltRegion: string
}

/**
 * Compute annual radiation dose with shielding
 */
export function computeAnnualDose(altKm: number, incDeg: number, shieldingMmAl: number): number {
  const baseDose = interpolateDoseRate(altKm)
  const incFactor = inclinationFactor(incDeg)
  const shieldFactor = computeShieldingFactor(shieldingMmAl)
  return baseDose * incFactor * shieldFactor
}

/**
 * Full radiation environment analysis
 */
export function computeRadiationEnvironment(
  altKm: number,
  incDeg: number,
  shieldingMmAl: number,
  lifetimeYears: number,
): RadiationResult {
  const baseDose = interpolateDoseRate(altKm)
  const incFact = inclinationFactor(incDeg)
  const shieldFact = computeShieldingFactor(shieldingMmAl)

  const unshielded = baseDose * incFact
  const shielded = unshielded * shieldFact
  const totalDose = shielded * lifetimeYears

  // SAA exposure level
  const inc = Math.abs(incDeg)
  const saaExposure: 'low' | 'moderate' | 'high' =
    inc >= 30 && inc <= 60 ? 'high' :
    inc >= 20 && inc <= 70 ? 'moderate' : 'low'

  // Belt region classification
  let beltRegion: string
  if (altKm < 800) beltRegion = 'Below inner belt (LEO)'
  else if (altKm < 1500) beltRegion = 'Inner belt fringe'
  else if (altKm < 6000) beltRegion = 'Inner Van Allen belt'
  else if (altKm < 12000) beltRegion = 'Slot region'
  else if (altKm < 25000) beltRegion = 'Outer Van Allen belt'
  else beltRegion = 'Above outer belt (GEO region)'

  // Component recommendations
  let componentRecommendation: string
  let componentStatus: RadiationResult['componentStatus']

  if (totalDose < 5) {
    componentRecommendation = 'Commercial COTS components acceptable'
    componentStatus = 'nominal'
  } else if (totalDose < 10) {
    componentRecommendation = 'COTS components may work with margin testing'
    componentStatus = 'nominal'
  } else if (totalDose < 30) {
    componentRecommendation = 'Use radiation-tolerant components'
    componentStatus = 'warning'
  } else if (totalDose < 100) {
    componentRecommendation = 'Radiation-tolerant components required; consider spot shielding'
    componentStatus = 'warning'
  } else {
    componentRecommendation = 'Radiation-hardened components required'
    componentStatus = 'critical'
  }

  return {
    unshieldedDoseKradPerYear: unshielded,
    shieldedDoseKradPerYear: shielded,
    missionTotalDoseKrad: totalDose,
    shieldingFactor: shieldFact,
    inclinationFactor: incFact,
    saaExposure,
    componentRecommendation,
    componentStatus,
    beltRegion,
  }
}

// ─── Chart data generators ───

export interface DoseVsShieldingPoint {
  thicknessMm: number
  doseKradPerYear: number
  missionTotalKrad: number
}

export function computeDoseVsShielding(
  altKm: number,
  incDeg: number,
  lifetimeYears: number,
  minMm: number = 0,
  maxMm: number = 10,
  steps: number = 50,
): DoseVsShieldingPoint[] {
  const points: DoseVsShieldingPoint[] = []
  for (let i = 0; i <= steps; i++) {
    const t = minMm + (i / steps) * (maxMm - minMm)
    const annual = computeAnnualDose(altKm, incDeg, t)
    points.push({
      thicknessMm: t,
      doseKradPerYear: annual,
      missionTotalKrad: annual * lifetimeYears,
    })
  }
  return points
}

export interface DoseVsAltitudePoint {
  altKm: number
  doseKradPerYear: number
}

export function computeDoseVsAltitude(
  incDeg: number,
  shieldingMmAl: number,
  minAlt: number = 200,
  maxAlt: number = 36000,
  steps: number = 100,
): DoseVsAltitudePoint[] {
  const points: DoseVsAltitudePoint[] = []
  for (let i = 0; i <= steps; i++) {
    const alt = minAlt + (i / steps) * (maxAlt - minAlt)
    points.push({
      altKm: alt,
      doseKradPerYear: computeAnnualDose(alt, incDeg, shieldingMmAl),
    })
  }
  return points
}
