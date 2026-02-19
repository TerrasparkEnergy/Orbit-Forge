/**
 * Format distance with appropriate unit
 */
export function formatDistance(km: number, precision = 1): string {
  if (Math.abs(km) < 1) {
    return `${(km * 1000).toFixed(precision)} m`
  }
  if (Math.abs(km) >= 1e6) {
    return `${(km / 1e6).toFixed(precision)} Mkm`
  }
  return `${km.toFixed(precision)} km`
}

/**
 * Format velocity
 */
export function formatVelocity(kms: number, precision = 3): string {
  return `${kms.toFixed(precision)} km/s`
}

/**
 * Format period from seconds to human readable
 */
export function formatPeriod(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)} s`

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours === 0) {
    return `${minutes}m ${secs}s`
  }
  return `${hours}h ${minutes}m ${secs}s`
}

/**
 * Format period in minutes
 */
export function formatPeriodMinutes(seconds: number, precision = 1): string {
  return `${(seconds / 60).toFixed(precision)} min`
}

/**
 * Format angle in degrees
 */
export function formatAngle(degrees: number, precision = 4): string {
  return `${degrees.toFixed(precision)}\u00B0`
}

/**
 * Format percentage
 */
export function formatPercent(value: number, precision = 1): string {
  return `${value.toFixed(precision)}%`
}

/**
 * Format power in watts
 */
export function formatPower(watts: number, precision = 2): string {
  if (Math.abs(watts) < 0.001) return `${(watts * 1e6).toFixed(precision)} \u00B5W`
  if (Math.abs(watts) < 1) return `${(watts * 1000).toFixed(precision)} mW`
  if (Math.abs(watts) >= 1000) return `${(watts / 1000).toFixed(precision)} kW`
  return `${watts.toFixed(precision)} W`
}

/**
 * Format mass in kg
 */
export function formatMass(kg: number, precision = 2): string {
  if (kg < 1) return `${(kg * 1000).toFixed(precision)} g`
  return `${kg.toFixed(precision)} kg`
}

/**
 * Format rate (deg/day)
 */
export function formatRate(degPerDay: number, precision = 4): string {
  return `${degPerDay.toFixed(precision)} \u00B0/day`
}

/**
 * Format revolutions per day
 */
export function formatRevsPerDay(value: number, precision = 2): string {
  return `${value.toFixed(precision)} rev/day`
}
