/**
 * Lagrange point mission analysis
 * CR3BP Lagrange point positions, transfer ΔV, station-keeping, halo orbits
 */

import {
  MU_SUN, AU_KM, MU_CR3BP_SE, MU_CR3BP_EM,
  MOON_SEMI_MAJOR_AXIS,
  SE_L1_DIST_KM, SE_L2_DIST_KM, SE_L3_DIST_KM, SE_L4_DIST_KM, SE_L5_DIST_KM,
  EM_L1_DIST_KM, EM_L2_DIST_KM, EM_L3_DIST_KM, EM_L4_DIST_KM, EM_L5_DIST_KM,
  SE_L1_HALO_PERIOD_DAYS, SE_L2_HALO_PERIOD_DAYS, SE_L3_HALO_PERIOD_DAYS,
  EM_L1_HALO_PERIOD_DAYS, EM_L2_HALO_PERIOD_DAYS, EM_L3_HALO_PERIOD_DAYS,
  EM_L4_HALO_PERIOD_DAYS, EM_L5_HALO_PERIOD_DAYS,
  SK_BUDGETS, EARTH_ORBITAL_DATA,
} from './beyond-leo-constants'
import { MU_EARTH_KM, R_EARTH_EQUATORIAL, C_LIGHT } from './constants'
import type {
  LagrangeSystem, LagrangePoint, LagrangeOrbitType,
  LagrangeTransferType, LagrangeParams, LagrangeResult,
} from '@/types/beyond-leo'

// ─── L-point distance lookups ───

const DIST_MAP: Record<string, number> = {
  'SE-L1': SE_L1_DIST_KM,
  'SE-L2': SE_L2_DIST_KM,
  'SE-L3': SE_L3_DIST_KM,
  'SE-L4': SE_L4_DIST_KM,
  'SE-L5': SE_L5_DIST_KM,
  'EM-L1': EM_L1_DIST_KM,
  'EM-L2': EM_L2_DIST_KM,
  'EM-L3': EM_L3_DIST_KM,
  'EM-L4': EM_L4_DIST_KM,
  'EM-L5': EM_L5_DIST_KM,
}

const PERIOD_MAP: Record<string, number> = {
  'SE-L1': SE_L1_HALO_PERIOD_DAYS,
  'SE-L2': SE_L2_HALO_PERIOD_DAYS,
  'SE-L3': SE_L3_HALO_PERIOD_DAYS,
  'SE-L4': 365.25,
  'SE-L5': 365.25,
  'EM-L1': EM_L1_HALO_PERIOD_DAYS,
  'EM-L2': EM_L2_HALO_PERIOD_DAYS,
  'EM-L3': EM_L3_HALO_PERIOD_DAYS,
  'EM-L4': EM_L4_HALO_PERIOD_DAYS,
  'EM-L5': EM_L5_HALO_PERIOD_DAYS,
}

/**
 * Get the distance from the secondary body to the L-point (km)
 */
export function computeLagrangeDistance(system: LagrangeSystem, point: LagrangePoint): number {
  return DIST_MAP[`${system}-${point}`] || 1e6
}

/**
 * Compute orbit period at a given L-point (days), accounting for orbit type.
 * - Halo: periodic orbit with a single well-defined period
 * - Lissajous: quasi-periodic; in-plane period ≈ halo period, out-of-plane differs by ~10-15%
 *   We return the in-plane (dominant) period
 * - Lyapunov: planar orbit, period is ~5-8% shorter than halo at same L-point
 */
export function computeOrbitPeriod(
  system: LagrangeSystem,
  point: LagrangePoint,
  orbitType: LagrangeOrbitType,
): number {
  const basePeriod = PERIOD_MAP[`${system}-${point}`] || 180
  if (orbitType === 'lyapunov') return basePeriod * 0.93  // planar orbit, shorter period
  if (orbitType === 'lissajous') return basePeriod * 1.0   // in-plane period ≈ halo
  return basePeriod // halo
}

/**
 * For Lissajous orbits, compute the out-of-plane period (days).
 * Ratio Tz/Txy ≈ 1.0 to 1.15 depending on L-point.
 */
export function computeLissajousOutOfPlanePeriod(
  system: LagrangeSystem,
  point: LagrangePoint,
): number {
  const basePeriod = PERIOD_MAP[`${system}-${point}`] || 180
  // Collinear L-points have a ~10-15% mismatch; L4/L5 are naturally coupled
  if (point === 'L4' || point === 'L5') return basePeriod
  return basePeriod * 1.12
}

// Keep backward-compatible alias
export function computeHaloPeriod(system: LagrangeSystem, point: LagrangePoint): number {
  return PERIOD_MAP[`${system}-${point}`] || 180
}

/**
 * Compute transfer ΔV from parking orbit to Lagrange point
 * Uses patched-conic approximation:
 *   - For SE L1/L2: Earth escape to reach ~1.5M km → near-parabolic from Earth
 *   - For EM L1/L2: Similar to lunar transfer but less ΔV
 */
export function computeLagrangeTransferDV(
  system: LagrangeSystem,
  point: LagrangePoint,
  departureAltKm: number,
  transferType: LagrangeTransferType,
): { transferDV: number; insertionDV: number; transferTimeDays: number } {
  const rPark = (R_EARTH_EQUATORIAL + departureAltKm) // km

  if (system === 'SE') {
    // Sun-Earth Lagrange points
    // Transfer to SE-L1/L2 requires leaving Earth's gravity well
    // V_escape from parking orbit via vis-viva
    const vCirc = Math.sqrt(MU_EARTH_KM / rPark) // km/s circular velocity
    const dist = computeLagrangeDistance(system, point)

    if (point === 'L1' || point === 'L2') {
      // Near-escape trajectory: the spacecraft needs just slightly more than escape velocity
      // to reach the SE L-points at ~1.5M km
      // V_inf ≈ 0.3-0.7 km/s depending on the L-point
      const vInf = 0.3 + (dist / AU_KM) * 0.2 // rough approximation
      const vDepart = Math.sqrt(vInf * vInf + 2 * MU_EARTH_KM / rPark)
      const transferDV = (vDepart - vCirc) * 1000 // m/s

      // Insertion into halo orbit — small correction burn
      const insertionDV = transferType === 'direct' ? 15 : 5 // m/s (typical for SE-L2)

      // Transfer time
      const transferTimeDays = transferType === 'direct' ? 30 : 120

      return { transferDV, insertionDV, transferTimeDays }
    }

    if (point === 'L3') {
      // L3 is on the opposite side of Sun — requires significant energy
      const vInf = 2.0 // km/s — needs larger departure energy
      const vDepart = Math.sqrt(vInf * vInf + 2 * MU_EARTH_KM / rPark)
      const transferDV = (vDepart - vCirc) * 1000
      return { transferDV, insertionDV: 200, transferTimeDays: 200 }
    }

    // L4/L5 — 60° ahead/behind Earth in its orbit
    // Requires Earth escape + modest heliocentric velocity change
    const vInf = 1.5 // km/s
    const vDepart = Math.sqrt(vInf * vInf + 2 * MU_EARTH_KM / rPark)
    const transferDV = (vDepart - vCirc) * 1000
    return { transferDV, insertionDV: 50, transferTimeDays: transferType === 'direct' ? 180 : 365 }

  } else {
    // Earth-Moon Lagrange points
    const vCirc = Math.sqrt(MU_EARTH_KM / rPark)
    const dist = computeLagrangeDistance(system, point)

    if (point === 'L1' || point === 'L2') {
      // EM-L1/L2: similar to lunar transfer but target is closer/further
      // Distance from Earth: L1 at ~326,400 km, L2 at ~444,200 km
      const targetDist = MOON_SEMI_MAJOR_AXIS - (point === 'L1' ? EM_L1_DIST_KM : -EM_L2_DIST_KM)
      const sma = (rPark + targetDist) / 2 // transfer ellipse SMA
      const vDepart = Math.sqrt(MU_EARTH_KM * (2 / rPark - 1 / sma))
      const transferDV = (vDepart - vCirc) * 1000

      // Insertion burn
      const vArrival = Math.sqrt(MU_EARTH_KM * (2 / targetDist - 1 / sma))
      const vTarget = Math.sqrt(MU_EARTH_KM / targetDist) * 0.1 // approximate halo velocity
      const insertionDV = Math.abs(vArrival - vTarget) * 1000

      const transferTimeDays = transferType === 'direct' ? 4.5 : 90
      return { transferDV, insertionDV: Math.min(insertionDV, 500), transferTimeDays }
    }

    if (point === 'L3') {
      // EM-L3: opposite side of Earth from Moon
      const sma = (rPark + EM_L3_DIST_KM) / 2
      const vDepart = Math.sqrt(MU_EARTH_KM * (2 / rPark - 1 / sma))
      const transferDV = (vDepart - vCirc) * 1000
      return { transferDV, insertionDV: 300, transferTimeDays: 15 }
    }

    // EM-L4/L5: 60° ahead/behind Moon
    const sma = (rPark + MOON_SEMI_MAJOR_AXIS) / 2
    const vDepart = Math.sqrt(MU_EARTH_KM * (2 / rPark - 1 / sma))
    const transferDV = (vDepart - vCirc) * 1000
    return { transferDV, insertionDV: 200, transferTimeDays: transferType === 'direct' ? 5 : 90 }
  }
}

/**
 * Get station-keeping ΔV budget (m/s/yr).
 * Halo orbits require the most SK (maintaining periodicity is tightly constrained).
 * Lissajous orbits are quasi-periodic and less constrained → ~20-30% less SK.
 * Lyapunov orbits are planar and least constrained → ~40-50% less SK.
 * Larger amplitudes slightly increase SK due to greater sensitivity to perturbations.
 */
export function computeStationKeeping(
  system: LagrangeSystem,
  point: LagrangePoint,
  orbitType: LagrangeOrbitType,
  amplitudeKm: number,
): number {
  const key = `${system}-${point}`
  const base = SK_BUDGETS[key] ?? 10

  // Orbit type factor
  let typeFactor = 1.0
  if (orbitType === 'lissajous') typeFactor = 0.75     // ~25% less SK than halo
  else if (orbitType === 'lyapunov') typeFactor = 0.55  // ~45% less SK than halo

  // Amplitude factor: larger orbits slightly more sensitive
  // Use typical amplitude ranges per system to normalize
  const typicalAmp = system === 'SE' ? 500000 : 15000 // km — typical halo amplitude
  const ampRatio = amplitudeKm / typicalAmp
  const ampFactor = 0.9 + 0.2 * Math.min(ampRatio, 3) // ranges from ~0.9 to ~1.5

  return base * typeFactor * ampFactor
}

/**
 * Full Lagrange analysis
 */
export function computeLagrangeResult(params: LagrangeParams): LagrangeResult {
  const {
    system, point, orbitType, amplitudeKm,
    departureAltKm, transferType,
    missionLifetimeYears, stationKeepingBudgetMs,
  } = params

  const pointDistanceKm = computeLagrangeDistance(system, point)
  const pointDistanceAU = pointDistanceKm / AU_KM

  const { transferDV, insertionDV, transferTimeDays } =
    computeLagrangeTransferDV(system, point, departureAltKm, transferType)

  // Orbit type affects insertion ΔV:
  // Lissajous targets are less constrained → slightly lower insertion
  // Lyapunov is planar only → different targeting geometry, ~10-20% lower insertion
  let adjustedInsertionDV = insertionDV
  if (orbitType === 'lissajous') adjustedInsertionDV *= 0.85
  else if (orbitType === 'lyapunov') adjustedInsertionDV *= 0.75

  const totalDeltaVms = transferDV + adjustedInsertionDV
  const haloPeriodDays = computeOrbitPeriod(system, point, orbitType)

  // Communications
  let commsDistanceKm: number
  if (system === 'SE') {
    // Distance from Earth to spacecraft at L-point
    commsDistanceKm = pointDistanceKm
  } else {
    // EM system: distance depends on L-point
    if (point === 'L1') {
      commsDistanceKm = MOON_SEMI_MAJOR_AXIS - EM_L1_DIST_KM
    } else if (point === 'L2') {
      commsDistanceKm = MOON_SEMI_MAJOR_AXIS + EM_L2_DIST_KM
    } else if (point === 'L3') {
      commsDistanceKm = EM_L3_DIST_KM
    } else {
      commsDistanceKm = MOON_SEMI_MAJOR_AXIS // L4/L5 roughly at lunar distance
    }
  }
  const commsDelayS = commsDistanceKm / (C_LIGHT / 1000) // C_LIGHT is m/s, convert to km/s

  // Stability
  const stabilityClass = (point === 'L4' || point === 'L5') ? 'stable' as const : 'unstable' as const

  // Station-keeping
  const annualStationKeepingMs = computeStationKeeping(system, point, orbitType, amplitudeKm)
  const missionTotalDeltaVms = totalDeltaVms + annualStationKeepingMs * missionLifetimeYears

  return {
    pointDistanceKm,
    pointDistanceAU,
    transferDeltaVms: transferDV,
    transferTimeDays,
    insertionDeltaVms: adjustedInsertionDV,
    totalDeltaVms,
    haloPeriodDays,
    commsDistanceKm,
    commsDelayS,
    stabilityClass,
    annualStationKeepingMs,
    missionTotalDeltaVms,
  }
}

/**
 * Compute L-point x-position in normalized coordinates
 */
function getLPointX(point: LagrangePoint, lpDist: number, systemDist: number): number {
  if (point === 'L1') return 1 - lpDist / systemDist
  if (point === 'L2') return 1 + lpDist / systemDist
  if (point === 'L3') return -1
  return 0.5 // L4, L5
}

/**
 * Generate orbit points for 3D rendering.
 * Shape depends on orbit type:
 * - Halo: clean closed elliptical loop (y-z plane at L-point)
 * - Lissajous: quasi-periodic open curve (in-plane and out-of-plane frequencies differ)
 * - Lyapunov: flat planar ellipse (no z-component)
 *
 * Returns points in normalized coordinates (1 unit = system characteristic distance)
 */
export function generateOrbitPoints(
  system: LagrangeSystem,
  point: LagrangePoint,
  amplitudeKm: number,
  orbitType: LagrangeOrbitType = 'halo',
  numPoints = 100,
): Array<{ x: number; y: number; z: number }> {
  const systemDist = system === 'SE' ? AU_KM : MOON_SEMI_MAJOR_AXIS
  const lpDist = computeLagrangeDistance(system, point)
  const lpX = getLPointX(point, lpDist, systemDist)

  const ampNorm = amplitudeKm / systemDist

  const points: Array<{ x: number; y: number; z: number }> = []

  if (orbitType === 'lyapunov') {
    // Lyapunov: planar orbit — no out-of-plane (z) component
    // Ellipse in the x-y plane centered on L-point
    const ampY = ampNorm
    const ampX = ampNorm * 0.15 // small in-plane libration
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI
      points.push({
        x: lpX + ampX * Math.cos(theta),
        y: ampY * Math.sin(theta),
        z: 0, // strictly planar
      })
    }
  } else if (orbitType === 'lissajous') {
    // Lissajous: quasi-periodic — different in-plane and out-of-plane frequencies
    // The frequency ratio causes the orbit to not close on itself
    // Show ~2.5 periods worth to see the drift pattern
    const ampY = ampNorm
    const ampZ = ampNorm * 0.45
    const ampX = ampNorm * 0.1
    const freqRatio = 1.12 // Tz/Txy ratio — out-of-plane slightly slower
    const numLoops = 2.5   // show multiple periods to see open pattern
    const totalAngle = numLoops * 2 * Math.PI
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * totalAngle
      points.push({
        x: lpX + ampX * Math.cos(theta),
        y: ampY * Math.sin(theta),
        z: ampZ * Math.cos(theta / freqRatio), // different frequency → doesn't close
      })
    }
  } else {
    // Halo: periodic closed loop — y and z at same frequency, phase-locked
    const ampY = ampNorm
    const ampZ = ampNorm * 0.5 // Z-amplitude typically ~half of Y for halo
    const ampX = ampNorm * 0.1
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI
      points.push({
        x: lpX + ampX * Math.cos(theta),
        y: ampY * Math.sin(theta),
        z: ampZ * Math.cos(theta),
      })
    }
  }

  return points
}

// Backward-compatible alias
export function generateHaloOrbitPoints(
  system: LagrangeSystem,
  point: LagrangePoint,
  amplitudeKm: number,
  numPoints = 100,
): Array<{ x: number; y: number; z: number }> {
  return generateOrbitPoints(system, point, amplitudeKm, 'halo', numPoints)
}

/**
 * Generate transfer arc from Earth to L-point for 3D rendering
 */
export function generateTransferArc(
  system: LagrangeSystem,
  point: LagrangePoint,
  numPoints = 60,
): Array<{ x: number; y: number; z: number }> {
  const systemDist = system === 'SE' ? AU_KM : MOON_SEMI_MAJOR_AXIS
  const lpDist = computeLagrangeDistance(system, point)

  // Earth position in normalized coords
  const earthX = system === 'SE' ? 1.0 : 0.0 // SE: Earth is at 1-mu ≈ 1; EM: Earth at origin

  // L-point position
  let lpX: number
  if (system === 'SE') {
    lpX = point === 'L1' ? 1 - lpDist / systemDist : point === 'L2' ? 1 + lpDist / systemDist : -1
  } else {
    if (point === 'L1') lpX = (MOON_SEMI_MAJOR_AXIS - EM_L1_DIST_KM) / systemDist
    else if (point === 'L2') lpX = (MOON_SEMI_MAJOR_AXIS + EM_L2_DIST_KM) / systemDist
    else lpX = -EM_L3_DIST_KM / systemDist
  }

  let lpY = 0
  if (point === 'L4') { lpX = 0.5; lpY = Math.sqrt(3) / 2 }
  if (point === 'L5') { lpX = 0.5; lpY = -Math.sqrt(3) / 2 }

  const startX = system === 'SE' ? 1.0 : 0.0
  const points: Array<{ x: number; y: number; z: number }> = []

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    // Curved arc with a slight bulge perpendicular to the line
    const bulge = Math.sin(t * Math.PI) * 0.02
    points.push({
      x: startX + (lpX - startX) * t,
      y: lpY * t + bulge,
      z: bulge * 0.5,
    })
  }
  return points
}

/**
 * Generate transfer distance profile for charts
 * Returns distance from Earth (km) vs time (days)
 */
export function generateTransferProfile(
  params: LagrangeParams,
  numPoints = 50,
): Array<{ day: number; distanceKm: number }> {
  const result = computeLagrangeResult(params)
  const totalDays = result.transferTimeDays
  const targetDist = result.commsDistanceKm

  const points: Array<{ day: number; distanceKm: number }> = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const day = t * totalDays
    // S-curve: slow start, fast middle, slow approach
    const progress = 0.5 - 0.5 * Math.cos(t * Math.PI)
    const distanceKm = progress * targetDist
    points.push({ day, distanceKm })
  }
  return points
}
