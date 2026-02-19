import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import EarthScene from '@/components/viewport/EarthScene'

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
        <span className="text-xs font-mono text-[var(--text-tertiary)]">Loading viewport...</span>
      </div>
    </div>
  )
}

export default function CenterViewport() {
  return (
    <div className="relative flex-1 bg-space-900 overflow-hidden">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0.8, 3], fov: 45, near: 0.01, far: 200 }}
          dpr={[1, 1.5]}
          frameloop="always"
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            toneMapping: ACESFilmicToneMapping,
            outputColorSpace: SRGBColorSpace,
          }}
          style={{ background: '#0A0E17' }}
        >
          <EarthScene />
        </Canvas>
      </Suspense>
    </div>
  )
}
