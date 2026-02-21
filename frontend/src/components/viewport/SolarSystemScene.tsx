import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls, Line, Html } from '@react-three/drei'
import { useStore } from '@/stores'
import Starfield from './Starfield'
import {
  generatePlanetOrbitPoints,
  generateEarthOrbitPoints,
  generateInterplanetaryTransferArc,
} from '@/lib/interplanetary'
import { PLANET_DATA } from '@/lib/beyond-leo-constants'

// Scale: 1 unit = 1 AU

export default function SolarSystemScene() {
  const params = useStore((s) => s.beyondLeo.interplanetaryParams)
  const { camera } = useThree()

  const planet = PLANET_DATA[params.targetBody]

  // Earth orbit ring
  const earthOrbitPts = useMemo(() => {
    const pts = generateEarthOrbitPoints()
    return pts.map((p) => [p.x, p.y, p.z] as [number, number, number])
  }, [])

  // Target planet orbit ring
  const targetOrbitPts = useMemo(() => {
    const pts = generatePlanetOrbitPoints(params.targetBody)
    return pts.map((p) => [p.x, p.y, p.z] as [number, number, number])
  }, [params.targetBody])

  // Transfer arc
  const transferPts = useMemo(() => {
    const pts = generateInterplanetaryTransferArc(params.targetBody)
    return pts.map((p) => [p.x, p.y, p.z] as [number, number, number])
  }, [params.targetBody])

  // Earth position dot (at 1 AU on x-axis for simplicity)
  const earthPos: [number, number, number] = [1, 0, 0]

  // Target planet position (at orbit radius on x-axis, opposite side for outer planets)
  const targetPos: [number, number, number] = useMemo(() => {
    // Place target at the end of the transfer arc
    if (transferPts.length > 0) {
      return transferPts[transferPts.length - 1]
    }
    return [planet.semiMajorAxisAU, 0, 0]
  }, [transferPts, planet.semiMajorAxisAU])

  // Camera setup based on target distance
  useMemo(() => {
    const maxR = Math.max(planet.semiMajorAxisAU, 1.5)
    camera.position.set(0, maxR * 1.5, maxR * 0.8)
    camera.lookAt(0, 0, 0)
  }, [params.targetBody])

  // Sun size (visual, not to scale)
  const sunSize = 0.05

  // Planet dot sizes (not to scale, but larger for gas giants)
  const earthDotSize = 0.02
  const targetDotSize = planet.radiusKm > 10000 ? 0.035 : 0.02

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#FDB813" distance={100} />
      <Starfield />

      {/* Sun */}
      <group position={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[sunSize, 32, 32]} />
          <meshBasicMaterial color="#FDB813" />
        </mesh>
        <mesh>
          <sphereGeometry args={[sunSize * 1.5, 32, 32]} />
          <meshBasicMaterial color="#FDB813" transparent opacity={0.15} depthWrite={false} />
        </mesh>
        <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-black/60 text-yellow-400 mt-6 whitespace-nowrap">
            Sun
          </div>
        </Html>
      </group>

      {/* Earth orbit ring */}
      {earthOrbitPts.length > 2 && (
        <Line
          points={earthOrbitPts}
          color="#3B82F6"
          lineWidth={0.8}
          transparent
          opacity={0.4}
        />
      )}

      {/* Earth dot */}
      <group position={earthPos}>
        <mesh>
          <sphereGeometry args={[earthDotSize, 16, 16]} />
          <meshBasicMaterial color="#3B82F6" />
        </mesh>
        <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-black/60 text-blue-400 mt-4 whitespace-nowrap">
            Earth
          </div>
        </Html>
      </group>

      {/* Target planet orbit ring */}
      {targetOrbitPts.length > 2 && (
        <Line
          points={targetOrbitPts}
          color={planet.color}
          lineWidth={0.8}
          transparent
          opacity={0.4}
        />
      )}

      {/* Target planet dot */}
      <group position={targetPos}>
        <mesh>
          <sphereGeometry args={[targetDotSize, 16, 16]} />
          <meshBasicMaterial color={planet.color} />
        </mesh>
        <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-black/60 mt-5 whitespace-nowrap" style={{ color: planet.color }}>
            {planet.name}
          </div>
        </Html>
      </group>

      {/* Transfer arc */}
      {transferPts.length > 2 && (
        <Line
          points={transferPts}
          color="#F59E0B"
          lineWidth={2}
          transparent
          opacity={0.8}
        />
      )}

      <OrbitControls
        enablePan={false}
        enableZoom
        enableRotate
        minDistance={0.5}
        maxDistance={80}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  )
}
