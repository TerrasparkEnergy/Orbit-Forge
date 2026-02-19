import { DEG2RAD, RAD2DEG, R_EARTH_EQUATORIAL, MU_EARTH_KM, SEC_PER_DAY } from './constants'
import { OrbitalElements, keplerianToCartesian, eciToEcef, ecefToGeodetic, geodeticToEcef } from './coordinate-transforms'
import { computeOrbitalPeriod, solveKeplerEquation, eccentricToTrueAnomaly, trueToMeanAnomaly, computeJ2RAANDrift, computeJ2ArgPerigeeDrift } from './orbital-mechanics'
import { dateToGMST } from './time-utils'
import type { GroundStation } from '@/types/ground-station'

export interface SatellitePass {
  station: string
  stationId: string
  aos: Date          // Acquisition of signal
  los: Date          // Loss of signal
  tca: Date          // Time of closest approach (max elevation)
  maxElevation: number  // degrees
  aosAzimuth: number    // degrees
  losAzimuth: number    // degrees
  durationSec: number
  quality: 'A' | 'B' | 'C' | 'D'
}

/**
 * Compute satellite ECI position at a given time offset from epoch
 */
function getPositionAtTime(
  elements: OrbitalElements,
  epoch: Date,
  dtSec: number,
): { x: number; y: number; z: number } {
  const n = Math.sqrt(MU_EARTH_KM / Math.pow(elements.semiMajorAxis, 3)) // rad/s

  // J2 secular drifts
  const raanDriftDeg = computeJ2RAANDrift(elements.semiMajorAxis, elements.eccentricity, elements.inclination)
  const omegaDriftDeg = computeJ2ArgPerigeeDrift(elements.semiMajorAxis, elements.eccentricity, elements.inclination)

  // Initial mean anomaly from true anomaly
  const nu0 = elements.trueAnomaly * DEG2RAD
  const E0 = 2 * Math.atan2(
    Math.sqrt(1 - elements.eccentricity) * Math.sin(nu0 / 2),
    Math.sqrt(1 + elements.eccentricity) * Math.cos(nu0 / 2)
  )
  const M0 = E0 - elements.eccentricity * Math.sin(E0)

  // Propagate
  const M = M0 + n * dtSec
  const E = solveKeplerEquation(M % (2 * Math.PI), elements.eccentricity)
  const nu = eccentricToTrueAnomaly(E, elements.eccentricity)

  const currentElements: OrbitalElements = {
    ...elements,
    raan: elements.raan + (raanDriftDeg / SEC_PER_DAY) * dtSec,
    argOfPerigee: elements.argOfPerigee + (omegaDriftDeg / SEC_PER_DAY) * dtSec,
    trueAnomaly: nu * RAD2DEG,
  }

  const { position } = keplerianToCartesian(currentElements, MU_EARTH_KM)
  return position
}

/**
 * Compute elevation angle of satellite as seen from ground station
 */
function computeElevation(
  satEci: { x: number; y: number; z: number },
  stationLat: number,
  stationLon: number,
  stationAlt: number,
  gmst: number,
): { elevation: number; azimuth: number } {
  // Station position in ECEF
  const stationEcef = geodeticToEcef({ lat: stationLat, lon: stationLon, alt: stationAlt })

  // Satellite in ECEF
  const satEcef = eciToEcef(satEci, gmst)

  // Range vector in ECEF
  const dx = satEcef.x - stationEcef.x
  const dy = satEcef.y - stationEcef.y
  const dz = satEcef.z - stationEcef.z

  // Convert to topocentric (SEZ: South-East-Zenith)
  const latRad = stationLat * DEG2RAD
  const lonRad = stationLon * DEG2RAD

  const sinLat = Math.sin(latRad)
  const cosLat = Math.cos(latRad)
  const sinLon = Math.sin(lonRad)
  const cosLon = Math.cos(lonRad)

  const south = sinLat * cosLon * dx + sinLat * sinLon * dy - cosLat * dz
  const east = -sinLon * dx + cosLon * dy
  const zenith = cosLat * cosLon * dx + cosLat * sinLon * dy + sinLat * dz

  const range = Math.sqrt(south * south + east * east + zenith * zenith)
  const elevation = Math.asin(zenith / range) * RAD2DEG
  const azimuth = ((Math.atan2(east, -south) * RAD2DEG) + 360) % 360

  return { elevation, azimuth }
}

/**
 * Predict satellite passes over ground stations
 */
export function predictPasses(
  elements: OrbitalElements,
  epoch: Date,
  stations: GroundStation[],
  durationDays: number,
  stepSec = 30,
): SatellitePass[] {
  const passes: SatellitePass[] = []
  const totalSec = durationDays * SEC_PER_DAY
  const activeStations = stations.filter((s) => s.active)

  if (activeStations.length === 0) return passes

  // For each station, track when satellite is above minimum elevation
  for (const station of activeStations) {
    let inPass = false
    let passStart = 0
    let passStartAz = 0
    let maxEl = 0
    let maxElTime = 0
    let lastAz = 0

    for (let t = 0; t <= totalSec; t += stepSec) {
      const satEci = getPositionAtTime(elements, epoch, t)
      const currentDate = new Date(epoch.getTime() + t * 1000)
      const gmst = dateToGMST(currentDate)
      const { elevation, azimuth } = computeElevation(
        satEci, station.lat, station.lon, station.alt || 0, gmst
      )

      if (elevation >= station.minElevation) {
        if (!inPass) {
          // Pass begins
          inPass = true
          passStart = t
          passStartAz = azimuth
          maxEl = elevation
          maxElTime = t
        }
        if (elevation > maxEl) {
          maxEl = elevation
          maxElTime = t
        }
        lastAz = azimuth
      } else if (inPass) {
        // Pass ends
        inPass = false
        const durationSec = t - passStart

        // Only record passes > 1 minute
        if (durationSec >= 60) {
          const quality: 'A' | 'B' | 'C' | 'D' =
            maxEl >= 60 ? 'A' :
            maxEl >= 30 ? 'B' :
            maxEl >= 10 ? 'C' : 'D'

          passes.push({
            station: station.name,
            stationId: station.id,
            aos: new Date(epoch.getTime() + passStart * 1000),
            los: new Date(epoch.getTime() + t * 1000),
            tca: new Date(epoch.getTime() + maxElTime * 1000),
            maxElevation: maxEl,
            aosAzimuth: passStartAz,
            losAzimuth: lastAz,
            durationSec,
            quality,
          })
        }
      }
    }
  }

  // Sort by AOS time
  passes.sort((a, b) => a.aos.getTime() - b.aos.getTime())
  return passes
}

/**
 * Compute pass communication metrics
 */
export interface PassCommsMetrics {
  totalPassesPerDay: number
  avgPassDurationMin: number
  maxGapHours: number
  dailyContactMin: number
  dailyDataMB: number
}

export function computePassMetrics(
  passes: SatellitePass[],
  durationDays: number,
  dataRateKbps: number,
): PassCommsMetrics {
  if (passes.length === 0) {
    return {
      totalPassesPerDay: 0,
      avgPassDurationMin: 0,
      maxGapHours: durationDays * 24,
      dailyContactMin: 0,
      dailyDataMB: 0,
    }
  }

  const totalPassesPerDay = passes.length / Math.max(1, durationDays)
  const avgPassDurationMin = passes.reduce((s, p) => s + p.durationSec, 0) / passes.length / 60

  // Max gap between consecutive passes
  let maxGapSec = 0
  for (let i = 1; i < passes.length; i++) {
    const gap = passes[i].aos.getTime() - passes[i - 1].los.getTime()
    maxGapSec = Math.max(maxGapSec, gap / 1000)
  }

  const dailyContactSec = passes.reduce((s, p) => s + p.durationSec, 0) / Math.max(1, durationDays)

  // Data throughput: rate * contact time * link efficiency (~70%)
  const linkEfficiency = 0.7
  const dailyDataBits = dataRateKbps * 1000 * dailyContactSec * linkEfficiency
  const dailyDataMB = dailyDataBits / 8 / 1024 / 1024

  return {
    totalPassesPerDay,
    avgPassDurationMin,
    maxGapHours: maxGapSec / 3600,
    dailyContactMin: dailyContactSec / 60,
    dailyDataMB,
  }
}
