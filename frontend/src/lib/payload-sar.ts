/**
 * Synthetic Aperture Radar payload analysis
 * Computes resolution, swath, NESZ, ambiguity metrics, data rate
 */

import { DEG2RAD, R_EARTH_EQUATORIAL, C_LIGHT } from './constants'
import type { SARConfig, SharedPayloadConfig } from '@/types/payload'

export type PRFStatus = 'ok' | 'marginal' | 'invalid'

export interface SARAnalysis {
  wavelength: number          // m
  slantRange: number          // km
  groundRangeRes: number      // m — ground range resolution
  azimuthRes: number          // m — azimuth resolution
  swathWidth: number          // km
  nesz: number                // dB — noise equivalent sigma zero
  dataRateComputed: number    // Mbps
  areaCoverageRate: number    // km²/s
  imagingTimePerOrbit: number // s
  dataVolumePerOrbit: number  // GB
  dataVolumePerDay: number    // GB
  storageFillDays: number
  dopplerBandwidth: number    // Hz
  minPRF: number              // Hz — minimum PRF for azimuth
  maxPRFRange: number         // Hz — maximum PRF from range ambiguity
  prfStatus: PRFStatus        // whether set PRF is in valid window
}

/**
 * Compute SAR performance metrics
 */
export function computeSARAnalysis(
  sar: SARConfig,
  shared: SharedPayloadConfig,
  altitudeKm: number,
): SARAnalysis {
  const H = altitudeKm * 1000 // m
  const freqHz = sar.frequency * 1e9
  const wavelength = C_LIGHT / freqHz
  const lookAngleRad = sar.lookAngle * DEG2RAD
  const bwHz = sar.pulseBandwidth * 1e6

  // Slant range
  const slantRange = H / Math.cos(lookAngleRad)
  const slantRangeKm = slantRange / 1000

  // Ground range resolution
  const groundRangeRes = C_LIGHT / (2 * bwHz * Math.sin(lookAngleRad))

  // Azimuth resolution
  let azimuthRes: number
  if (sar.imagingMode === 'stripmap') {
    azimuthRes = sar.antennaLength / 2
  } else if (sar.imagingMode === 'spotlight') {
    // Spotlight gets better resolution, proportional to integration time
    azimuthRes = sar.antennaLength / 4
  } else {
    // ScanSAR — wider swath, coarser azimuth
    azimuthRes = sar.antennaLength * 2
  }

  // Multi-look degradation
  azimuthRes *= Math.sqrt(sar.numLooks)

  // Swath width
  const beamwidthElev = wavelength / sar.antennaWidth // antenna pattern beamwidth (rad)
  const swathGround = slantRange * beamwidthElev / Math.cos(lookAngleRad)
  let swathWidth = swathGround / 1000 // km
  if (sar.imagingMode === 'scansar') {
    swathWidth *= 3 // ScanSAR scans multiple sub-swaths
  }

  // ─── NESZ (Noise Equivalent Sigma Zero) ───
  // Standard SAR radar equation: NESZ = ((4π)³ × k × T_sys × B × v_s × R³ × sin(θ)) / (c × P_avg × G² × λ³)
  // Reference: Moreira et al. 2013 "A Tutorial on SAR"
  const T_SYS = 290 // K — system noise temperature
  const TX_DUTY = 0.25 // typical SAR transmit duty cycle (25%)
  const P_avg = sar.peakTxPower * TX_DUTY
  const antGain = (4 * Math.PI * sar.antennaLength * sar.antennaWidth) / (wavelength * wavelength)
  const sinLookAngle = Math.sin(lookAngleRad)

  const orbitalVelocity = Math.sqrt(398600.4418e9 / (R_EARTH_EQUATORIAL * 1000 + H)) // m/s

  const nesz_linear = (
    Math.pow(4 * Math.PI, 3) * 1.38e-23 * T_SYS * bwHz *
    orbitalVelocity * slantRange * slantRange * slantRange * sinLookAngle
  ) / (
    C_LIGHT * P_avg * antGain * antGain *
    wavelength * wavelength * wavelength
  )
  const nesz = 10 * Math.log10(Math.max(nesz_linear, 1e-30))

  // Doppler bandwidth and PRF constraints
  const groundSpeed = orbitalVelocity
  const dopplerBandwidth = 2 * groundSpeed / sar.antennaLength
  const minPRF = dopplerBandwidth * 1.1 // 10% margin for azimuth ambiguity

  // Max PRF: inter-pulse period must fit echo from the processed swath
  // Real SARs process ~70% of the illuminated swath (receive window timing within PRI)
  const PROCESSED_SWATH_FRACTION = 0.7
  const singleSwathGround = slantRange * beamwidthElev / Math.cos(lookAngleRad)
  const processedSwathSlant = singleSwathGround * sinLookAngle * PROCESSED_SWATH_FRACTION
  const maxPRFRange = C_LIGHT / (2 * processedSwathSlant) // echo spread across processed swath

  // Three-state PRF validity
  let prfStatus: PRFStatus
  if (minPRF <= maxPRFRange) {
    // Valid PRF window exists
    if (sar.prf >= minPRF && sar.prf <= maxPRFRange) {
      prfStatus = 'ok'
    } else if (sar.prf >= minPRF * 0.85 && sar.prf <= maxPRFRange * 1.2) {
      prfStatus = 'marginal'
    } else {
      prfStatus = 'invalid'
    }
  } else {
    // No simple valid window — requires advanced PRF techniques (staggering, etc.)
    prfStatus = minPRF < maxPRFRange * 2 ? 'marginal' : 'invalid'
  }

  // Data rate
  const samplesPerPulse = Math.ceil(2 * bwHz * swathGround / C_LIGHT * 2) // range samples
  const bitsPerSample = 8 // complex 4+4
  const dataRateComputed = sar.prf * samplesPerPulse * bitsPerSample * 2 / 1e6 // Mbps (I+Q)

  // Coverage rate
  const areaCoverageRate = (groundSpeed * swathWidth) / 1000 // km²/s

  // Orbit data
  const a = R_EARTH_EQUATORIAL + altitudeKm
  const orbitalPeriodS = 2 * Math.PI * Math.sqrt((a * a * a) / 398600.4418)
  const orbitsPerDay = 86400 / orbitalPeriodS
  const imagingTimePerOrbit = orbitalPeriodS * shared.dutyCycle
  const dataVolumePerOrbit = (dataRateComputed * 1e6 * imagingTimePerOrbit) / 8 / 1e9
  const dataVolumePerDay = dataVolumePerOrbit * orbitsPerDay
  const storageFillDays = shared.storageCapacity / Math.max(dataVolumePerDay, 0.001)

  return {
    wavelength,
    slantRange: slantRangeKm,
    groundRangeRes,
    azimuthRes,
    swathWidth,
    nesz,
    dataRateComputed,
    areaCoverageRate,
    imagingTimePerOrbit,
    dataVolumePerOrbit,
    dataVolumePerDay,
    storageFillDays,
    dopplerBandwidth,
    minPRF,
    maxPRFRange,
    prfStatus,
  }
}

/**
 * Compute resolution vs look angle (for chart)
 */
export function computeResVsLookAngle(
  sar: SARConfig,
  altitudeKm: number,
  minAngle = 15,
  maxAngle = 60,
  steps = 50,
): { angle: number; groundRange: number; azimuth: number }[] {
  const H = altitudeKm * 1000
  const freqHz = sar.frequency * 1e9
  const wavelength = C_LIGHT / freqHz
  const bwHz = sar.pulseBandwidth * 1e6

  let azRes = sar.antennaLength / 2
  if (sar.imagingMode === 'spotlight') azRes = sar.antennaLength / 4
  if (sar.imagingMode === 'scansar') azRes = sar.antennaLength * 2
  azRes *= Math.sqrt(sar.numLooks)

  const result: { angle: number; groundRange: number; azimuth: number }[] = []
  for (let i = 0; i <= steps; i++) {
    const angleDeg = minAngle + (i / steps) * (maxAngle - minAngle)
    const angleRad = angleDeg * DEG2RAD
    const grRes = C_LIGHT / (2 * bwHz * Math.sin(angleRad))
    result.push({ angle: angleDeg, groundRange: grRes, azimuth: azRes })
  }
  return result
}

/**
 * Compute PRF ambiguity diagram data (for chart)
 */
export function computeAmbiguityDiagram(
  sar: SARConfig,
  altitudeKm: number,
): { prfValues: number[]; minPRFLine: number; maxPRFLine: number[]; currentPRF: number } {
  const H = altitudeKm * 1000
  const freqHz = sar.frequency * 1e9
  const wavelength = C_LIGHT / freqHz
  const groundSpeed = Math.sqrt(398600.4418e9 / (R_EARTH_EQUATORIAL * 1000 + H))
  const dopplerBW = 2 * groundSpeed / sar.antennaLength
  const minPRF = dopplerBW * 1.1

  const beamwidthElev = wavelength / sar.antennaWidth
  const PROCESSED_FRACTION = 0.7
  const prfValues: number[] = []
  const maxPRFLine: number[] = []
  for (let i = 0; i <= 50; i++) {
    const lookDeg = 15 + (i / 50) * 45
    const lookRad = lookDeg * DEG2RAD
    const slant = H / Math.cos(lookRad)
    const swathGround = slant * beamwidthElev / Math.cos(lookRad)
    const processedSwathSlant = swathGround * Math.sin(lookRad) * PROCESSED_FRACTION
    const maxPRF = C_LIGHT / (2 * processedSwathSlant)
    prfValues.push(lookDeg)
    maxPRFLine.push(maxPRF)
  }

  return {
    prfValues,
    minPRFLine: minPRF,
    maxPRFLine,
    currentPRF: sar.prf,
  }
}
