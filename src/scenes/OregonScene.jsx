import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import CrystalSphere from '../components/CrystalSphere'
import { useBackgroundMutation } from '../components/BackgroundContext'
import {
  LineChart,
  Line,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

// ── Forecast Data Generator ────────────────────────────────────────────────

function generateForecastData(confidenceLevel) {
  const data = []
  // 30 historical points (sine-ish with noise)
  for (let i = 0; i < 30; i++) {
    const base = 40 + Math.sin(i / 5) * 15 + (Math.random() - 0.5) * 8
    data.push({
      time: `T-${29 - i}`,
      historical: Math.round(base * 10) / 10,
      forecast: null,
      forecastUpper: null,
      forecastLower: null,
    })
  }
  data[29].time = 'NOW'
  // 15 forecast points
  const lastVal = data[29].historical
  for (let i = 1; i <= 15; i++) {
    const progress = i / 15
    const spike = Math.sin(progress * Math.PI) * 25
    const forecast = lastVal + spike + (Math.random() - 0.5) * 3
    const ciWidth = (1 - confidenceLevel) * 30 * (1 + progress * 2)
    data.push({
      time: `T+${i}`,
      historical: null,
      forecast: Math.round(forecast * 10) / 10,
      forecastUpper: Math.round((forecast + ciWidth) * 10) / 10,
      forecastLower: Math.round(Math.max(0, forecast - ciWidth) * 10) / 10,
    })
  }
  return data
}

// ── Metric Badge Sparkline ─────────────────────────────────────────────────

function MetricBadge({ label, color, data, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.5, delay }}
      className="glass-panel"
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        minWidth: 150,
        flex: '0 0 auto',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color,
          letterSpacing: '0.1em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <ResponsiveContainer width="100%" height={40}>
        <LineChart data={data.map((v, i) => ({ i, v }))}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

// ── Spark Particles ────────────────────────────────────────────────────────

function SparkParticles({ active }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        angle: (i / 8) * Math.PI * 2,
        distance: 40 + Math.random() * 30,
      })),
    []
  )

  if (!active) return null

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: 0,
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--neon-gold)',
            boxShadow: '0 0 8px var(--neon-gold)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}

// ── Main Scene ─────────────────────────────────────────────────────────────

export default function OregonScene({ step }) {
  const { mutate } = useBackgroundMutation()
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [confidenceLevel, setConfidenceLevel] = useState(0.85)
  const [sphereColor, setSphereColor] = useState('var(--bright-cyan)')
  const [spherePulse, setSpherePulse] = useState(false)
  const [visiblePoints, setVisiblePoints] = useState(0)
  const [sparkActive, setSparkActive] = useState(false)

  // Background tint
  useEffect(() => {
    mutate({ tint: { r: 0, g: 200, b: 255, opacity: 0.15 } })
  }, [mutate])

  // Mouse tracking for crystal sphere parallax
  useEffect(() => {
    const handler = (e) => {
      setMouseX((e.clientX / window.innerWidth - 0.5) * 2)
      setMouseY((e.clientY / window.innerHeight - 0.5) * 2)
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  // Sphere color based on confidence
  useEffect(() => {
    if (confidenceLevel < 0.7) setSphereColor('var(--amber)')
    else if (confidenceLevel > 0.9) setSphereColor('var(--emerald)')
    else setSphereColor('var(--bright-cyan)')
  }, [confidenceLevel])

  // Sphere pulse on step 4
  useEffect(() => {
    if (step >= 4) setSpherePulse(true)
  }, [step])

  // Generate forecast data
  const chartData = useMemo(
    () => generateForecastData(confidenceLevel),
    [confidenceLevel]
  )

  // Data streaming animation (step >= 2)
  useEffect(() => {
    if (step < 2) return
    setVisiblePoints(0)
    let count = 0
    const interval = setInterval(() => {
      count++
      if (count <= 30) {
        setVisiblePoints(count)
      } else if (count === 31) {
        // Brief pause at the NOW divider
      } else if (count <= 46) {
        setVisiblePoints(count)
      } else {
        clearInterval(interval)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [step])

  const visibleData = useMemo(
    () => chartData.slice(0, visiblePoints),
    [chartData, visiblePoints]
  )

  // Metric badge data
  const metrics = useMemo(
    () => [
      { label: 'CPU%', color: 'var(--bright-cyan)', data: [45, 52, 48, 55, 58, 62, 65, 70, 68, 72] },
      { label: 'Memory%', color: 'var(--neon-blue)', data: [60, 58, 62, 65, 63, 68, 70, 72, 75, 78] },
      {
        label: 'GPU Util%',
        color: 'var(--soft-purple)',
        data: [30, 35, 38, 42, 48, 55, 60, 65, 70, 75],
      },
      {
        label: 'GPU Mem%',
        color: 'var(--pink)',
        data: [40, 42, 45, 48, 50, 52, 55, 58, 60, 62],
      },
    ],
    []
  )

  // Spark particles trigger on step 5
  useEffect(() => {
    if (step >= 5) {
      setSparkActive(true)
      const t = setTimeout(() => setSparkActive(false), 1000)
      return () => clearTimeout(t)
    }
  }, [step])

  const showSphere = step >= 1 && step < 6
  const showChart = step >= 2
  const showMetrics = step >= 3
  const showPredicts = step >= 4
  const showForecastCaption = step >= 5
  const isExiting = step >= 6

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
      {/* ── Shimmer keyframes ── */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: rgba(var(--bright-cyan-rgb), 0.2);
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--neon-cyan);
          cursor: pointer;
          box-shadow: 0 0 8px var(--neon-cyan);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--neon-cyan);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px var(--neon-cyan);
        }
      `}</style>

      {/* ── Label ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.5 }}
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
          textShadow: '0 0 10px rgba(var(--bright-cyan-rgb), 0.4)',
        }}
      >
        THE SOLUTION — FORECASTING ENGINE
      </motion.div>

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
              key="reacts"
              className="font-display"
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: isExiting ? 0 : 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 80,
                damping: 20,
              }}
              style={{
                fontWeight: 700,
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                color: 'var(--text-inverse)',
                letterSpacing: '-0.02em',
              }}
            >
              IntelliScale doesn't react.
            </motion.h2>
          ) : (
            <motion.h2
              key="predicts"
              className="font-display"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: isExiting ? 0 : 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                fontWeight: 700,
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                letterSpacing: '-0.02em',
              }}
            >
              <span style={{ color: 'var(--text-inverse)' }}>IntelliScale </span>
              <span
                style={{
                  background: 'linear-gradient(90deg, var(--gold), var(--light-gold), var(--gold))',
                  backgroundSize: '200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 2s linear infinite',
                }}
              >
                predicts.
              </span>
            </motion.h2>
          )}
        </AnimatePresence>
      </div>

      {/* ── Crystal Sphere ── */}
      <AnimatePresence>
        {showSphere && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 0 : 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: isExiting ? 0.5 : 1, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 15,
              pointerEvents: 'none',
            }}
          >
            <Canvas
              camera={{ position: [0, 0, 6], fov: 45 }}
              gl={{ alpha: true, antialias: true }}
            >
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <CrystalSphere
                color={sphereColor}
                mouseX={mouseX}
                mouseY={mouseY}
                pulse={spherePulse}
              />
            </Canvas>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Forecast Chart Panel ── */}
      <AnimatePresence>
        {showChart && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-panel"
            style={{
              position: 'absolute',
              bottom: '12%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(60vw, 700px)',
              padding: '16px 20px',
              borderRadius: 14,
              zIndex: 25,
            }}
          >
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart
                data={visibleData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(var(--text-dim-rgb),0.1)"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 10 }}
                   axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.15)' }}
                  tickLine={false}
                  interval={(tick) => {
                    const item = visibleData[tick]
                    return item && item.time === 'NOW'
                  }}
                  tickFormatter={(val) => (val === 'NOW' ? 'NOW' : '')}
                />
                <YAxis hide />
                {/* Confidence interval band */}
                <Area
                  type="monotone"
                  dataKey="forecastUpper"
                  stroke="none"
                  fill="var(--bright-cyan)"
                  fillOpacity={0.1}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="forecastLower"
                  stroke="none"
                  fill="var(--bright-cyan)"
                  fillOpacity={0.1}
                  isAnimationActive={false}
                />
                {/* Historical line */}
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="var(--bright-cyan)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
                {/* Forecast line (dashed) */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="var(--bright-cyan)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* NOW divider line */}
            {visiblePoints >= 30 && (
              <div
                style={{
                  position: 'absolute',
                  left: `${((30 - 0) / visibleData.length) * 100}%`,
                  top: 20,
                  bottom: 40,
                  width: 1,
                  background: 'var(--neon-cyan)',
                  opacity: 0.6,
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    left: -12,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--neon-cyan)',
                    letterSpacing: '0.05em',
                  }}
                >
                  NOW
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confidence Slider ── */}
      <AnimatePresence>
        {showMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              position: 'absolute',
              bottom: '4%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(50vw, 500px)',
              zIndex: 25,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--text-dim)',
                letterSpacing: '0.1em',
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              FORECAST CONFIDENCE THRESHOLD
            </div>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                color: 'var(--text-dim)',
                textAlign: 'center',
                marginTop: 6,
                lineHeight: 1.4,
              }}
            >
              Prophet provides native confidence intervals — IntelliScale only acts when confident
              enough.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Metric Badges ── */}
      <AnimatePresence>
        {showMetrics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isExiting ? 0 : 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              right: '4%',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              zIndex: 25,
            }}
          >
            {metrics.map((m, i) => (
              <MetricBadge
                key={m.label}
                label={m.label}
                color={m.color}
                data={m.data}
                delay={i * 0.1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Feature Text (step 4+) ── */}
      <AnimatePresence>
        {showPredicts && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isExiting ? 0 : 0.7, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="font-body"
            style={{
              position: 'absolute',
              top: '22%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 'clamp(0.7rem, 1vw, 0.85rem)',
              color: 'var(--text-dim)',
              textAlign: 'center',
              zIndex: 20,
              whiteSpace: 'nowrap',
            }}
          >
            Prophet ∙ Multi-seasonality ∙ Native confidence intervals ∙ Per-metric models ∙ Fast
            rolling-window retraining
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Forecast Arrow / Spark (step 5) ── */}
      <AnimatePresence>
        {showForecastCaption && (
          <>
            {/* Glowing particle tracer */}
            <motion.div
              initial={{ left: '42%', top: '55%', opacity: 1, scale: 1 }}
              animate={{
                left: ['42%', '58%'],
                top: ['55%', '42%'],
                opacity: [1, 1, 0],
                scale: [1, 1.5, 0],
              }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--neon-gold)',
                boxShadow: '0 0 16px var(--neon-gold), 0 0 32px rgba(var(--neon-gold-rgb), 0.4)',
                zIndex: 30,
                pointerEvents: 'none',
              }}
            />

            {/* Spark particles burst */}
            <div
              style={{
                position: 'absolute',
                left: '58%',
                top: '42%',
                zIndex: 30,
                pointerEvents: 'none',
              }}
            >
              <SparkParticles active={sparkActive} />
            </div>

            {/* Caption */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="font-body"
              style={{
                position: 'absolute',
                bottom: '28%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
                color: 'var(--text-primary)',
                textAlign: 'center',
                zIndex: 25,
                whiteSpace: 'nowrap',
              }}
            >
              5 minutes of forewarning. Enough to pre-scale. Enough to pre-schedule.
            </motion.p>
          </>
        )}
      </AnimatePresence>

      {/* ── Exit Flash Overlay ── */}
      {step >= 6 && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.2, delay: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'white',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
