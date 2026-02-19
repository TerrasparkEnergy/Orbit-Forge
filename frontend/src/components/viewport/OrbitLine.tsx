import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { useStore } from '@/stores'

export default function OrbitLine() {
  const orbitPositions = useStore((s) => s.orbitPositions)

  const points = useMemo(() => {
    if (orbitPositions.length === 0) return []
    return orbitPositions.map((p) => [p.x, p.y, p.z] as [number, number, number])
  }, [orbitPositions])

  if (points.length < 2) return null

  return (
    <Line
      points={points}
      color="#3B82F6"
      lineWidth={1.5}
      transparent
      opacity={0.8}
    />
  )
}
