import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBackgroundMutation } from '../components/BackgroundContext'

/* ── Node definitions ── */
const GPU_NODES = [1, 2, 4, 6, 7, 9]
const NODES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `node-${String(i + 1).padStart(2, '0')}`,
  hasGpu: GPU_NODES.includes(i + 1),
}))

const INITIAL_LOADS = {
  1: { gpu: 85, cpu: 42 },
  2: { gpu: 85, cpu: 38 },
  3: { gpu: null, cpu: 45 },
  4: { gpu: 85, cpu: 50 },
  5: { gpu: null, cpu: 35 },
  6: { gpu: 40, cpu: 30 },
  7: { gpu: 40, cpu: 28 },
  8: { gpu: null, cpu: 50 },
  9: { gpu: 88, cpu: 44 },
  10: { gpu: null, cpu: 30 },
  11: { gpu: null, cpu: 40 },
  12: { gpu: null, cpu: 32 },
}

const FORECAST = {
  1: { now: 85, in5: 12 },
  2: { now: 85, in5: 10 },
  3: { now: 45, in5: 30 },
  4: { now: 85, in5: 88, up: true },
  5: { now: 35, in5: 25 },
  6: { now: 40, in5: 65, up: true },
  7: { now: 40, in5: 38, down: true },
  8: { now: 50, in5: 40 },
  9: { now: 88, in5: 8, down: true, highlight: true },
  10: { now: 30, in5: 22 },
  11: { now: 40, in5: 35 },
  12: { now: 32, in5: 28 },
}

/* ── Helpers ── */
function loadColor(pct) {
  if (pct >= 80) return 'var(--alert-red)'
  if (pct >= 60) return 'var(--amber)'
  if (pct >= 40) return 'var(--amber)'
  return 'var(--emerald)'
}

function formatCountdown(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

/* ── Node Card ── */
function NodeCard({ node, step, forecastVisible, loadOverride }) {
  const base = INITIAL_LOADS[node.id]
  const gpuLoad = loadOverride?.gpu ?? base.gpu ?? 0
  const cpuLoad = loadOverride?.cpu ?? base.cpu ?? 0
  const forecast = FORECAST[node.id]

  const gpuColor = loadColor(gpuLoad)
  const cpuColor = loadColor(cpuLoad)

  return (
    <div
      style={{
        width: 'clamp(90px, 12vw, 140px)',
        height: 'clamp(100px, 14vw, 170px)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        background: node.hasGpu
          ? 'rgba(var(--deep-purple-rgb), 0.18)'
          : 'rgba(var(--black-rgb),0.3)',
        border: node.hasGpu
          ? '1px solid rgba(var(--soft-purple-rgb), 0.18)'
          : '1px solid rgba(var(--text-inverse-rgb),0.06)',
        borderRadius: 12,
        padding: '10px 10px 8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        transition: 'all 0.4s ease',
        overflow: 'hidden',
      }}
    >
      {/* GPU chip icon */}
      {node.hasGpu && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            fontSize: '0.6rem',
            filter: 'drop-shadow(0 0 3px rgba(var(--soft-purple-rgb),0.6))',
          }}
        >
          ⚡
        </span>
      )}

      {/* Node name */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--text-dim)',
          marginBottom: 4,
        }}
      >
        {node.name}
      </div>

      {/* GPU bar (if GPU node) */}
      {node.hasGpu && (
        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.5rem',
              color: 'var(--text-dim)',
              marginBottom: 2,
            }}
          >
            <span>GPU</span>
            <span style={{ color: gpuColor }}>{gpuLoad}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: 4,
              background: 'rgba(var(--text-inverse-rgb),0.08)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${gpuLoad}%`,
                height: '100%',
                background: gpuColor,
                borderRadius: 2,
                transition: 'width 0.5s ease',
                boxShadow: gpuLoad >= 80 ? `0 0 6px ${gpuColor}` : 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* CPU bar */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5rem',
            color: 'var(--text-dim)',
            marginBottom: 2,
          }}
        >
          <span>{node.hasGpu ? 'CPU' : 'LOAD'}</span>
          <span style={{ color: cpuColor }}>{cpuLoad}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: 4,
            background: 'rgba(var(--text-inverse-rgb),0.08)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${cpuLoad}%`,
              height: '100%',
              background: cpuColor,
              borderRadius: 2,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Forecast sub-rows (step 2+) */}
      {forecastVisible && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            marginTop: 4,
            transition: 'all 0.4s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.42rem',
              color: 'var(--text-dim)',
            }}
          >
            <span>Now:</span>
            <span>{forecast.now}%</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.42rem',
              color: forecast.down ? 'var(--emerald)' : forecast.up ? 'var(--alert-red)' : 'var(--text-dim)',
            }}
          >
            <span>In 5min:</span>
            <span>
              {forecast.in5}% {forecast.down ? '↓' : forecast.up ? '↑' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main Component ── */
export default function GhostScene({ step }) {
  const { mutate } = useBackgroundMutation()
  const [showRewind, setShowRewind] = useState(false)
  const [podPosition, setPodPosition] = useState(null) // null = top-center, or node id
  const [podPhaseActive, setPodPhaseActive] = useState(false)
  const [countdown, setCountdown] = useState(47)
  const [countdownActive, setCountdownActive] = useState(false)
  const [nodeLoads, setNodeLoads] = useState(null) // step 1 overrides
  const [forecastVisible, setForecastVisible] = useState(false)
  const [podAtNode9, setPodAtNode9] = useState(false)
  const [node9Active, setNode9Active] = useState(false)
  const [node9GlowPulse, setNode9GlowPulse] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [comparisonVisible, setComparisonVisible] = useState(false)
  const [comparisonLines, setComparisonLines] = useState(0)
  const [finalDim, setFinalDim] = useState(false)
  const [showGoldMetric, setShowGoldMetric] = useState(false)

  // Background
  useEffect(() => {
    mutate({ tint: { r: 88, g: 28, b: 135, opacity: 0.12 }, torusKnot: false })
  }, [mutate])

  // Step 1: Default scheduler — pod lands on node-04
  useEffect(() => {
    if (step !== 1) return
    const t1 = setTimeout(() => {
      setPodPosition('top')
    }, 300)
    const t2 = setTimeout(() => {
      setNodeLoads({ 4: { gpu: 95, cpu: 55 } })
      setShowWarning(true)
    }, 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [step])

  // Step 2: Rewind
  useEffect(() => {
    if (step !== 2) {
      setShowRewind(false)
      return
    }
    // Rewind pod back to top
    setPodPosition('top')
    setNodeLoads(null)
    setShowWarning(false)
    setShowRewind(true)
    const t = setTimeout(() => setShowRewind(false), 1200)
    // Show forecast after rewind
    const t2 = setTimeout(() => setForecastVisible(true), 800)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [step])

  // Step 3: Phase shift to node-09
  useEffect(() => {
    if (step !== 3) return
    // Phase shift animation
    const phases = []
    for (let i = 0; i < 6; i++) {
      phases.push(
        setTimeout(() => setPodPhaseActive(i % 2 === 1), i * 100)
      )
    }
    // After phase shift, move pod to node-09
    const t = setTimeout(() => {
      setPodPhaseActive(false)
      setPodAtNode9(true)
      setPodPosition(9)
    }, 700)
    // Start countdown
    const t2 = setTimeout(() => setCountdownActive(true), 1000)
    return () => { phases.forEach(clearTimeout); clearTimeout(t); clearTimeout(t2) }
  }, [step])

  // Countdown tick
  useEffect(() => {
    if (!countdownActive || countdown <= 0) {
      if (countdownActive && countdown <= 0) {
        setCountdownActive(false)
        // Countdown hit 0: drop node-09 load
        setNodeLoads(prev => ({ ...prev, 9: { gpu: 8, cpu: 20 } }))
        setNode9Active(true)
        setNode9GlowPulse(true)
      }
      return
    }
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) return 0
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [countdownActive, countdown])

  // Step 4: Comparison panel
  useEffect(() => {
    if (step !== 4) {
      setComparisonVisible(false)
      return
    }
    setComparisonVisible(true)
    setShowGoldMetric(true)
    // Staggered lines
    let i = 0
    const interval = setInterval(() => {
      i++
      setComparisonLines(i)
      if (i >= 8) clearInterval(interval)
    }, 150)
    return () => clearInterval(interval)
  }, [step])

  // Step 5: Final reveal
  useEffect(() => {
    if (step !== 5) {
      setFinalDim(false)
      return
    }
    const t = setTimeout(() => setFinalDim(true), 400)
    return () => clearTimeout(t)
  }, [step])

  // Pod style: glowing purple hexagon
  const podBaseStyle = {
    width: 56,
    height: 56,
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
    background: 'linear-gradient(135deg, var(--soft-purple), var(--neon-purple))',
    boxShadow: '0 0 20px rgba(var(--soft-purple-rgb), 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 25,
    left: '50%',
    transform: 'translateX(-50%)',
    transition: 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    filter: podPhaseActive ? 'blur(2px)' : 'blur(0px)',
    opacity: podPhaseActive ? 0.3 : 1,
  }

  const showPod = step >= 1
  const podTop = podPosition === 'top' || podPosition === null
  const podAtNode = podPosition === 9

  // Node 9 card position (approximate for animation)
  // Grid is 3 columns x 4 rows, node-09 is row 3, col 1 (index 8)
  // We'll calculate positions based on the grid layout

  // Comparison panel data
  const compLines = [
    { type: 'header-default', text: 'DEFAULT SCHEDULER', color: 'var(--neon-red)' },
    { type: 'item', text: '→ Placed on node-04 (88% load)', color: 'var(--neon-red)' },
    { type: 'item', text: '→ Job queued: 4m 23s', color: 'var(--neon-red)' },
    { type: 'item', text: '→ GPU contention: HIGH', color: 'var(--neon-red)' },
    { type: 'header-ghost', text: 'INTELLISCALE SCHEDULER', color: 'var(--neon-cyan)' },
    { type: 'item', text: '→ Predicted node-09 freeing in 47s', color: 'var(--neon-cyan)' },
    { type: 'item', text: '→ Job queued: 0s (pre-bound)', color: 'var(--neon-cyan)' },
    { type: 'item', text: '→ GPU contention: NONE', color: 'var(--neon-cyan)' },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(var(--soft-purple-rgb), 0.6); }
          50% { box-shadow: 0 0 40px rgba(var(--soft-purple-rgb), 0.8); }
        }
        @keyframes badge-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* ── Label ── */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.7rem, 1.5vw, 0.95rem)',
          color: 'var(--neon-purple)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          zIndex: 20,
          textShadow: '0 0 10px rgba(var(--neon-purple-rgb), 0.4)',
        }}
      >
        THE SOLUTION — PREDICTIVE GPU SCHEDULING
      </div>

      {/* ── Headline ── */}
      <div
        style={{
          width: '100%',
          textAlign: 'center',
          marginTop: 'clamp(4vh, 6vh, 8vh)',
          zIndex: 20,
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait">
          {step < 5 ? (
            <motion.h2
              key="main"
              className="font-display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                fontWeight: 700,
                fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
                color: 'var(--text-inverse)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Place workloads where capacity{' '}
              <span style={{ color: 'var(--neon-gold)', textShadow: '0 0 20px rgba(var(--amber-rgb),0.5)' }}>
                WILL BE
              </span>
              , not where it IS.
            </motion.h2>
          ) : (
            <motion.h2
              key="final"
              className="font-display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                fontWeight: 700,
                fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
                color: 'var(--text-inverse)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Place workloads where capacity{' '}
              <span style={{ color: 'var(--neon-gold)', textShadow: '0 0 20px rgba(var(--amber-rgb),0.5)' }}>
                WILL BE
              </span>
              , not where it{' '}
              <span
                style={{
                  textDecoration: 'line-through',
                  color: 'var(--neon-red)',
                  textShadow: '0 0 10px rgba(var(--neon-red-rgb), 0.4)',
                }}
              >
                IS
              </span>
              .
            </motion.h2>
          )}
        </AnimatePresence>
      </div>

      {/* ── Rewind Stamp ── */}
      <AnimatePresence>
        {showRewind && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: '50%',
              right: '10vw',
              transform: 'translateY(-50%) rotate(-15deg)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(1rem, 2vw, 1.4rem)',
              color: 'var(--amber)',
              letterSpacing: '0.15em',
              border: '2px solid var(--amber)',
              padding: '6px 16px',
              borderRadius: 4,
              zIndex: 30,
              pointerEvents: 'none',
              textShadow: '0 0 8px rgba(var(--amber-rgb),0.4)',
            }}
          >
            REWIND
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Forecast Banner ── */}
      <AnimatePresence>
        {forecastVisible && step >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              top: 'clamp(10vh, 14vh, 18vh)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--amber)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              zIndex: 20,
              textShadow: '0 0 8px rgba(var(--amber-rgb),0.3)',
              padding: '4px 12px',
              border: '1px solid rgba(var(--amber-rgb),0.2)',
              borderRadius: 4,
              background: 'rgba(var(--amber-rgb),0.05)',
            }}
          >
            ⏱ FORECAST HORIZON: +5 minutes
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pod ── */}
      <AnimatePresence>
        {showPod && (
          <motion.div
            key="pod"
            initial={{ opacity: 0, y: -30 }}
            animate={{
              opacity: podPhaseActive ? 0.3 : 1,
              y: podPhaseActive ? 0 : 0,
            }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            style={{
              ...podBaseStyle,
              top: podAtNode ? 'clamp(42vh, 48vh, 56vh)' : 'clamp(12vh, 16vh, 22vh)',
              opacity: podPhaseActive ? 0.3 : 1,
              filter: podPhaseActive ? 'blur(2px)' : 'blur(0px)',
              boxShadow: node9GlowPulse
                ? '0 0 40px rgba(var(--soft-purple-rgb), 0.8)'
                : '0 0 20px rgba(var(--soft-purple-rgb), 0.6)',
              animation: node9GlowPulse ? 'glow-pulse 0.5s ease 2' : 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Pod label */}
      {showPod && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            position: 'absolute',
            top: podAtNode ? 'calc(clamp(42vh, 48vh, 56vh) + 60px)' : 'calc(clamp(12vh, 16vh, 22vh) + 60px)',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--neon-purple)',
            zIndex: 25,
            whiteSpace: 'nowrap',
          }}
        >
          gpu-inference-job-0847
        </motion.div>
      )}

      {/* ── Node Grid ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 12,
          maxWidth: 600,
          margin: 'clamp(12vh, 16vh, 20vh) auto 0',
          padding: '0 20px',
          zIndex: 15,
          position: 'relative',
        }}
      >
        {NODES.map((node, i) => {
          const row = Math.floor(i / 3)
          const col = i % 3
          const staggerDelay = col * 0.08 + row * 0.05

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={
                step >= 0
                  ? {
                      opacity: finalDim && node.id !== 9 ? 0.3 : 1,
                      y: 0,
                      scale: 1,
                      boxShadow:
                        (step === 1 && [4, 7, 11].includes(node.id))
                          ? '0 0 15px rgba(var(--emerald-rgb), 0.5), inset 0 0 0 2px rgba(var(--emerald-rgb), 0.3)'
                          : (step === 1 && node.id === 4 && showWarning)
                          ? '0 0 20px rgba(var(--neon-red-rgb), 0.4), inset 0 0 0 1px rgba(var(--neon-red-rgb), 0.3)'
                          : node9Active && node.id === 9
                          ? '0 0 20px rgba(var(--emerald-rgb), 0.5), inset 0 0 0 2px rgba(var(--emerald-rgb), 0.3)'
                          : (finalDim && node.id === 9)
                          ? '0 0 25px rgba(var(--soft-purple-rgb), 0.4)'
                          : undefined,
                    }
                  : {}
              }
              transition={{
                duration: 0.6,
                delay: staggerDelay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{ position: 'relative' }}
            >
              <NodeCard
                node={node}
                step={step}
                forecastVisible={forecastVisible && step >= 2}
                loadOverride={
                  nodeLoads?.[node.id] ?? (node9Active && node.id === 9 ? { gpu: 8, cpu: 20 } : null)
                }
              />

              {/* Warning badge on node-04 (step 1) */}
              {step === 1 && node.id === 4 && showWarning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: 'rgba(var(--neon-red-rgb), 0.9)',
                    borderRadius: 10,
                    padding: '2px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.55rem',
                    color: 'var(--text-inverse)',
                    zIndex: 5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ color: 'var(--alert-red)' }}>⚠</span> HIGH PRESSURE
                </motion.div>
              )}

              {/* Predicted Available badge on node-09 */}
              {forecastVisible && step >= 2 && node.id === 9 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(var(--cyan-500-rgb), 0.15)',
                    border: '1px solid rgba(var(--cyan-500-rgb), 0.4)',
                    borderRadius: 8,
                    padding: '2px 8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.42rem',
                    color: 'var(--neon-cyan)',
                    whiteSpace: 'nowrap',
                    animation: 'badge-pulse 1.5s ease-in-out infinite',
                    zIndex: 5,
                  }}
                >
                  PREDICTED AVAILABLE
                </motion.div>
              )}

              {/* Countdown on node-09 (step 3) */}
              {step === 3 && countdownActive && node.id === 9 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute',
                    top: -28,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.5rem',
                    color: 'var(--amber)',
                    whiteSpace: 'nowrap',
                    zIndex: 5,
                    textShadow: '0 0 6px rgba(var(--amber-rgb),0.4)',
                  }}
                >
                  Capacity freeing in: 00:{formatCountdown(countdown)}
                </motion.div>
              )}

              {/* Active badge on node-09 (after countdown) */}
              {node9Active && node.id === 9 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: 'rgba(var(--emerald-rgb), 0.9)',
                    borderRadius: 10,
                    padding: '2px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.55rem',
                    color: 'var(--text-inverse)',
                    zIndex: 5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ✓ ACTIVE
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* ── Step Labels ── */}
      <AnimatePresence>
        {step === 1 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-body"
            style={{
              position: 'absolute',
              bottom: 'clamp(4vh, 8vh, 12vh)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)',
              color: 'var(--text-dim)',
              textAlign: 'center',
              zIndex: 20,
              maxWidth: 500,
              letterSpacing: '0.01em',
            }}
          >
            Default scheduler: first-fit. Ignores future state.
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Step 3 Label ── */}
      <AnimatePresence>
        {step >= 3 && node9Active && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="font-body"
            style={{
              position: 'absolute',
              bottom: 'clamp(4vh, 8vh, 12vh)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 'clamp(0.8rem, 1.4vw, 1.1rem)',
              color: 'var(--text-primary)',
              textAlign: 'center',
              zIndex: 20,
              maxWidth: 550,
              letterSpacing: '0.01em',
            }}
          >
            Zero queue time. The job was ready exactly when capacity was available.
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Comparison Panel (step 4+) ── */}
      <AnimatePresence>
        {comparisonVisible && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 'clamp(220px, 30vw, 350px)',
              background: 'rgba(var(--black-rgb),0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(var(--text-inverse-rgb),0.08)',
              borderRadius: 12,
              padding: 20,
              zIndex: 25,
              overflow: 'hidden',
            }}
          >
            {compLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={i < comparisonLines ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3 }}
                style={{
                  fontFamily: line.type.startsWith('header') ? 'var(--font-mono)' : 'var(--font-body)',
                  fontSize: line.type.startsWith('header') ? '0.7rem' : '0.68rem',
                  color: line.color,
                  lineHeight: 1.6,
                  letterSpacing: line.type.startsWith('header') ? '0.08em' : '0.01em',
                  textTransform: line.type.startsWith('header') ? 'uppercase' : 'none',
                  fontWeight: line.type.startsWith('header') ? 600 : 400,
                  borderTop: i === 4 ? '1px solid rgba(var(--text-inverse-rgb),0.08)' : 'none',
                  marginTop: i === 4 ? 12 : 0,
                  paddingTop: i === 4 ? 12 : 0,
                }}
              >
                {line.text}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gold Metric Badge (step 4+) ── */}
      <AnimatePresence>
        {showGoldMetric && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              position: 'absolute',
              bottom: 'clamp(3vh, 5vh, 7vh)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(1rem, 2vw, 1.5rem)',
              color: 'var(--amber)',
              textShadow: '0 0 20px rgba(var(--amber-rgb),0.4)',
              letterSpacing: '0.02em',
              padding: '8px 24px',
              border: '2px solid rgba(var(--amber-rgb),0.4)',
              borderRadius: 24,
              background: 'rgba(var(--amber-rgb),0.06)',
              zIndex: 20,
              whiteSpace: 'nowrap',
            }}
          >
            40–60% reduction in GPU queue time
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 5 Caption ── */}
      <AnimatePresence>
        {step >= 5 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-mono"
            style={{
              position: 'absolute',
              bottom: 'clamp(3vh, 5vh, 7vh)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
              color: 'var(--text-primary)',
              textAlign: 'center',
              zIndex: 20,
              maxWidth: 550,
              letterSpacing: '0.01em',
            }}
          >
            Kubernetes node affinity + pod annotations. No custom infrastructure. Native primitives.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
