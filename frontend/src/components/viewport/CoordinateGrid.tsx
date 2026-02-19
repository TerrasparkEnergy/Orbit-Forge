import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { DEG2RAD } from '@/lib/constants'

const GRID_RADIUS = 1.001
const GRID_STEP = 30
const POINTS_PER_LINE = 90

export default function CoordinateGrid() {
  const lines = useMemo(() => {
    const result: Array<{
      points: [number, number, number][]
      isEquator: boolean
    }> = []

    // Latitude lines
    for (let lat = -90 + GRID_STEP; lat < 90; lat += GRID_STEP) {
      const isEquator = lat === 0
      const points: [number, number, number][] = []
      const latRad = lat * DEG2RAD

      for (let j = 0; j <= POINTS_PER_LINE; j++) {
        const lon = (j / POINTS_PER_LINE) * 360 * DEG2RAD
        points.push([
          GRID_RADIUS * Math.cos(latRad) * Math.cos(lon),
          GRID_RADIUS * Math.sin(latRad),
          -GRID_RADIUS * Math.cos(latRad) * Math.sin(lon),
        ])
      }

      result.push({ points, isEquator })
    }

    // Longitude lines
    for (let lon = 0; lon < 360; lon += GRID_STEP) {
      const points: [number, number, number][] = []
      const lonRad = lon * DEG2RAD

      for (let j = 0; j <= POINTS_PER_LINE; j++) {
        const lat = ((j / POINTS_PER_LINE) * 180 - 90) * DEG2RAD
        points.push([
          GRID_RADIUS * Math.cos(lat) * Math.cos(lonRad),
          GRID_RADIUS * Math.sin(lat),
          -GRID_RADIUS * Math.cos(lat) * Math.sin(lonRad),
        ])
      }

      result.push({ points, isEquator: false })
    }

    return result
  }, [])

  return (
    <group>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color={line.isEquator ? '#3B82F6' : '#ffffff'}
          lineWidth={line.isEquator ? 0.8 : 0.3}
          transparent
          opacity={line.isEquator ? 0.15 : 0.05}
        />
      ))}
    </group>
  )
}
