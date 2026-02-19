import { useRef, useMemo, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

// Day/Night blending shader
const EarthMaterial = shaderMaterial(
  {
    dayTexture: new THREE.Texture(),
    nightTexture: new THREE.Texture(),
    normalMap: new THREE.Texture(),
    specularMap: new THREE.Texture(),
    sunDirection: new THREE.Vector3(1, 0.3, 0.5).normalize(),
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D normalMap;
    uniform sampler2D specularMap;
    uniform vec3 sunDirection;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldNormal;

    void main() {
      vec3 dayColor = texture2D(dayTexture, vUv).rgb;
      vec3 nightColor = texture2D(nightTexture, vUv).rgb;
      float specularIntensity = texture2D(specularMap, vUv).r;

      // Compute sun illumination
      float sunDot = dot(vWorldNormal, normalize(sunDirection));

      // Smooth transition between day and night
      float dayFactor = smoothstep(-0.15, 0.25, sunDot);

      // Boost night lights
      nightColor *= 1.8;

      // Blend day and night
      vec3 color = mix(nightColor, dayColor, dayFactor);

      // Add subtle specular highlight on oceans (day side only)
      vec3 viewDir = normalize(-vPosition);
      vec3 halfVec = normalize(normalize(sunDirection) + viewDir);
      float spec = pow(max(dot(vNormal, halfVec), 0.0), 64.0);
      color += spec * specularIntensity * 0.3 * dayFactor;

      // Slight ambient to prevent pure black on night side
      color = max(color, vec3(0.002));

      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ EarthMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      earthMaterial: any
    }
  }
}

// Procedural fallback if textures aren't available
function createProceduralTexture(color: string, size = 64): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const [texturesLoaded, setTexturesLoaded] = useState(false)

  // Try loading textures, fall back to procedural
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const fallback = {
      day: createProceduralTexture('#1a4d8f', 256),
      night: createProceduralTexture('#020408', 256),
      clouds: createProceduralTexture('#ffffff', 64),
      normal: createProceduralTexture('#8080ff', 64),
      specular: createProceduralTexture('#333333', 64),
    }

    const loaded: typeof fallback = { ...fallback }
    let count = 0
    const total = 5

    const onLoad = () => {
      count++
      if (count === total) setTexturesLoaded(true)
    }
    const onError = () => {
      count++
      if (count === total) setTexturesLoaded(true)
    }

    try {
      loaded.day = loader.load('/textures/earth_daymap_2k.jpg', onLoad, undefined, onError)
      loaded.night = loader.load('/textures/earth_nightmap_2k.jpg', onLoad, undefined, onError)
      loaded.clouds = loader.load('/textures/earth_clouds_2k.jpg', onLoad, undefined, onError)
      loaded.normal = loader.load('/textures/earth_normal_2k.jpg', onLoad, undefined, onError)
      loaded.specular = loader.load('/textures/earth_specular_2k.jpg', onLoad, undefined, onError)
    } catch {
      setTexturesLoaded(true)
    }

    // Set texture properties
    Object.values(loaded).forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
    })

    return loaded
  }, [])

  // Compute sun direction from current date
  const sunDir = useMemo(() => {
    const now = new Date()
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    )
    const hourAngle = (now.getUTCHours() / 24) * Math.PI * 2
    const declination = -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10)) * (Math.PI / 180)

    return new THREE.Vector3(
      Math.cos(hourAngle) * Math.cos(declination),
      Math.sin(declination),
      -Math.sin(hourAngle) * Math.cos(declination)
    ).normalize()
  }, [])

  // Rotate clouds slowly
  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.005
    }
  })

  return (
    <group>
      {/* Main Earth sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <earthMaterial
          dayTexture={textures.day}
          nightTexture={textures.night}
          normalMap={textures.normal}
          specularMap={textures.specular}
          sunDirection={sunDir}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef} scale={[1.003, 1.003, 1.003]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          map={textures.clouds}
          transparent
          opacity={0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
