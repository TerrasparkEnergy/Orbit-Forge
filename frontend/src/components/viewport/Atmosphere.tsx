import { useRef } from 'react'
import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'

const AtmosphereMaterial = shaderMaterial(
  {
    sunDirection: new THREE.Vector3(1, 0, 0),
  },
  // Vertex shader
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 sunDirection;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 viewDir = normalize(-vPosition);
      float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
      rim = pow(rim, 3.0);

      // Blue-cyan atmosphere color
      vec3 atmosColor = mix(
        vec3(0.1, 0.4, 1.0),
        vec3(0.3, 0.7, 1.0),
        rim
      );

      float alpha = rim * 0.6;
      gl_FragColor = vec4(atmosColor, alpha);
    }
  `
)

extend({ AtmosphereMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      atmosphereMaterial: any
    }
  }
}

export default function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <mesh ref={meshRef} scale={[1.025, 1.025, 1.025]}>
      <sphereGeometry args={[1, 32, 32]} />
      <atmosphereMaterial
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
