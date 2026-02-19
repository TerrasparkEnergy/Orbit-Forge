export interface OrbitalElements {
  semiMajorAxis: number    // km
  eccentricity: number     // dimensionless (0-1)
  inclination: number      // degrees (0-180)
  raan: number             // Right Ascension of Ascending Node, degrees (0-360)
  argOfPerigee: number     // degrees (0-360)
  trueAnomaly: number      // degrees (0-360)
}

export interface DerivedOrbitalParams {
  period: number             // seconds
  periapsisAlt: number       // km above surface
  apoapsisAlt: number        // km above surface
  velocityPerigee: number    // km/s
  velocityApogee: number     // km/s
  raanDrift: number          // deg/day (J2 secular)
  argPerigeeDrift: number    // deg/day (J2 secular)
  revsPerDay: number
  eclipseFraction: number    // 0-1
  avgEclipseDuration: number // seconds
  maxEclipseDuration: number // seconds
  isSunSync: boolean
  sunSyncLTAN: string
}

export type OrbitType = 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'SSO'

export function classifyOrbit(altKm: number, ecc: number, incDeg: number, raanDrift: number): OrbitType {
  if (ecc > 0.25) return 'HEO'
  const targetSSD = 360.0 / 365.25
  if (Math.abs(raanDrift - targetSSD) < 0.05) return 'SSO'
  if (altKm > 34000 && altKm < 37000 && incDeg < 5) return 'GEO'
  if (altKm > 2000 && altKm < 35786) return 'MEO'
  return 'LEO'
}

// Orbit presets
export const ORBIT_PRESETS: Record<string, { label: string; elements: OrbitalElements }> = {
  iss: {
    label: 'ISS (LEO)',
    elements: {
      semiMajorAxis: 6778,
      eccentricity: 0.0001,
      inclination: 51.6,
      raan: 0,
      argOfPerigee: 0,
      trueAnomaly: 0,
    },
  },
  landsat: {
    label: 'Landsat (SSO)',
    elements: {
      semiMajorAxis: 7083.14,
      eccentricity: 0.001,
      inclination: 98.2,
      raan: 0,
      argOfPerigee: 0,
      trueAnomaly: 0,
    },
  },
  sentinel: {
    label: 'Sentinel (SSO)',
    elements: {
      semiMajorAxis: 7071.14,
      eccentricity: 0.001,
      inclination: 98.18,
      raan: 0,
      argOfPerigee: 0,
      trueAnomaly: 0,
    },
  },
  starlink: {
    label: 'Starlink',
    elements: {
      semiMajorAxis: 6928,
      eccentricity: 0.0001,
      inclination: 53,
      raan: 0,
      argOfPerigee: 0,
      trueAnomaly: 0,
    },
  },
  gps: {
    label: 'GPS (MEO)',
    elements: {
      semiMajorAxis: 26560,
      eccentricity: 0.01,
      inclination: 55,
      raan: 0,
      argOfPerigee: 0,
      trueAnomaly: 0,
    },
  },
  geo: {
    label: 'GEO',
    elements: {
      semiMajorAxis: 42164,
      eccentricity: 0.0,
      inclination: 0,
      raan: 0,
      argOfPerigee: 0,
      trueAnomaly: 0,
    },
  },
  molniya: {
    label: 'Molniya (HEO)',
    elements: {
      semiMajorAxis: 26600,
      eccentricity: 0.74,
      inclination: 63.4,
      raan: 0,
      argOfPerigee: 270,
      trueAnomaly: 0,
    },
  },
}
