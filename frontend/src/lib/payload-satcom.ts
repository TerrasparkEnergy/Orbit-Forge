/**
 * SATCOM payload link budget analysis
 * Computes EIRP, G/T, C/N, link margin, data rate, beam footprint
 */

import { DEG2RAD, R_EARTH_EQUATORIAL, C_LIGHT, K_BOLTZMANN } from './constants'
import type { SATCOMConfig, SharedPayloadConfig } from '@/types/payload'

export interface SATCOMAnalysis {
  // Antenna / RF
  satAntennaGain: number     // dBi
  gsAntennaGain: number      // dBi
  satEIRP: number            // dBW
  gsGOverT: number           // dB/K

  // Link budget (downlink)
  fspl: number               // dB — free space path loss
  cOverN: number             // dB
  ebN0: number               // dB
  linkMargin: number         // dB
  maxDataRate: number        // Mbps

  // Beam
  beamFootprintKm: number    // km diameter on ground
  beamwidthDeg: number       // 3dB beamwidth in degrees

  // Throughput
  dataVolumePerPass: number  // GB — for ~10min pass
  dataVolumePerDay: number   // GB
  storageFillDays: number
}

/**
 * Antenna gain from diameter and frequency
 * G = η * (π * D / λ)²  where η ≈ 0.55
 */
function antennaGainLinear(diameterM: number, freqGHz: number): number {
  const lambda = C_LIGHT / (freqGHz * 1e9)
  const eta = 0.65 // aperture efficiency (typical for satellite antennas)
  return eta * Math.pow((Math.PI * diameterM) / lambda, 2)
}

function toDb(linear: number): number {
  return 10 * Math.log10(Math.max(linear, 1e-30))
}

/**
 * Compute SATCOM link budget
 */
export function computeSATCOMAnalysis(
  satcom: SATCOMConfig,
  shared: SharedPayloadConfig,
  altitudeKm: number,
  elevationDeg = 10, // minimum elevation angle for link budget
): SATCOMAnalysis {
  const freqDown = satcom.downlinkFreq // GHz
  const lambdaDown = C_LIGHT / (freqDown * 1e9)

  // Slant range at given elevation
  const Re = R_EARTH_EQUATORIAL
  const elevRad = elevationDeg * DEG2RAD
  const sinElev = Math.sin(elevRad)
  const slantRange = Re * (Math.sqrt((((Re + altitudeKm) / Re) ** 2) - Math.cos(elevRad) ** 2) - sinElev)
  const slantRangeM = slantRange * 1000

  // Antenna gains
  const satGainLinear = antennaGainLinear(satcom.satAntennaDia, freqDown)
  const gsGainLinear = antennaGainLinear(satcom.gsAntennaDia, freqDown)
  const satAntennaGain = toDb(satGainLinear)
  const gsAntennaGain = toDb(gsGainLinear)

  // EIRP
  const satTxPowerDbw = toDb(satcom.satTxPower)
  const satEIRP = satTxPowerDbw + satAntennaGain

  // G/T for ground station
  const gsGOverT = gsAntennaGain - toDb(satcom.gsNoiseTemp)

  // FSPL
  const fspl = 20 * Math.log10(4 * Math.PI * slantRangeM / lambdaDown)

  // Received C/N0 (downlink)
  const cOverN0 = satEIRP + gsGOverT - fspl - toDb(K_BOLTZMANN) -
    satcom.atmosphericLoss - satcom.rainMargin

  // Determine symbol rate and bit rate from modulation
  const bitsPerSymbol: Record<string, number> = {
    'BPSK': 1,
    'QPSK': 2,
    '8PSK': 3,
    '16APSK': 4,
  }
  const bps = bitsPerSymbol[satcom.modulation] || 2

  // Eb/N0 from C/N0 and data rate
  // We compute max data rate that achieves required Eb/N0
  // C/N0 = Eb/N0 + 10*log10(Rb)
  // Rb = 10^((C/N0 - Eb/N0_req) / 10)
  const maxDataRateBps = Math.pow(10, (cOverN0 - satcom.requiredEbN0) / 10)
  const maxDataRate = maxDataRateBps / 1e6 // Mbps

  // Using actual data rate from shared config or max, whichever is less
  const actualDataRate = Math.min(shared.dataRate, maxDataRate)
  const actualRateBps = actualDataRate * 1e6

  // Actual Eb/N0 at the data rate we're using
  const ebN0 = cOverN0 - 10 * Math.log10(Math.max(actualRateBps, 1))
  const linkMargin = ebN0 - satcom.requiredEbN0

  // C/N for the actual bandwidth
  const bandwidth = actualRateBps / (bps * satcom.codingRate)
  const cOverN = cOverN0 - 10 * Math.log10(Math.max(bandwidth, 1))

  // Beam footprint
  const beamwidthRad = 1.22 * lambdaDown / satcom.satAntennaDia
  const beamwidthDeg = beamwidthRad * (180 / Math.PI)
  const beamFootprintKm = 2 * altitudeKm * Math.tan(beamwidthRad / 2)

  // Throughput estimates
  const avgPassDurationS = 600 // ~10 min average pass
  const a = R_EARTH_EQUATORIAL + altitudeKm
  const orbitalPeriodS = 2 * Math.PI * Math.sqrt((a * a * a) / 398600.4418)
  const orbitsPerDay = 86400 / orbitalPeriodS
  const passesPerDay = Math.min(orbitsPerDay, 6) // typical 4-6 passes over a station

  const dataVolumePerPass = (actualDataRate * 1e6 * avgPassDurationS) / 8 / 1e9 // GB
  const dataVolumePerDay = dataVolumePerPass * passesPerDay
  const storageFillDays = shared.storageCapacity / Math.max(dataVolumePerDay, 0.001)

  return {
    satAntennaGain,
    gsAntennaGain,
    satEIRP,
    gsGOverT,
    fspl,
    cOverN,
    ebN0,
    linkMargin,
    maxDataRate,
    beamFootprintKm,
    beamwidthDeg,
    dataVolumePerPass,
    dataVolumePerDay,
    storageFillDays,
  }
}

/**
 * Link budget waterfall data (for chart)
 */
export interface WaterfallItem {
  label: string
  value: number
  cumulative: number
}

export function computeLinkBudgetWaterfall(
  satcom: SATCOMConfig,
  altitudeKm: number,
  elevationDeg = 10,
): WaterfallItem[] {
  const freqDown = satcom.downlinkFreq
  const lambdaDown = C_LIGHT / (freqDown * 1e9)
  const Re = R_EARTH_EQUATORIAL
  const elevRad = elevationDeg * DEG2RAD
  const sinElev = Math.sin(elevRad)
  const slantRange = Re * (Math.sqrt((((Re + altitudeKm) / Re) ** 2) - Math.cos(elevRad) ** 2) - sinElev)
  const slantRangeM = slantRange * 1000

  const satGain = toDb(antennaGainLinear(satcom.satAntennaDia, freqDown))
  const gsGain = toDb(antennaGainLinear(satcom.gsAntennaDia, freqDown))
  const txPower = toDb(satcom.satTxPower)
  const fspl = 20 * Math.log10(4 * Math.PI * slantRangeM / lambdaDown)

  const items: WaterfallItem[] = []
  let cum = 0

  const add = (label: string, value: number) => {
    cum += value
    items.push({ label, value, cumulative: cum })
  }

  add('Tx Power', txPower)
  add('Sat Antenna', satGain)
  add('Path Loss', -fspl)
  add('Atm Loss', -satcom.atmosphericLoss)
  add('Rain Margin', -satcom.rainMargin)
  add('GS Antenna', gsGain)
  add('System Noise', -toDb(satcom.gsNoiseTemp * K_BOLTZMANN))

  return items
}

/**
 * Data rate vs elevation angle (for chart)
 */
export function computeDataRateVsElevation(
  satcom: SATCOMConfig,
  altitudeKm: number,
  minElev = 5,
  maxElev = 90,
  steps = 40,
): { elevation: number; dataRate: number }[] {
  const freqDown = satcom.downlinkFreq
  const lambdaDown = C_LIGHT / (freqDown * 1e9)
  const Re = R_EARTH_EQUATORIAL

  const satGainLin = antennaGainLinear(satcom.satAntennaDia, freqDown)
  const gsGainLin = antennaGainLinear(satcom.gsAntennaDia, freqDown)
  const satTxPowerW = satcom.satTxPower

  const result: { elevation: number; dataRate: number }[] = []
  for (let i = 0; i <= steps; i++) {
    const elevDeg = minElev + (i / steps) * (maxElev - minElev)
    const elevRad = elevDeg * DEG2RAD
    const sinElev = Math.sin(elevRad)
    const slantRange = Re * (Math.sqrt((((Re + altitudeKm) / Re) ** 2) - Math.cos(elevRad) ** 2) - sinElev)
    const slantRangeM = slantRange * 1000

    const fsplLinear = Math.pow(4 * Math.PI * slantRangeM / lambdaDown, 2)
    const atmLossLinear = Math.pow(10, satcom.atmosphericLoss / 10)
    const rainLossLinear = Math.pow(10, satcom.rainMargin / 10)

    const cOverN0_linear = (satTxPowerW * satGainLin * gsGainLin) /
      (fsplLinear * atmLossLinear * rainLossLinear * K_BOLTZMANN * satcom.gsNoiseTemp)

    const ebN0_req_linear = Math.pow(10, satcom.requiredEbN0 / 10)
    const maxRateBps = cOverN0_linear / ebN0_req_linear
    result.push({ elevation: elevDeg, dataRate: maxRateBps / 1e6 })
  }
  return result
}
