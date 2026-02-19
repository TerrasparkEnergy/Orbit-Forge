// Gravitational parameter of Earth (m^3/s^2)
export const MU_EARTH = 3.986004418e14

// Gravitational parameter of Earth (km^3/s^2)
export const MU_EARTH_KM = 3.986004418e5

// Mean equatorial radius of Earth (km)
export const R_EARTH = 6371.0

// Equatorial radius of Earth (km)
export const R_EARTH_EQUATORIAL = 6378.137

// J2 zonal harmonic coefficient
export const J2 = 1.08262668e-3

// Earth rotation rate (rad/s)
export const OMEGA_EARTH = 7.2921159e-5

// Solar flux at 1 AU (W/m^2)
export const SOLAR_FLUX = 1361.0

// Speed of light (m/s)
export const C_LIGHT = 299792458.0

// Boltzmann constant (J/K)
export const K_BOLTZMANN = 1.380649e-23

// Degrees to radians
export const DEG2RAD = Math.PI / 180.0

// Radians to degrees
export const RAD2DEG = 180.0 / Math.PI

// Seconds per day
export const SEC_PER_DAY = 86400.0

// Julian Date of J2000.0 epoch
export const JD_J2000 = 2451545.0

// Days per Julian century
export const DAYS_PER_CENTURY = 36525.0

// Atmospheric scale heights (km) at reference altitudes
export const ATMOSPHERE_TABLE: Array<{ altMin: number; altMax: number; rho0: number; H: number }> = [
  { altMin: 0, altMax: 25, rho0: 1.225, H: 7.249 },
  { altMin: 25, altMax: 30, rho0: 3.899e-2, H: 6.349 },
  { altMin: 30, altMax: 40, rho0: 1.774e-2, H: 6.682 },
  { altMin: 40, altMax: 50, rho0: 3.972e-3, H: 7.554 },
  { altMin: 50, altMax: 60, rho0: 1.057e-3, H: 8.382 },
  { altMin: 60, altMax: 70, rho0: 3.206e-4, H: 7.714 },
  { altMin: 70, altMax: 80, rho0: 8.770e-5, H: 6.549 },
  { altMin: 80, altMax: 90, rho0: 1.905e-5, H: 5.799 },
  { altMin: 90, altMax: 100, rho0: 3.396e-6, H: 5.382 },
  { altMin: 100, altMax: 110, rho0: 5.297e-7, H: 5.877 },
  { altMin: 110, altMax: 120, rho0: 9.661e-8, H: 7.263 },
  { altMin: 120, altMax: 130, rho0: 2.438e-8, H: 9.473 },
  { altMin: 130, altMax: 140, rho0: 8.484e-9, H: 12.636 },
  { altMin: 140, altMax: 150, rho0: 3.845e-9, H: 16.149 },
  { altMin: 150, altMax: 180, rho0: 2.070e-9, H: 22.523 },
  { altMin: 180, altMax: 200, rho0: 5.464e-10, H: 29.740 },
  { altMin: 200, altMax: 250, rho0: 2.789e-10, H: 37.105 },
  { altMin: 250, altMax: 300, rho0: 7.248e-11, H: 45.546 },
  { altMin: 300, altMax: 350, rho0: 2.418e-11, H: 53.628 },
  { altMin: 350, altMax: 400, rho0: 9.158e-12, H: 53.298 },
  { altMin: 400, altMax: 450, rho0: 3.725e-12, H: 58.515 },
  { altMin: 450, altMax: 500, rho0: 1.585e-12, H: 60.828 },
  { altMin: 500, altMax: 600, rho0: 6.967e-13, H: 63.822 },
  { altMin: 600, altMax: 700, rho0: 1.454e-13, H: 71.835 },
  { altMin: 700, altMax: 800, rho0: 3.614e-14, H: 88.667 },
  { altMin: 800, altMax: 900, rho0: 1.170e-14, H: 124.64 },
  { altMin: 900, altMax: 1000, rho0: 5.245e-15, H: 181.05 },
]

// Get atmospheric density at altitude (kg/m^3)
export function getAtmosphericDensity(altitudeKm: number): number {
  if (altitudeKm < 0) return 1.225
  if (altitudeKm > 1000) return 3.019e-15

  const entry = ATMOSPHERE_TABLE.find(
    (e) => altitudeKm >= e.altMin && altitudeKm < e.altMax
  )
  if (!entry) return 0

  return entry.rho0 * Math.exp(-(altitudeKm - entry.altMin) / entry.H)
}
