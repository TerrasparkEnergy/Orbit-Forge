import { JD_J2000, DAYS_PER_CENTURY } from './constants'

/**
 * Convert a Date to Julian Date
 */
export function dateToJulian(date: Date): number {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate()
  const h = date.getUTCHours()
  const min = date.getUTCMinutes()
  const sec = date.getUTCSeconds()
  const ms = date.getUTCMilliseconds()

  const dayFraction = (h + min / 60 + (sec + ms / 1000) / 3600) / 24

  let yr = y
  let mo = m
  if (mo <= 2) {
    yr -= 1
    mo += 12
  }

  const A = Math.floor(yr / 100)
  const B = 2 - A + Math.floor(A / 4)

  return Math.floor(365.25 * (yr + 4716)) +
    Math.floor(30.6001 * (mo + 1)) +
    d + dayFraction + B - 1524.5
}

/**
 * Convert Julian Date to Date
 */
export function julianToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5)
  const f = jd + 0.5 - z
  let A: number

  if (z < 2299161) {
    A = z
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25)
    A = z + 1 + alpha - Math.floor(alpha / 4)
  }

  const B = A + 1524
  const C = Math.floor((B - 122.1) / 365.25)
  const D = Math.floor(365.25 * C)
  const E = Math.floor((B - D) / 30.6001)

  const day = B - D - Math.floor(30.6001 * E) + f
  const month = E < 14 ? E - 1 : E - 13
  const year = month > 2 ? C - 4716 : C - 4715

  const d = Math.floor(day)
  const dayFrac = day - d
  const hours = Math.floor(dayFrac * 24)
  const minutes = Math.floor((dayFrac * 24 - hours) * 60)
  const seconds = Math.floor(((dayFrac * 24 - hours) * 60 - minutes) * 60)

  return new Date(Date.UTC(year, month - 1, d, hours, minutes, seconds))
}

/**
 * Compute Greenwich Mean Sidereal Time from Date (radians)
 */
export function dateToGMST(date: Date): number {
  const jd = dateToJulian(date)
  const T = (jd - JD_J2000) / DAYS_PER_CENTURY

  // GMST in seconds at 0h UT
  let gmst = 67310.54841 +
    (876600 * 3600 + 8640184.812866) * T +
    0.093104 * T * T -
    6.2e-6 * T * T * T

  // Convert seconds to radians
  gmst = (gmst % 86400) * (2 * Math.PI / 86400)

  // Add rotation for time of day
  const ut1 = (date.getUTCHours() * 3600 +
    date.getUTCMinutes() * 60 +
    date.getUTCSeconds() +
    date.getUTCMilliseconds() / 1000)

  // GMST is already at 0h UT in the formula above for the given JD
  // The formula accounts for the full date including time

  // Normalize to 0-2pi
  while (gmst < 0) gmst += 2 * Math.PI
  while (gmst >= 2 * Math.PI) gmst -= 2 * Math.PI

  return gmst
}

/**
 * Compute Modified Julian Date from Date
 */
export function dateToMJD(date: Date): number {
  return dateToJulian(date) - 2400000.5
}

/**
 * Compute Julian centuries since J2000.0
 */
export function dateToJulianCenturies(date: Date): number {
  return (dateToJulian(date) - JD_J2000) / DAYS_PER_CENTURY
}
