import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBackgroundMutation } from '../components/BackgroundContext'
import { useTsunamiData } from '../hooks/useTsunamiData'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

function ShatterFragment({ char, index, total, active }) {
  const angle = (index / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.8
  const dist = 150 + Math.random() * 180
  const targetX = Math.cos(angle) * dist
  const targetY = Math.sin(angle) * dist - 100
  const rotation = (Math.random() - 0.5) * 360

  return (
    <motion.span
      initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
      animate={
        active
          ? { x: targetX, y: targetY, rotate: rotation, opacity: 0, scale: 0.4 }
          : { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }
      }
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: index * 0.02 }}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {char}
    </motion.span>
  )
}

export default function TsunamiScene({ step }) {
  const { mutate } = useBackgroundMutation()
  const streaming = step >= 1
  const { trafficData, hpaData, errorRate, peakHit } = useTsunamiData({ streaming })
  const [shatterActive, setShatterActive] = useState(false)

  // Step 0: background setup — red danger tint
  useEffect(() => {
    mutate({ tint: { r: 220, g: 38, b: 38, opacity: 1 }, torusKnot: false })
  }, [mutate])

  // Step 4: trigger shatter after 600ms (appears after headline morph)
  useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => setShatterActive(true), 600)
      return () => clearTimeout(timer)
    }
  }, [step])

  // Reset shatter when leaving step 4
  useEffect(() => {
    if (step !== 4) setShatterActive(false)
  }, [step])

  const errorRateDisplay = errorRate.toFixed(1)
  const shatterChars = useMemo(() => {
    // Reorder for visual chaos: . 1 8 % 3
    return ['.', '1', '8', '%', '3']
  }, [])

  // Merge traffic + HPA into chart data with a 'gap' field for the error zone
  const chartData = useMemo(() => {
    return trafficData.map((pt, i) => {
      const hpaPt = hpaData[i] || hpaData[hpaData.length - 1] || { pods: 2 }
      const scaledPods = hpaPt.pods * 10 // map pods 2-10 to 20-100 scale
      const gap = Math.max(0, pt.load - scaledPods)
      return { ...pt, gap }
    })
  }, [trafficData, hpaData])

  const showChart = step >= 0
  const showTraffic = step >= 1
  const showHpa = step >= 2
  const showAlert = step >= 3
  const showShatter = step >= 4

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
        @keyframes blink-red {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px red; }
          50% { opacity: 0.3; box-shadow: 0 0 2px red; }
        }
      `}</style>

      <motion.div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        animate={
          step >= 5
            ? { scale: 0.01, opacity: 0 }
            : {}
        }
        transition={
          step >= 5
            ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
            : {}
        }
      >
        {/* ── Label ── */}
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.7rem, 1.5vw, 0.95rem)',
            color: 'var(--neon-red)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            zIndex: 20,
            textShadow: '0 0 10px rgba(var(--neon-red-rgb),0.4)',
          }}
        >
          THE PROBLEM — REACTIVE SCALING
        </div>

        {/* ── Headline ── */}
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            marginTop: '12vh',
            zIndex: 20,
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
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                By the time HPA reacts...
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
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                ...your users have already left.
              </motion.h2>
            )}
          </AnimatePresence>
        </div>

        {/* ── Chart Panel ── */}
        {showChart && (
          <motion.div
            className="glass-panel"
            animate={
              showAlert && peakHit
                ? { x: [0, -4, 4, -4, 4, -2, 2, -2, 2, 0] }
                : {}
            }
            transition={{ duration: 0.4 }}
            style={{
              width: '80%',
              maxWidth: '1000px',
              height: '55vh',
              marginTop: '2vh',
              borderRadius: '16px',
              padding: '24px',
              position: 'relative',
              zIndex: 15,
            }}
          >
            {/* Traffic label */}
            {showTraffic && (
              <div
                style={{
                  position: 'absolute',
                  top: '32px',
                  right: step >= 2 ? '180px' : '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.55rem, 1vw, 0.75rem)',
                  color: 'var(--neon-red)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  zIndex: 10,
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--neon-red)',
                    boxShadow: '0 0 6px var(--neon-red)',
                  }}
                />
                REAL TRAFFIC
              </div>
            )}

            {/* HPA label */}
            {showHpa && (
              <div
                style={{
                  position: 'absolute',
                  top: '32px',
                  right: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.55rem, 1vw, 0.75rem)',
                  color: 'var(--neon-blue)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  zIndex: 10,
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--neon-blue)',
                    boxShadow: '0 0 6px var(--neon-blue)',
                  }}
                />
                HPA RESPONSE
              </div>
            )}

            {/* Error rate counter */}
            {showHpa && (
              <div
                style={{
                  position: 'absolute',
                  top: '32px',
                  left: '32px',
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(0.5rem, 0.8vw, 0.65rem)',
                    color: 'var(--text-dim)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  ERROR RATE
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                    fontWeight: 700,
                    color: 'var(--neon-red)',
                    textShadow: '0 0 12px rgba(var(--neon-red-rgb),0.3)',
                    lineHeight: 1,
                  }}
                >
                  {errorRateDisplay}%
                </div>
              </div>
            )}

            {/* Failing requests warning */}
            {showHpa && (
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.6rem, 1.1vw, 0.8rem)',
                  color: 'var(--light-red)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  zIndex: 10,
                  textShadow: '0 0 8px rgba(var(--neon-red-rgb),0.5)',
                  pointerEvents: 'none',
                }}
              >
                ⚠ REQUESTS FAILING
              </motion.div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-pink)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent-pink)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-pink)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--accent-pink)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(var(--text-dim-rgb),0.12)"
                  vertical={false}
                />
                <XAxis
                  dataKey="second"
                  tick={{ fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.15)' }}
                  tickLine={false}
                  label={{
                    value: 'Time (seconds)',
                    position: 'insideBottom',
                    offset: -5,
                    style: {
                      fill: 'var(--text-dim)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                    },
                  }}
                />
                {/* Left axis: Traffic load (0–100) */}
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  tick={{ fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.15)' }}
                  tickLine={false}
                  label={{
                    value: 'Load (%)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    style: {
                      fill: 'var(--text-dim)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                    },
                  }}
                />
                {/* Right axis: Pod count (0–10) */}
                {showHpa && (
                  <YAxis
                    yAxisId="pods"
                    orientation="right"
                    domain={[0, 10]}
                    tick={{ fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.15)' }}
                    tickLine={false}
                    label={{
                      value: 'Pods',
                      angle: 90,
                      position: 'insideRight',
                      offset: 10,
                      style: {
                        fill: 'var(--text-dim)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                      },
                    }}
                  />
                )}

                {/* Shaded error zone (gap between traffic and HPA) */}
                {showHpa && (
                  <Area
                    type="monotone"
                    dataKey="gap"
                    stroke="none"
                    fill="url(#errorGradient)"
                    isAnimationActive={false}
                    yAxisId="left"
                  />
                )}

                {/* Traffic load area (red) */}
                <Area
                  type="monotone"
                  dataKey="load"
                  stroke="var(--accent-pink)"
                  strokeWidth={2}
                  fill="url(#trafficGradient)"
                  isAnimationActive={false}
                  dot={false}
                  yAxisId="left"
                />

                {/* HPA response line (blue, delayed) */}
                {showHpa && (
                  <Line
                    type="monotone"
                    dataKey="pods"
                    data={hpaData}
                    stroke="var(--neon-blue)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    yAxisId="pods"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── Annotation ── */}
        {showAlert && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="font-body"
            style={{
              fontSize: 'clamp(0.65rem, 1vw, 0.8rem)',
              color: 'var(--text-dim)',
              textAlign: 'center',
              marginTop: '2vh',
              letterSpacing: '0.01em',
              zIndex: 20,
            }}
          >
            Traditional HPA: scale-up takes 90–180 seconds after CPU threshold is breached.
          </motion.p>
        )}

        {/* ── Alert Modal ── */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ y: -200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 50,
                padding: '16px',
              }}
            >
              <div
                style={{
                  maxWidth: '900px',
                  margin: '0 auto',
                  background: 'rgba(var(--neon-red-rgb), 0.9)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  borderRadius: '8px',
                  borderLeft: '4px solid var(--neon-red)',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 8px 32px rgba(var(--neon-red-rgb),0.3)',
                }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'var(--alert-red)',
                    boxShadow: '0 0 8px red',
                    animation: 'blink-red 0.8s ease-in-out infinite',
                    flexShrink: 0,
                  }}
                />
                <span
                  className="font-mono"
                  style={{
                    fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                    color: 'var(--text-inverse)',
                    lineHeight: 1.4,
                  }}
                >
                  [CRITICAL] CrashLoopBackOff detected on inference-service-7b4f9. OOMKilled. 47
                  pending requests dropped.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Shatter Number ── */}
        <AnimatePresence>
          {showShatter && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(4rem, 10vw, 8rem)',
                color: 'var(--neon-red)',
                textShadow: '0 0 40px rgba(var(--neon-red-rgb),0.5)',
                zIndex: 30,
                pointerEvents: 'none',
                display: 'flex',
                gap: '2px',
              }}
            >
              {shatterChars.map((char, i) => (
                <ShatterFragment
                  key={i}
                  char={char}
                  index={i}
                  total={shatterChars.length}
                  active={shatterActive}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
