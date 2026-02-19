import { DEG2RAD } from './constants'
import { dateToJulianCenturies } from './time-utils'
import type { Vec3 } from '@/types'

/**
 * Compute approximate Sun position in ECI coordinates
 * Uses simplified solar ephemeris from the Astronomical Almanac
 * Accurate to ~1 degree
 * Returns position as unit vector (direction only)
 */
export function computeSunDirectionECI(date: Date): Vec3 {
  const T = dateToJulianCenturies(date)

  // Mean longitude of Sun (degrees)
  const L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360

  // Mean anomaly of Sun (degrees)
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360
  const Mrad = M * DEG2RAD

  // Equation of center (degrees)
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
    + 0.000289 * Math.sin(3 * Mrad)

  // Sun's true longitude (degrees)
  const sunLon = (L0 + C) * DEG2RAD

  // Obliquity of ecliptic (degrees)
  const obliquity = (23.439291 - 0.0130042 * T) * DEG2RAD

  // Sun direction in ECI (unit vector)
  const x = Math.cos(sunLon)
  const y = Math.cos(obliquity) * Math.sin(sunLon)
  const z = Math.sin(obliquity) * Math.sin(sunLon)

  return { x, y, z }
}

/**
 * Get Sun direction in Three.js coordinate system
 */
export function computeSunDirectionThreeJS(date: Date): Vec3 {
  const eci = computeSunDirectionECI(date)
  return {
    x: eci.x,
    y: eci.z,
    z: -eci.y,
  }
}
