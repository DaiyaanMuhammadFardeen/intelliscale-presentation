import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBackgroundMutation } from '../components/BackgroundContext'
import { useGpuContentionData } from '../hooks/useGpuContentionData'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

const GPU_POSITIONS = [
  { col: 1, row: 0 },
  { col: 2, row: 1 },
  { col: 1, row: 2 },
]

const GRID_COLS = 4
const GRID_ROWS = 3
const TILE_SIZE = 80
const TILE_GAP = 16

function getTileCenter(col, row) {
  const x = (col - 1.5) * (TILE_SIZE + TILE_GAP)
  const z = (row - 1) * (TILE_SIZE + TILE_GAP)
  return { x, z }
}

function isoTransform(x, z) {
  const cos45 = Math.cos(Math.PI / 4)
  const sin30 = Math.sin(Math.PI / 6)
  const screenX = (x - z) * cos45
  const screenY = (x + z) * sin30
  return { left: screenX, top: screenY }
}

function isGpuNode(col, row) {
  return GPU_POSITIONS.some((p) => p.col === col && p.row === row)
}

function gpuIndexToPos(idx) {
  return GPU_POSITIONS[idx] || GPU_POSITIONS[0]
}

function formatTime(totalSecs) {
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = Math.floor(totalSecs % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function GridNode({ col, row, gpuFull }) {
  const gpu = isGpuNode(col, row)
  const { x, z } = getTileCenter(col, row)
  const pos = isoTransform(x, z)

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${pos.left}px - ${TILE_SIZE / 2}px)`,
        top: `calc(50% + ${pos.top}px - ${TILE_SIZE / 2}px)`,
        width: TILE_SIZE,
        height: TILE_SIZE,
        background: gpu
          ? 'rgba(var(--neon-gold-rgb), 0.08)'
          : 'rgba(var(--text-inverse-rgb), 0.03)',
        border: `1px solid ${
          gpu
            ? gpuFull
              ? 'rgba(var(--alert-red-rgb), 0.4)'
              : 'rgba(var(--neon-gold-rgb), 0.2)'
            : 'rgba(var(--text-inverse-rgb), 0.06)'
        }`,
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '8px',
        transition: 'all 0.4s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          fontSize: '14px',
          color: gpu ? 'rgba(var(--neon-gold-rgb), 0.3)' : 'rgba(var(--text-inverse-rgb), 0.08)',
          lineHeight: 1,
        }}
      >
        □
      </div>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: gpu
            ? gpuFull
              ? 'var(--alert-red)'
              : 'var(--neon-gold)'
            : 'rgba(var(--emerald-rgb), 0.8)',
          boxShadow: gpu
            ? gpuFull
              ? '0 0 8px var(--alert-red)'
              : '0 0 8px var(--neon-gold)'
            : '0 0 6px rgba(var(--emerald-rgb), 0.5)',
          transition: 'all 0.3s ease',
          marginBottom: 4,
        }}
      />
    </div>
  )
}

function JobPod({ job, step, queueIndex = 0 }) {
  if (step < 1) return null

  const gpuPos = gpuIndexToPos(job.targetGpu)
  const { x, z } = getTileCenter(gpuPos.col, gpuPos.row)
  const targetPos = isoTransform(x, z)

  if (job.status === 'spawning') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0, y: -200 }}
        animate={{ opacity: 1, scale: 1, y: -200 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          left: `calc(50% + ${targetPos.left}px - 15px)`,
          top: 'calc(50% - 250px)',
          width: 30,
          height: 30,
          background: 'var(--neon-purple)',
          boxShadow: '0 0 12px var(--neon-purple)',
          borderRadius: 4,
          zIndex: 25,
          pointerEvents: 'none',
        }}
      />
    )
  }

  if (job.status === 'in-flight') {
    return (
      <motion.div
        initial={{ y: -200, opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        style={{
          position: 'fixed',
          left: `calc(50% + ${targetPos.left}px - 15px)`,
          top: `calc(50% + ${targetPos.top}px - 15px)`,
          width: 30,
          height: 30,
          background: 'var(--neon-purple)',
          boxShadow: '0 0 12px var(--neon-purple)',
          borderRadius: 4,
          zIndex: 25,
          pointerEvents: 'none',
        }}
      />
    )
  }

  if (job.status === 'attached') {
    return (
      <motion.div
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        style={{
          position: 'fixed',
          left: `calc(50% + ${targetPos.left}px - 15px)`,
          top: `calc(50% + ${targetPos.top}px - 15px)`,
          width: 30,
          height: 30,
          background: 'var(--neon-purple)',
          boxShadow: '0 0 12px var(--neon-purple)',
          borderRadius: 4,
          zIndex: 25,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-inverse)',
            textAlign: 'center',
            lineHeight: 1.1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '28px',
          }}
        >
          {job.name.slice(0, 8)}
        </span>
      </motion.div>
    )
  }

  if (job.status === 'queued') {
    const queueOffset = queueIndex * 8
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: -20 }}
        animate={{
          scale: 1,
          opacity: 0.6,
          y: -50 + queueOffset,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          position: 'fixed',
          left: `calc(50% + ${targetPos.left}px - 12px)`,
          top: `calc(50% + ${targetPos.top}px - 12px)`,
          width: 24,
          height: 24,
          background: 'var(--neon-purple)',
          boxShadow: '0 0 8px var(--neon-purple)',
          borderRadius: 3,
          zIndex: 25,
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />
    )
  }

  return null
}

export default function GoldRushScene({ step }) {
  const { mutate } = useBackgroundMutation()
  const { jobPods, gpuUtil, cpuUtil, gpuCost, waitSecs, queueLengths } =
    useGpuContentionData({ active: step >= 1 })
  const [gpuActiveSlots, setGpuActiveSlots] = useState([false, false, false])

  useEffect(() => {
    mutate({ tint: { r: 147, g: 51, b: 234, opacity: 1 } })
  }, [mutate])

  // Track which GPUs have jobs
  useEffect(() => {
    const slots = [false, false, false]
    jobPods.forEach((job) => {
      if (job.status === 'attached' || job.status === 'queued') {
        if (job.targetGpu >= 0 && job.targetGpu < 3) {
          slots[job.targetGpu] = true
        }
      }
    })
    setGpuActiveSlots(slots)
  }, [jobPods])

  // Per-GPU occupancy: a GPU is "full" if it has at least one attached job
  const isGpuOccupied = (col, row) => {
    const idx = GPU_POSITIONS.findIndex((p) => p.col === col && p.row === row)
    return idx >= 0 && gpuActiveSlots[idx]
  }

  const chartData = useMemo(
    () => [
      { name: 'GPU', value: Math.round(gpuUtil), color: 'var(--neon-red)' },
      { name: 'CPU', value: Math.round(cpuUtil), color: 'rgba(var(--emerald-rgb), 0.8)' },
    ],
    [gpuUtil, cpuUtil]
  )

  const showChart = step >= 3
  const showQueues = step >= 2
  const showInsight = step >= 4
  const gridDim = step >= 4

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
        alignItems: 'center',
      }}
    >
      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <motion.div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
        animate={
          step >= 5
            ? { rotateX: 180, opacity: 0, scale: 0.8 }
            : {}
        }
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
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
          THE PROBLEM — GPU CONTENTION
        </div>

        {/* ── Headline ── */}
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            marginTop: '10vh',
            zIndex: 20,
            position: 'relative',
          }}
        >
          <AnimatePresence mode="wait">
            {step < 4 ? (
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
                GPUs don't wait for anyone.
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
                  fontSize: 'clamp(2rem, 5vw, 4rem)',
                  color: 'var(--text-inverse)',
                  letterSpacing: '-0.02em',
                }}
              >
                Default scheduler is flying blind.
              </motion.h2>
            )}
          </AnimatePresence>
        </div>

        {/* ── Isometric Grid ── */}
        <motion.div
          animate={{ opacity: gridDim ? 0.3 : 1 }}
          transition={{ duration: 1 }}
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
            transform: 'rotateX(60deg) rotateZ(45deg)',
            zIndex: 15,
          }}
        >
          {Array.from({ length: GRID_ROWS }, (_, row) =>
            Array.from({ length: GRID_COLS }, (_, col) => (
              <GridNode
                key={`${col}-${row}`}
                col={col}
                row={row}
                gpuFull={isGpuOccupied(col, row)}
              />
            ))
          )}

          {/* Queue indicators above GPU nodes */}
          {showQueues &&
            GPU_POSITIONS.map((pos, gpuIdx) => {
              const qLen = queueLengths[gpuIdx]
              if (qLen === 0) return null
              const { x, z } = getTileCenter(pos.col, pos.row)
              const screenPos = isoTransform(x, z - 50)

              return (
                <motion.div
                  key={`queue-${gpuIdx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    left: screenPos.left - 20,
                    top: screenPos.top - 10,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--neon-red)',
                    textShadow: '0 0 6px rgba(var(--alert-red-rgb), 0.5)',
                    whiteSpace: 'nowrap',
                    zIndex: 30,
                  }}
                >
                  Queue: {qLen}
                </motion.div>
              )
            })}

          {/* IDLE CAPACITY label */}
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{
                position: 'absolute',
                left: isoTransform(
                  getTileCenter(0, 0).x,
                  getTileCenter(0, 0).z - 40
                ).left,
                top: isoTransform(
                  getTileCenter(0, 0).x,
                  getTileCenter(0, 0).z - 40
                ).top,
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(0.75rem, 1.2vw, 0.95rem)',
                color: 'var(--text-dim)',
                textShadow: '0 0 4px rgba(var(--text-dim-rgb), 0.3)',
                whiteSpace: 'nowrap',
                zIndex: 30,
              }}
            >
              IDLE CAPACITY (IGNORED)
            </motion.div>
          )}
        </motion.div>

        {/* ── Job Pods ── */}
        {step >= 1 &&
          (() => {
            // Compute queue ordering per GPU for stacked visuals
            const queueCounters = { 0: 0, 1: 0, 2: 0 }
            return jobPods.map((job) => {
              let qi = 0
              if (job.status === 'queued') {
                qi = queueCounters[job.targetGpu]++
              }
              return (
                <JobPod key={job.id} job={job} step={step} queueIndex={qi} />
              )
            })
          })()}

        {/* ── Bar Chart Panel ── */}
        <AnimatePresence>
          {showChart && (
            <motion.div
              className="glass-panel"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                position: 'absolute',
                right: '5%',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 280,
                padding: 20,
                borderRadius: 12,
                zIndex: 20,
              }}
            >
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.15)' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Bar labels */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: -120,
                  marginLeft: 50,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {chartData.map((d) => (
                  <div
                    key={d.name}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      fontWeight: 700,
                      color: d.color,
                      lineHeight: '70px',
                    }}
                  >
                    {d.value}%
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Cost & Wait Counters ── */}
        <AnimatePresence>
          {showChart && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                position: 'absolute',
                left: '5%',
                bottom: '15%',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                zIndex: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(0.8rem, 1.2vw, 1rem)',
                    color: 'var(--text-dim)',
                  }}
                >
                  💰 GPU Cost Burning:
                </span>
                <motion.span
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                    color: 'var(--neon-gold)',
                    fontWeight: 700,
                    textShadow: '0 0 8px rgba(var(--neon-gold-rgb), 0.4)',
                  }}
                >
                  ${gpuCost.toFixed(2)} / min
                </motion.span>
                <span
                  style={{
                    animation: 'flicker 1.5s ease-in-out infinite',
                    fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
                  }}
                >
                  🔥
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(0.8rem, 1.2vw, 1rem)',
                    color: 'var(--text-dim)',
                  }}
                >
                  Waiting:
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(0.8rem, 1.2vw, 1rem)',
                    color: 'var(--neon-red)',
                    fontWeight: 700,
                  }}
                >
                  {formatTime(waitSecs)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Insight Callout ── */}
        <AnimatePresence>
          {showInsight && (
            <motion.div
              className="glass-panel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: 550,
                padding: '32px 40px',
                borderRadius: 16,
                zIndex: 30,
                textAlign: 'center',
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
                The scheduler sees only NOW. It has no forecast. It cannot pre-place jobs. It wastes $12k/month in GPU idle time.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
