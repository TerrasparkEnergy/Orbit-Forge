/**
 * Earth Observation payload analysis
 * Computes GSD, swath, FOV, IFOV, SNR, and imaging capacity
 */

import { DEG2RAD, RAD2DEG, R_EARTH_EQUATORIAL } from './constants'
import type { EOConfig, SharedPayloadConfig } from '@/types/payload'

export interface EOAnalysis {
  gsdNadir: number          // m — ground sample distance at nadir
  gsdOffNadir: number       // m — GSD at max off-nadir
  swathWidth: number        // km — swath width at nadir
  fovCrossTrack: number     // degrees — field of view
  ifov: number              // μrad — instantaneous FOV
  fNumber: number           // f-number of optic
  snr: number               // signal-to-noise ratio estimate
  dailyImagingCapacity: number  // km² per day
  revisitTime: number       // days — approximate revisit
  dataVolumePerOrbit: number    // GB
  dataVolumePerDay: number      // GB
  storageFillDays: number       // days until storage full
  orbitPeriodMin: number        // minutes
}

/**
 * Compute EO performance metrics
 */
export function computeEOAnalysis(
  eo: EOConfig,
  shared: SharedPayloadConfig,
  altitudeKm: number,
  inclinationDeg: number,
): EOAnalysis {
  const H = altitudeKm * 1000 // altitude in meters
  const focalM = eo.focalLength / 1000 // mm → m
  const pixelM = eo.pixelSize * 1e-6 // μm → m
  const aperM = eo.apertureDia / 1000 // mm → m

  // GSD at nadir
  const gsdNadir = (pixelM * H) / focalM

  // GSD at max off-nadir (simplified: sec(angle) scaling + slant range)
  const offNadirRad = eo.maxOffNadir * DEG2RAD
  const slantRange = H / Math.cos(offNadirRad)
  const gsdOffNadir = (pixelM * slantRange) / focalM / Math.cos(offNadirRad)

  // Swath width
  const detectorLinearSize = eo.detectorWidth * pixelM // physical detector width
  const fovRad = 2 * Math.atan(detectorLinearSize / (2 * focalM))
  const fovCrossTrack = fovRad * RAD2DEG
  const swathWidth = 2 * H * Math.tan(fovRad / 2) / 1000 // km

  // IFOV
  const ifov = (pixelM / focalM) * 1e6 // μrad

  // F-number
  const fNumber = focalM / aperM

  // ─── SNR estimation (simplified radiometric model) ───
  //
  // 1. Ground-reaching solar irradiance
  //    E_ground = E_sun * τ_atm * sin(θ_sun)
  // 2. Lambertian surface reflected radiance
  //    L_surface = (ρ / π) * E_ground
  // 3. At-sensor radiance (second atmospheric pass)
  //    L_sensor = L_surface * τ_atm
  //    Combined: L_sensor = (ρ / π) * E_sun * τ_atm² * sin(θ_sun)
  // 4. Per-band radiance (VIS-NIR fraction ~40% of solar, split across bands)
  //    L_band = L_sensor * 0.4 / N_bands
  // 5. Focal plane irradiance:  E_fp = π * L_band / (4 * F²)
  // 6. Signal electrons = E_fp * A_pixel * t_int * QE / E_photon
  // 7. Noise = sqrt(N_signal + N_dark + N_read²)
  //
  const E_SUN = 1361               // W/m² at TOA
  const TAU_ATM = 0.75             // atmospheric transmission
  const ALBEDO = 0.3               // surface albedo
  const QE = 0.5                   // detector quantum efficiency
  const LAMBDA_CENTER = 550e-9     // m — center wavelength (green)
  const H_PLANCK = 6.626e-34       // J·s
  const C_SPEED = 3e8              // m/s
  const READ_NOISE_E = 50          // electrons RMS read noise
  const VIS_NIR_FRACTION = 0.4     // fraction of solar energy in 400–900 nm

  const sunElevRad = eo.sunElevation * DEG2RAD
  const sinSunElev = Math.max(Math.sin(sunElevRad), 0.01) // clamp to avoid zero

  // At-sensor radiance (broadband, then per band)
  const L_sensor = (ALBEDO / Math.PI) * E_SUN * TAU_ATM * TAU_ATM * sinSunElev
  const L_band = L_sensor * VIS_NIR_FRACTION / Math.max(eo.spectralBands, 1)

  // Focal plane irradiance for f/F optics
  const E_fp = Math.PI * L_band / (4 * fNumber * fNumber)

  // Pixel area on detector
  const A_pixel = pixelM * pixelM

  // Integration time: GSD / ground velocity (pushbroom line rate)
  const orbitalVelocity = Math.sqrt(398600.4418 / (R_EARTH_EQUATORIAL + altitudeKm)) * 1000 // m/s
  const groundVelocity = orbitalVelocity * R_EARTH_EQUATORIAL / (R_EARTH_EQUATORIAL + altitudeKm) // m/s
  const tInt = gsdNadir / groundVelocity // seconds

  // Photon energy at center wavelength
  const E_photon = H_PLANCK * C_SPEED / LAMBDA_CENTER

  // Signal electrons per pixel per band
  const N_signal = E_fp * A_pixel * tInt * QE / E_photon

  // Noise: shot noise + read noise (dark current negligible for short t_int)
  const N_noise = Math.sqrt(Math.max(N_signal, 0) + READ_NOISE_E * READ_NOISE_E)
  const snr = N_noise > 0 ? N_signal / N_noise : 0

  // Orbital period
  const a = R_EARTH_EQUATORIAL + altitudeKm
  const orbitalPeriodS = 2 * Math.PI * Math.sqrt((a * a * a) / 398600.4418)
  const orbitPeriodMin = orbitalPeriodS / 60
  const orbitsPerDay = 86400 / orbitalPeriodS

  // Daily imaging capacity
  const imagingTimePerOrbit = orbitalPeriodS * shared.dutyCycle // seconds in daylight imaging
  const groundSpeed = Math.sqrt(398600.4418 / a) * 1000 // m/s
  const stripAreaPerSecond = (swathWidth * 1000 * groundSpeed) / 1e6 // km²/s
  const dailyImagingCapacity = stripAreaPerSecond * imagingTimePerOrbit * orbitsPerDay / orbitsPerDay // km²/day — per orbit * orbits
  const dailyCapacity = stripAreaPerSecond * shared.dutyCycle * 86400 // total km²/day

  // Revisit (approximate: assumes single satellite, SSO)
  const earthCircumKm = 2 * Math.PI * R_EARTH_EQUATORIAL
  const latCoverage = swathWidth // km strip per orbit
  const revisitTime = Math.max(1, earthCircumKm * Math.cos(inclinationDeg * DEG2RAD) / (latCoverage * orbitsPerDay))

  // Data volumes
  const bitsPerPixel = eo.quantBits * eo.spectralBands
  const pixelsPerSecond = (groundSpeed / gsdNadir) * eo.detectorWidth
  const dataRateBps = pixelsPerSecond * bitsPerPixel
  const dataVolumePerOrbit = (dataRateBps * imagingTimePerOrbit) / 8 / 1e9 // GB
  const dataVolumePerDay = dataVolumePerOrbit * orbitsPerDay

  // Storage fill
  const storageFillDays = shared.storageCapacity / Math.max(dataVolumePerDay, 0.001)

  return {
    gsdNadir,
    gsdOffNadir,
    swathWidth,
    fovCrossTrack,
    ifov,
    fNumber,
    snr,
    dailyImagingCapacity: dailyCapacity,
    revisitTime,
    dataVolumePerOrbit,
    dataVolumePerDay,
    storageFillDays,
    orbitPeriodMin,
  }
}

/**
 * Compute GSD as a function of off-nadir angle (for chart)
 */
export function computeGSDvsOffNadir(
  eo: EOConfig,
  altitudeKm: number,
  maxAngle = 45,
  steps = 50,
): { angle: number; gsd: number }[] {
  const H = altitudeKm * 1000
  const focalM = eo.focalLength / 1000
  const pixelM = eo.pixelSize * 1e-6

  const result: { angle: number; gsd: number }[] = []
  for (let i = 0; i <= steps; i++) {
    const angleDeg = (i / steps) * maxAngle
    const angleRad = angleDeg * DEG2RAD
    const slant = H / Math.cos(angleRad)
    const gsd = (pixelM * slant) / focalM / Math.cos(angleRad)
    result.push({ angle: angleDeg, gsd })
  }
  return result
}

/**
 * Compute coverage accumulation over days (for chart)
 */
export function computeCoverageAccumulation(
  swathWidthKm: number,
  dutyCycle: number,
  altitudeKm: number,
  days = 30,
): { day: number; areaSqKm: number }[] {
  const a = R_EARTH_EQUATORIAL + altitudeKm
  const orbitalPeriodS = 2 * Math.PI * Math.sqrt((a * a * a) / 398600.4418)
  const groundSpeedKmS = Math.sqrt(398600.4418 / a)
  const orbitsPerDay = 86400 / orbitalPeriodS

  const result: { day: number; areaSqKm: number }[] = []
  let cumArea = 0
  for (let d = 0; d <= days; d++) {
    const dailyArea = swathWidthKm * groundSpeedKmS * dutyCycle * 86400
    if (d > 0) cumArea += dailyArea * 0.85 // ~15% overlap factor
    result.push({ day: d, areaSqKm: cumArea })
  }
  return result
}
