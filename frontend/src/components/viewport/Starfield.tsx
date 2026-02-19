import { useRef, useMemo } from 'react'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

export default function Starfield() {
  const ref = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const count = 6000
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 50 + Math.random() * 50
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.08}
        sizeAttenuation
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  )
}
