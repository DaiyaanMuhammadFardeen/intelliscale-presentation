import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBackgroundMutation } from '../components/BackgroundContext'

/* ──────────────────────────── Data ──────────────────────────── */

const NODES = [
  {
    id: 'prometheus',
    name: 'Prometheus + DCGM',
    subtitle: 'Multi-metric forecasting',
    color: 'var(--neon-cyan)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    tooltip: 'Scrapes metrics every 30s. CPU, Memory via Node Exporter. GPU Util + GPU Memory via NVIDIA DCGM Exporter. Stores in time-series format for Prophet ingestion.',
  },
  {
    id: 'prophet',
    name: 'Prophet Engine',
    subtitle: 'Multi-metric forecasting',
    color: 'var(--neon-purple)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
        <path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z" />
        <path d="M12 6v12" />
        <path d="M6 12h12" />
      </svg>
    ),
    tooltip: 'One Prophet model per metric. Handles daily + weekly seasonality. Rolling 7-day training window. Retrain on every cycle. Outputs (forecast, lower_bound, upper_bound) per metric.',
  },
  {
    id: 'controller',
    name: 'Predictive Controller',
    subtitle: 'Core decision engine',
    color: 'var(--neon-gold)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    tooltip: 'Core Python service. Reads forecasts. Computes target replicas using clamped formula. Checks confidence threshold. Issues scale commands. Writes GPU scheduling hints as pod annotations.',
  },
  {
    id: 'k8s',
    name: 'K8s API',
    subtitle: 'Orchestration layer',
    color: 'var(--neon-blue)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    tooltip: 'Receives PATCH requests for Deployment replica counts. Receives pod annotation updates for node affinity. Retains HPA + default scheduler as reactive safety nets.',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    subtitle: 'Observability & visibility',
    color: 'var(--neon-green)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    ),
    tooltip: 'Streamlit + Plotly. Live charts: predicted vs actual per metric. Scaling action log. Node utilisation forecast heatmap. All data pulled from Prophet output + controller log.',
  },
]

const CONNECTORS = [
  { from: 'prometheus', to: 'prophet', label: 'raw metrics (30s interval)', color: 'var(--neon-cyan)' },
  { from: 'prophet', to: 'controller', label: 'forecast + confidence bands', color: 'var(--neon-purple)' },
  { from: 'controller', to: 'k8s', label: 'PATCH replicas, node affinity', color: 'var(--neon-gold)' },
  { from: 'controller', to: 'dashboard', label: 'decision log + predictions', color: 'var(--neon-green)' },
]

/* ──────────────────────────── CSS Keyframes ──────────────────────────── */

const STYLES = `
  @keyframes hexGrid {
    0% { background-position: 0 0; }
    100% { background-position: 100px 86.6px; }
  }

  @keyframes drawPath {
    from { stroke-dashoffset: var(--path-length); }
    to { stroke-dashoffset: 0; }
  }

  @keyframes particleFlow {
    from { offset-distance: 0%; }
    to { offset-distance: 100%; }
  }

  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(var(--neon-gold-rgb), 0.4), inset 0 0 20px rgba(var(--neon-gold-rgb), 0.1); }
    50% { box-shadow: 0 0 40px rgba(var(--neon-gold-rgb), 0.8), inset 0 0 30px rgba(var(--neon-gold-rgb), 0.2); }
  }

  @keyframes checkGlow {
    0% { text-shadow: 0 0 8px var(--neon-green); }
    50% { text-shadow: 0 0 16px var(--neon-green), 0 0 32px var(--neon-green); }
    100% { text-shadow: 0 0 8px var(--neon-green); }
  }

  @keyframes ringProgress {
    from { stroke-dashoffset: 157; }
    to { stroke-dashoffset: 0; }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .node-glass {
    background: rgba(var(--black-rgb), 0.5);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(var(--text-inverse-rgb), 0.08);
    border-radius: 16px;
    position: relative;
    overflow: hidden;
  }

  .tooltip-glass {
    background: rgba(var(--black-rgb), 0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--neon-cyan);
    border-radius: 12px;
    box-shadow: 0 0 20px rgba(var(--neon-cyan-rgb), 0.3);
  }

  .cycle-pulse {
    animation: glowPulse 1.5s ease-in-out infinite;
  }
`

/* ──────────────────────────── Helpers ──────────────────────────── */

function getConnectorPath(fromId, toId, nodePositions) {
  const from = nodePositions[fromId]
  const to = nodePositions[toId]
  if (!from || !to) return ''

  const fromX = from.x + from.width
  const fromY = from.y + from.height / 2
  const toX = to.x
  const toY = to.y + to.height / 2

  const cp1x = fromX + (toX - fromX) * 0.4
  const cp2x = fromX + (toX - fromX) * 0.6

  return `M ${fromX} ${fromY} C ${cp1x} ${fromY}, ${cp2x} ${toY}, ${toX} ${toY}`
}

/* ──────────────────────────── Main Scene ──────────────────────────── */

export default function ArchitectureScene({ step }) {
  const { mutate } = useBackgroundMutation()
  const [hoveredNode, setHoveredNode] = useState(null)
  const [cycleActive, setCycleActive] = useState(false)
  const [activeCycleNode, setActiveCycleNode] = useState(-1)
  const [cycleProgress, setCycleProgress] = useState(0)
  const [showScheduler, setShowScheduler] = useState(false)
  const containerRef = useRef(null)

  // Background mutation
  useEffect(() => {
    mutate({ tint: { r: 10, g: 20, b: 40, opacity: 0.08 }, torusKnot: false })
  }, [mutate])

  // Step 4: Start cycle animation
  useEffect(() => {
    if (step >= 4) {
      setCycleActive(true)
      setShowScheduler(true)
    } else {
      setCycleActive(false)
      setActiveCycleNode(-1)
    }
  }, [step])

  // Cycle animation loop
  useEffect(() => {
    if (!cycleActive) return

    let nodeIndex = 0
    const cycleInterval = setInterval(() => {
      setActiveCycleNode(nodeIndex)
      setCycleProgress(0)

      // Animate progress over 3s
      const progressInterval = setInterval(() => {
        setCycleProgress((p) => {
          if (p >= 100) {
            clearInterval(progressInterval)
            return 0
          }
          return p + 3.33
        })
      }, 100)

      nodeIndex = (nodeIndex + 1) % NODES.length
    }, 600)

    return () => clearInterval(cycleInterval)
  }, [cycleActive])

  // Calculate node positions for connectors
  const nodePositions = {}
  const nodeWidth = 160
  const nodeHeight = 90
  const gap = 40
  const totalWidth = NODES.length * nodeWidth + (NODES.length - 1) * gap
  const startX = (1920 - totalWidth) / 2 // Assuming 1920 viewport
  const yPos = 320

  NODES.forEach((node, i) => {
    nodePositions[node.id] = {
      x: startX + i * (nodeWidth + gap),
      y: yPos,
      width: nodeWidth,
      height: nodeHeight,
    }
  })

  const showNodes = step >= 1
  const showConnectors = step >= 2
  const showTooltips = step >= 3
  const showCycle = step >= 4
  const showFinal = step >= 5

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      <style>{STYLES}</style>

      {/* ── Hexagonal grid background ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.03,
          backgroundImage: `radial-gradient(circle at 50% 50%, var(--neon-cyan) 1px, transparent 1px),
                           radial-gradient(circle at 50% 50%, var(--neon-cyan) 1px, transparent 1px)`,
          backgroundSize: '60px 52px',
          backgroundPosition: '0 0, 30px 26px',
          animation: 'hexGrid 20s linear infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Circuit board traces ── */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.05,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <defs>
          <pattern id="circuitPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M10 10 L90 10 L90 90 L10 90 Z" fill="none" stroke="var(--neon-cyan)" strokeWidth="0.5" />
            <circle cx="10" cy="10" r="2" fill="var(--neon-cyan)" />
            <circle cx="90" cy="10" r="2" fill="var(--neon-cyan)" />
            <circle cx="90" cy="90" r="2" fill="var(--neon-cyan)" />
            <circle cx="10" cy="90" r="2" fill="var(--neon-cyan)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuitPattern)" />
      </svg>

      {/* ── Label ── */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.7rem, 1.5vw, 0.95rem)',
          color: 'var(--neon-cyan)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          zIndex: 20,
          textShadow: '0 0 10px rgba(var(--neon-cyan-rgb), 0.4)',
        }}
      >
        THE ARCHITECTURE — SYSTEM DATA FLOW
      </div>

      {/* ── Headline ── */}
      <div
        style={{
          width: '100%',
          textAlign: 'center',
          marginTop: '8vh',
          zIndex: 20,
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait">
          {!showFinal ? (
            <motion.h2
              key="before"
              className="font-display"
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                fontWeight: 700,
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                color: 'var(--text-inverse)',
                letterSpacing: '-0.02em',
              }}
            >
              Five components. One intelligence.
            </motion.h2>
          ) : (
            <motion.h2
              key="after"
              className="font-display"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                fontWeight: 700,
                fontSize: 'clamp(1.8rem, 4vw, 3.5rem)',
                color: 'var(--text-inverse)',
                letterSpacing: '-0.02em',
                display: 'flex',
                gap: '0.3em',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0, duration: 0.5 }}
                style={{ color: 'var(--neon-cyan)' }}
              >
                Built on standard K8s primitives.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{ color: 'var(--neon-gold)' }}
              >
                Zero cloud lock-in.
              </motion.span>
            </motion.h2>
          )}
        </AnimatePresence>
      </div>

      {/* ── Node Container ── */}
      <div
        style={{
          position: 'absolute',
          top: yPos,
          left: '50%',
          transform: 'translateX(-50%)',
          width: totalWidth,
          height: nodeHeight,
          zIndex: 15,
        }}
      >
        <AnimatePresence>
          {showNodes &&
            NODES.map((node, i) => (
              <motion.div
                key={node.id}
                className="node-glass"
                initial={{ y: -200, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  boxShadow:
                    showCycle && activeCycleNode === i
                      ? '0 0 40px rgba(var(--neon-gold-rgb), 0.8), inset 0 0 30px rgba(var(--neon-gold-rgb), 0.2)'
                      : '0 4px 20px rgba(var(--black-rgb), 0.3)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 24,
                  delay: i * 0.2,
                }}
                onMouseEnter={() => showTooltips && setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  position: 'absolute',
                  left: i * (nodeWidth + gap),
                  top: 0,
                  width: nodeWidth,
                  height: nodeHeight,
                  borderLeft: `4px solid ${node.color}`,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: showTooltips ? 'pointer' : 'default',
                  transition: 'box-shadow 0.3s ease',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    color: node.color,
                    marginBottom: 8,
                    filter: `drop-shadow(0 0 8px ${node.color})`,
                  }}
                >
                  {node.icon}
                </div>

                {/* Name */}
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)',
                    color: 'var(--text-inverse)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {node.name}
                </div>

                {/* Subtitle */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    color: 'var(--text-dim)',
                    marginTop: 4,
                    textAlign: 'center',
                  }}
                >
                  {node.subtitle}
                </div>

                {/* Open Source badge */}
                {showFinal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.2, duration: 0.3 }}
                    style={{
                      position: 'absolute',
                      top: -12,
                      right: -12,
                      background: 'var(--neon-green)',
                      color: 'var(--text-inverse)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 12,
                      boxShadow: '0 0 12px var(--neon-green)',
                      animation: 'checkGlow 1s ease-in-out',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ✓ Open Source
                  </motion.div>
                )}
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* ── SVG Connectors ── */}
      {showConnectors && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 12,
          }}
        >
          {CONNECTORS.map((connector, i) => {
            const pathD = getConnectorPath(connector.from, connector.to, nodePositions)
            const pathLength = 600 // Approximate path length

            return (
              <g key={`${connector.from}-${connector.to}`}>
                {/* Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={connector.color}
                  strokeWidth="2"
                  strokeOpacity="0.6"
                  strokeDasharray={pathLength}
                  strokeDashoffset={pathLength}
                  style={{
                    animation: `drawPath 1s ease-out forwards`,
                    animationDelay: `${i * 0.2}s`,
                    '--path-length': pathLength,
                  }}
                />

                {/* Label */}
                <text
                  x={
                    (nodePositions[connector.from].x +
                      nodePositions[connector.from].width +
                      nodePositions[connector.to].x) /
                    2
                  }
                  y={nodePositions[connector.from].y - 20}
                  fill={connector.color}
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                  opacity="0"
                  style={{
                    animation: `fadeIn 0.5s ease-out forwards`,
                    animationDelay: `${1 + i * 0.2}s`,
                  }}
                >
                  {connector.label}
                </text>

                {/* Flow particles */}
                {showCycle && (
                  <circle
                    r="4"
                    fill={connector.color}
                    style={{
                      filter: `drop-shadow(0 0 6px ${connector.color})`,
                      offsetPath: `path("${pathD}")`,
                      animation: `particleFlow 2s linear infinite`,
                      animationDelay: `${i * 0.5}s`,
                    }}
                  />
                )}
              </g>
            )
          })}
        </svg>
      )}

      {/* ── Tooltip ── */}
      <AnimatePresence>
        {hoveredNode && showTooltips && (
          <motion.div
            className="tooltip-glass"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: nodePositions[hoveredNode].y - 120,
              left: nodePositions[hoveredNode].x + nodePositions[hoveredNode].width / 2,
              transform: 'translateX(-50%)',
              width: 320,
              padding: '16px',
              zIndex: 30,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                color: 'var(--text-inverse)',
                lineHeight: 1.6,
              }}
            >
              {NODES.find((n) => n.id === hoveredNode)?.tooltip}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Click hint ── */}
      <AnimatePresence>
        {showTooltips && !hoveredNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              bottom: '15vh',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-dim)',
              zIndex: 20,
              textAlign: 'center',
            }}
          >
            Click any component to learn more →
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cycle timer ── */}
      <AnimatePresence>
        {showCycle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              bottom: '8vh',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              zIndex: 20,
            }}
          >
            {/* Progress ring */}
            <div style={{ position: 'relative', width: 40, height: 40 }}>
              <svg viewBox="0 0 40 40" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="rgba(var(--text-inverse-rgb),0.1)"
                  strokeWidth="3"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="var(--neon-gold)"
                  strokeWidth="3"
                  strokeDasharray="113"
                  strokeDashoffset={113 - (113 * cycleProgress) / 100}
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
              </svg>
            </div>

            {/* Label */}
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--neon-gold)',
                fontWeight: 700,
              }}
            >
              System cycle: every 30s
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Predictive Scheduler ── */}
      <AnimatePresence>
        {showScheduler && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="node-glass"
            style={{
              position: 'absolute',
              top: nodePositions.controller.y + nodeHeight + 40,
              left: nodePositions.controller.x + nodeWidth / 2 - 100,
              width: 200,
              height: 70,
              borderLeft: '4px dashed var(--neon-purple)',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 15,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '0.75rem',
                color: 'var(--neon-purple)',
                textAlign: 'center',
              }}
            >
              Predictive Scheduler
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                color: 'var(--text-dim)',
                marginTop: 4,
              }}
            >
              (customisable)
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Caption ── */}
      <AnimatePresence>
        {showFinal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-panel"
            style={{
              position: 'absolute',
              bottom: '4vh',
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: '80vw',
              padding: '20px 32px',
              borderRadius: 12,
              textAlign: 'center',
              zIndex: 20,
            }}
          >
            <p
              className="font-body"
              style={{
                fontSize: 'clamp(0.85rem, 1.4vw, 1.1rem)',
                color: 'var(--text-inverse)',
                lineHeight: 1.6,
              }}
            >
              Prometheus, Prophet, Python, Kubernetes. No proprietary APIs. No vendor lock-in. Deployable on any cluster.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}