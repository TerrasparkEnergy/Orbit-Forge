export interface GroundStation {
  id: string
  name: string
  lat: number        // degrees
  lon: number        // degrees
  alt: number        // km above sea level
  minElevation: number  // degrees
  active: boolean
}
