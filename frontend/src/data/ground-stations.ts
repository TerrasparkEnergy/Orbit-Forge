import type { GroundStation } from '@/types/ground-station'

export const DEFAULT_GROUND_STATIONS: GroundStation[] = [
  { id: 'svalbard', name: 'Svalbard (SvalSat)', lat: 78.23, lon: 15.39, alt: 0.5, minElevation: 5, active: true },
  { id: 'fairbanks', name: 'Fairbanks, AK', lat: 64.86, lon: -147.72, alt: 0.16, minElevation: 5, active: true },
  { id: 'darmstadt', name: 'Darmstadt (ESOC)', lat: 49.87, lon: 8.63, alt: 0.14, minElevation: 5, active: true },
  { id: 'santiago', name: 'Santiago, Chile', lat: -33.45, lon: -70.67, alt: 0.52, minElevation: 5, active: true },
  { id: 'goldstone', name: 'Goldstone (DSN)', lat: 35.43, lon: -116.89, alt: 0.99, minElevation: 5, active: false },
  { id: 'canberra', name: 'Canberra (DSN)', lat: -35.40, lon: 148.98, alt: 0.68, minElevation: 5, active: false },
  { id: 'madrid', name: 'Madrid (DSN)', lat: 40.43, lon: -4.25, alt: 0.83, minElevation: 5, active: false },
  { id: 'tokyo', name: 'Tokyo, Japan', lat: 35.68, lon: 139.77, alt: 0.04, minElevation: 10, active: false },
  { id: 'bangalore', name: 'Bangalore (ISTRAC)', lat: 13.03, lon: 77.57, alt: 0.92, minElevation: 5, active: false },
  { id: 'tromso', name: 'Troms\u00F8, Norway', lat: 69.65, lon: 18.96, alt: 0.10, minElevation: 5, active: false },
  { id: 'mcmurdo', name: 'McMurdo, Antarctica', lat: -77.85, lon: 166.67, alt: 0.02, minElevation: 5, active: false },
  { id: 'hawaii', name: 'Hawaii (AMOS)', lat: 20.71, lon: -156.26, alt: 3.06, minElevation: 5, active: false },
  { id: 'singapore', name: 'Singapore', lat: 1.35, lon: 103.82, alt: 0.01, minElevation: 10, active: false },
  { id: 'redu', name: 'Redu, Belgium', lat: 50.00, lon: 5.15, alt: 0.38, minElevation: 5, active: false },
  { id: 'kiruna', name: 'Kiruna, Sweden', lat: 67.86, lon: 20.22, alt: 0.39, minElevation: 5, active: false },
]
