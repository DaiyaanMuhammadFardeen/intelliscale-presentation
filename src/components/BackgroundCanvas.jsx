import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useBackgroundMutation } from './BackgroundContext'

const PARTICLE_COUNT = 3000
const SPHERE_RADIUS = 50
const BASE_ROTATION = 0.0002

/* ── Star field particles ── */
function StarField({ opacity }) {
  const pointsRef = useRef()

  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = SPHERE_RADIUS * Math.cbrt(Math.random())
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += BASE_ROTATION
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        color="#676767"
        transparent
        opacity={opacity}
        sizeAttenuation={false}
        depthWrite={false}
      />
    </points>
  )
}

/* ── Torus knot (wireframe, cyan glow) ── */
function TorusKnot({ speed, opacity }) {
  const meshRef = useRef()

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += speed * 0.4
      meshRef.current.rotation.y += speed
    }
  })

  return (
    <mesh ref={meshRef} scale={6} position={[0, 0, -15]}>
      <torusKnotGeometry args={[2, 0.6, 128, 16]} />
      <meshBasicMaterial
        color="var(--neon-cyan)"
        wireframe
        transparent
        opacity={0.6 * opacity}
      />
    </mesh>
  )
}

/* ── Background scene ── */
function BackgroundScene({ torusKnot, torusKnotSpeed, torusKnotOpacity, particleOpacity }) {
  return (
    <>
      <StarField opacity={particleOpacity} />
      {torusKnot && <TorusKnot speed={torusKnotSpeed} opacity={torusKnotOpacity} />}
    </>
  )
}

export default function BackgroundCanvas() {
  const mutation = useBackgroundMutation()

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* 3D Canvas (star field + torus knot) */}
      <Canvas
        camera={{ position: [0, 0, 60], fov: 75 }}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <BackgroundScene
          torusKnot={mutation.torusKnot}
          torusKnotSpeed={mutation.torusKnotSpeed}
          torusKnotOpacity={mutation.torusKnotOpacity}
          particleOpacity={mutation.particleOpacity}
        />
      </Canvas>

      {/* Colored tint overlay (red for tsunami, purple for gpu contention, etc.) */}
      {mutation.tint && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(ellipse at center, rgba(${mutation.tint.r},${mutation.tint.g},${mutation.tint.b},${0.3 * mutation.tint.opacity}) 0%, transparent 70%)`,
            zIndex: 1,
            pointerEvents: 'none',
            transition: 'opacity 0.8s ease',
          }}
        />
      )}
    </div>
  )
}
