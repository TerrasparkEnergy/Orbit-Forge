import { useMemo } from 'react'
import * as THREE from 'three'

export default function SunLight() {
  const sunPosition = useMemo(() => {
    const now = new Date()
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    )
    const hourAngle = (now.getUTCHours() / 24) * Math.PI * 2
    const declination = -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10)) * (Math.PI / 180)

    const dir = new THREE.Vector3(
      Math.cos(hourAngle) * Math.cos(declination),
      Math.sin(declination),
      -Math.sin(hourAngle) * Math.cos(declination)
    ).normalize()

    return dir.multiplyScalar(20)
  }, [])

  return (
    <>
      <ambientLight intensity={0.06} color="#4466aa" />
      <directionalLight
        position={[sunPosition.x, sunPosition.y, sunPosition.z]}
        intensity={1.8}
        color="#fffff0"
      />
    </>
  )
}
