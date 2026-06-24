import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useBackgroundMutation } from '../components/BackgroundContext'

/* ──────────────────────────── CSS Keyframes ──────────────────────────── */

const STYLES = `
  @keyframes galaxyGlow {
    0%, 100% { opacity: 0.7; filter: brightness(1); }
    50%      { opacity: 1; filter: brightness(1.3); }
  }

  @keyframes beamPulse {
    0%, 100% { opacity: 0.4; }
    50%      { opacity: 0.9; }
  }

  @keyframes typewriterCursor {
    0%, 100% { border-right-color: var(--neon-gold); }
    50%      { border-right-color: transparent; }
  }

  @keyframes flashIn {
    0%   { opacity: 0; }
    50%  { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes neuralPulse {
    0%, 100% { stroke-dashoffset: 0; }
    50%      { stroke-dashoffset: 20; }
  }
`

/* ──────────────────────────── Cluster Positions (3D) ──────────────────────────── */

const CLUSTER_POSITIONS = [
  new THREE.Vector3(-12, 4, 0),    // E-Commerce (northeast)
  new THREE.Vector3(10, -5, 2),    // University (southwest)
  new THREE.Vector3(-8, -3, -2),   // FinTech (northwest)
  new THREE.Vector3(11, 5, 1),     // Real-Time (southeast)
]

const CLUSTER_COLORS = ['#d97706', '#7c3aed', '#0891b2', '#16a34a']
const CLUSTER_UI_COLORS = ['var(--neon-gold)', 'var(--neon-purple)', 'var(--neon-cyan)', 'var(--neon-green)']
const CLUSTER_UI_COLORS_RGB = ['var(--neon-gold-rgb)', 'var(--neon-purple-rgb)', 'var(--neon-cyan-rgb)', 'var(--neon-green-rgb)']

const CLUSTER_LABELS = [
  'E-Commerce Platform',
  'University AI Research',
  'FinTech Fraud Detection',
  'Real-Time Inference',
]

const CLUSTER_QUADRANT = [
  { top: '12%', right: '8%', bottom: 'auto', left: 'auto' },
  { top: 'auto', right: 'auto', bottom: '12%', left: '8%' },
  { top: '12%', right: 'auto', bottom: 'auto', left: '8%' },
  { top: 'auto', right: '8%', bottom: '12%', left: 'auto' },
]

const USE_CASE_CARDS = [
  {
    text: 'Flash sale? IntelliScale pre-scales all services 5 min before. Zero error rate.',
    color: 'var(--neon-gold)',
    border: 'rgba(var(--neon-gold-rgb), 0.3)',
  },
  {
    text: 'Overnight idle GPUs? IntelliScale coordinates training job schedules to maximise utilisation.',
    color: 'var(--neon-purple)',
    border: 'rgba(var(--neon-purple-rgb), 0.3)',
  },
  {
    text: 'Fraud detection inference? Pre-scaled before market opens every morning.',
    color: 'var(--neon-cyan)',
    border: 'rgba(var(--neon-cyan-rgb), 0.3)',
  },
  {
    text: 'Traffic spike? Pre-placed inference pods. P99 latency unchanged.',
    color: 'var(--neon-green)',
    border: 'rgba(var(--neon-green-rgb), 0.3)',
  },
]

const BEAM_LABELS = ['Forecast distributed', 'Schedules optimized', 'Costs minimized', 'Inference pre-placed']

const ROADMAP_ITEMS = [
  '→ Node-level forecasting',
  '→ Reinforcement learning scheduler',
  '→ Multi-cluster federation',
]

/* ──────────────────────────── 3D: Cluster Point Cloud ──────────────────────────── */

function Cluster({ position, color, count = 80, pulsate = false, baseOpacity = 0.9 }) {
  const ref = useRef()
  const matRef = useRef()
  const timeRef = useRef(0)

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 5 * Math.cbrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [count])

  useFrame((state, delta) => {
    timeRef.current += delta
    if (ref.current) {
      ref.current.rotation.y += 0.002
    }
    if (pulsate && matRef.current) {
      const t = timeRef.current
      matRef.current.size = 0.8 + Math.sin(t * 2 + position[0]) * 0.3
      matRef.current.opacity = baseOpacity + Math.sin(t * 1.5 + position[1]) * 0.15
    }
  })

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.8}
        color={color}
        transparent
        opacity={baseOpacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/* ──────────────────────────── 3D: Central Brain Cluster ──────────────────────────── */

function BrainCluster({ visible, exploding }) {
  const ref = useRef()
  const matRef = useRef()
  const [scale, setScale] = useState(1)
  const timeRef = useRef(0)

  const positions = useMemo(() => {
    const count = 120
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 4 * Math.cbrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  useFrame((state, delta) => {
    timeRef.current += delta
    if (ref.current) {
      ref.current.rotation.y += 0.003
    }
    if (matRef.current) {
      const t = timeRef.current
      matRef.current.size = 1.2 + Math.sin(t * 3) * 0.4
      matRef.current.opacity = 0.8 + Math.sin(t * 2) * 0.2
    }
    if (exploding) {
      setScale((s) => Math.min(s + 0.08, 3))
    }
  })

  if (!visible) return null

  return (
    <points ref={ref} scale={scale}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={120}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={1.2}
        color="#d97706"
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/* ──────────────────────────── 3D: Intelligence Beams ──────────────────────────── */

function Beam({ start, end, color = '#d97706', visible }) {
  const ref = useRef()
  const particleRef = useRef()
  const timeRef = useRef(0)

  const positions = useMemo(() => {
    return new Float32Array([...start, ...end])
  }, [start, end])

  useFrame((state, delta) => {
    if (!visible || !particleRef.current) return
    timeRef.current += delta
    const t = timeRef.current
    const progress = (t * 0.3) % 1
    const s = new THREE.Vector3(...start)
    const e = new THREE.Vector3(...end)
    const pos = s.clone().lerp(e, progress)
    particleRef.current.position.copy(pos)
  })

  if (!visible) return null

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </line>
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

/* ──────────────────────────── 3D: Galaxy Camera Controller ──────────────────────────── */

function GalaxyControls({ step }) {
  const controlsRef = useRef()

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={false}
      autoRotate
      autoRotateSpeed={0.3}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={(3 * Math.PI) / 4}
    />
  )
}

/* ──────────────────────────── 3D: Galaxy Scene ──────────────────────────── */

function GalaxyScene3D({ step, contractToCenter }) {
  const groupRef = useRef()
  const targetPositions = useMemo(() => {
    return CLUSTER_POSITIONS.map((p) => p.clone())
  }, [])

  useFrame(() => {
    if (groupRef.current && contractToCenter) {
      groupRef.current.children.forEach((child, i) => {
        if (child.isPoints && child !== groupRef.current.children[0]) {
          const target = new THREE.Vector3(0, 0, 0)
          child.position.lerp(target, 0.008)
        }
      })
    }
  })

  const showPulsate = step >= 1
  const showBeams = step >= 2
  const showBrain = step >= 0
  const brainExploding = step === 4
  const brainHidden = step >= 4

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 10]} intensity={1} color="#d97706" />

      <GalaxyControls step={step} />

      <group ref={groupRef}>
        {/* Central brain cluster */}
        <BrainCluster
          visible={showBrain && !brainHidden}
          exploding={brainExploding}
        />

        {/* Four outer clusters */}
        {CLUSTER_POSITIONS.map((pos, i) => (
          <Cluster
            key={i}
            position={[pos.x, pos.y, pos.z]}
            color={CLUSTER_COLORS[i]}
            count={70}
            pulsate={showPulsate}
          />
        ))}

        {/* Intelligence beams */}
        {showBeams && CLUSTER_POSITIONS.map((pos, i) => (
          <Beam
            key={`beam-${i}`}
            start={[0, 0, 0]}
            end={[pos.x, pos.y, pos.z]}
            color={CLUSTER_COLORS[i]}
            visible={showBeams && !brainHidden}
          />
        ))}
      </group>
    </>
  )
}

/* ──────────────────────────── UI Overlay: Typewriter Text ──────────────────────────── */

function TypewriterText({ text, active, style = {} }) {
  const [displayed, setDisplayed] = useState('')
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!active) {
      setDisplayed('')
      return
    }
    let i = 0
    setDisplayed('')
    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(intervalRef.current)
      }
    }, 50)
    return () => clearInterval(intervalRef.current)
  }, [active, text])

  if (!active && !displayed) return null

  return (
    <span
      style={{
        borderRight: '2px solid var(--neon-gold)',
        animation: 'typewriterCursor 0.8s step-end infinite',
        paddingRight: 4,
        ...style,
      }}
    >
      {displayed}
    </span>
  )
}

/* ──────────────────────────── UI Overlay: Glass Card ──────────────────────────── */

function GlassCard({ children, color, borderColor, style = {} }) {
  return (
    <div
      style={{
        background: 'rgba(var(--black-rgb),0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: '10px 14px',
        color: color,
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(0.55rem, 0.85vw, 0.72rem)',
        lineHeight: 1.5,
        maxWidth: 220,
        boxShadow: `0 0 12px ${borderColor}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ──────────────────────────── UI Overlay: Neural Network SVG ──────────────────────────── */

function NeuralNetworkSVG() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 20 }}
    >
      {/* Nodes */}
      {[
        { cx: 100, cy: 40, r: 6 },
        { cx: 50, cy: 100, r: 5 },
        { cx: 150, cy: 100, r: 5 },
        { cx: 100, cy: 160, r: 6 },
        { cx: 30, cy: 60, r: 4 },
        { cx: 170, cy: 60, r: 4 },
        { cx: 30, cy: 140, r: 4 },
        { cx: 170, cy: 140, r: 4 },
      ].map((node, i) => (
        <circle
          key={i}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill="var(--neon-gold)"
          opacity={0.8}
        >
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur={`${1.5 + i * 0.2}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values={`${node.r};${node.r + 2};${node.r}`}
            dur={`${1.5 + i * 0.2}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Connections */}
      {[
        [100, 40, 50, 100],
        [100, 40, 150, 100],
        [50, 100, 100, 160],
        [150, 100, 100, 160],
        [30, 60, 50, 100],
        [170, 60, 150, 100],
        [30, 140, 50, 100],
        [170, 140, 150, 100],
        [100, 40, 30, 60],
        [100, 40, 170, 60],
        [50, 100, 30, 140],
        [150, 100, 170, 140],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={`line-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="var(--neon-gold)"
          strokeWidth={1}
          opacity={0.3}
          strokeDasharray="4 4"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;20"
            dur={`${2 + i * 0.15}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;0.6;0.2"
            dur={`${2 + i * 0.15}s`}
            repeatCount="indefinite"
          />
        </line>
      ))}
    </svg>
  )
}

/* ──────────────────────────── Main Scene ──────────────────────────── */

export default function GalaxyScene({ step }) {
  const { mutate } = useBackgroundMutation()
  const [flashVisible, setFlashVisible] = useState(false)

  // Dim background star field while galaxy is active, restore on unmount
  useEffect(() => {
    mutate({ particleOpacity: 0 })
    return () => {
      mutate({ particleOpacity: 0.8 })
    }
  }, [mutate])

  // Flash effect at step 5
  useEffect(() => {
    if (step === 5) {
      setFlashVisible(true)
      const t1 = setTimeout(() => setFlashVisible(false), 100)
      const t2 = setTimeout(() => {
        setFlashVisible(true)
        setTimeout(() => setFlashVisible(false), 100)
      }, 200)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [step])

  const showLabels = step >= 1
  const showBeams = step >= 2
  const showUseCases = step >= 3
  const showNeural = step >= 4
  const showRoadmap = step >= 4
  const showTypewriter = step >= 5
  const showGalaxy = step >= 0

  return (
    <div
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      <style>{STYLES}</style>

      {/* ── Three.js Galaxy Canvas ── */}
      {showGalaxy && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 5,
            pointerEvents: 'auto',
          }}
        >
          <Canvas
            camera={{ position: [0, 0, 25], fov: 60 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'var(--bg-dark-alt)' }}
          >
            <GalaxyScene3D step={step} contractToCenter={step >= 5} />
          </Canvas>
        </div>
      )}

      {/* ── Step 0: Vision Label ── */}
      <AnimatePresence>
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute',
              top: '5vh',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              pointerEvents: 'none',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(0.65rem, 1vw, 0.8rem)',
                color: 'var(--neon-gold)',
                letterSpacing: '0.15em',
                textShadow: '0 0 10px rgba(var(--neon-gold-rgb),0.4)',
              }}
            >
              THE VISION — CLUSTER INTELLIGENCE AT SCALE
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 0: Headline ── */}
      <AnimatePresence>
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              position: 'absolute',
              bottom: '10vh',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              pointerEvents: 'none',
              textAlign: 'center',
              maxWidth: '80vw',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                color: 'var(--text-inverse)',
                lineHeight: 1.3,
                textShadow: '0 0 20px rgba(var(--neon-gold-rgb),0.3)',
              }}
            >
              One cluster is just the beginning.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 1: Cluster Labels ── */}
      <AnimatePresence>
        {showLabels && step < 4 && (
          <>
            {CLUSTER_LABELS.map((label, i) => (
              <motion.div
                key={`label-${i}`}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                style={{
                  position: 'absolute',
                  ...CLUSTER_QUADRANT[i],
                  zIndex: 25,
                  pointerEvents: 'none',
                  background: 'rgba(var(--black-rgb),0.4)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  border: `1px solid rgba(${CLUSTER_UI_COLORS_RGB[i]}, 0.2)`,
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.55rem, 0.85vw, 0.72rem)',
                  color: CLUSTER_UI_COLORS[i],
                  letterSpacing: '0.05em',
                  textShadow: `0 0 8px rgba(${CLUSTER_UI_COLORS_RGB[i]}, 0.27)`,
                }}
              >
                {label}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* ── Step 2: Beam Labels (traveling along beams) ── */}
      <AnimatePresence>
        {showBeams && step < 4 && (
          <>
            {BEAM_LABELS.slice(0, 3).map((label, i) => (
              <motion.div
                key={`beam-label-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                style={{
                  position: 'absolute',
                  top: '48%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${-30 + i * 30}deg) translateX(${80 + i * 20}px)`,
                  zIndex: 25,
                  pointerEvents: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.45rem, 0.7vw, 0.6rem)',
                  color: 'var(--neon-gold)',
                  opacity: 0.7,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* ── Step 2: Caption ── */}
      <AnimatePresence>
        {showBeams && step < 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              bottom: '5vh',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              pointerEvents: 'none',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(0.55rem, 0.85vw, 0.72rem)',
                color: 'var(--text-dim)',
                letterSpacing: '0.04em',
              }}
            >
              Multi-cluster workload coordination. Global resource optimization.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 3: Use Case Cards ── */}
      <AnimatePresence>
        {showUseCases && step < 4 && (
          <>
            {USE_CASE_CARDS.map((card, i) => (
              <motion.div
                key={`card-${i}`}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                style={{
                  position: 'absolute',
                  ...CLUSTER_QUADRANT[i],
                  top: CLUSTER_QUADRANT[i].top
                    ? `calc(${CLUSTER_QUADRANT[i].top} + 50px)`
                    : undefined,
                  bottom: CLUSTER_QUADRANT[i].bottom
                    ? `calc(${CLUSTER_QUADRANT[i].bottom} + 50px)`
                    : undefined,
                  zIndex: 25,
                  pointerEvents: 'none',
                }}
              >
                <GlassCard color={card.color} borderColor={card.border}>
                  {card.text}
                </GlassCard>
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* ── Step 4: Neural Network SVG (replaces brain cluster) ── */}
      <AnimatePresence>
        {showNeural && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              pointerEvents: 'none',
            }}
          >
            <NeuralNetworkSVG />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 4: Morphed Headline ── */}
      <AnimatePresence>
        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '22vh',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              pointerEvents: 'none',
              textAlign: 'center',
              maxWidth: '80vw',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                color: 'var(--text-inverse)',
                lineHeight: 1.3,
                textShadow: '0 0 20px rgba(var(--neon-gold-rgb),0.3)',
              }}
            >
              Cluster-Wide Resource Intelligence.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 4: Roadmap Items ── */}
      <AnimatePresence>
        {showRoadmap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              bottom: '10vh',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {ROADMAP_ITEMS.map((item, i) => (
              <motion.div
                key={`roadmap-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.2 }}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.6rem, 0.9vw, 0.78rem)',
                  color: 'var(--neon-gold)',
                  letterSpacing: '0.04em',
                   textShadow: '0 0 8px rgba(var(--neon-gold-rgb),0.3)',
                }}
              >
                {item}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 5: Typewriter Caption ── */}
      <AnimatePresence>
        {step >= 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              bottom: '8vh',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 35,
              pointerEvents: 'none',
              textAlign: 'center',
              maxWidth: '80vw',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(0.7rem, 1.1vw, 0.9rem)',
                color: 'var(--neon-gold)',
                letterSpacing: '0.03em',
                lineHeight: 1.5,
              }}
            >
              <TypewriterText
                text="From reactive firefighting to proactive intelligence."
                active={step >= 5}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 5: White Flash Effect ── */}
      {flashVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'white',
            zIndex: 100,
            pointerEvents: 'none',
            animation: 'flashIn 0.2s ease-out',
          }}
        />
      )}
    </div>
  )
}
