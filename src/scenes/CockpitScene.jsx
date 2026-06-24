import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useBackgroundMutation } from '../components/BackgroundContext'

/* ──────────────────────────── CSS Keyframes ──────────────────────────── */

const STYLES = `
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }

  @keyframes pulseGreen {
    0%, 100% { box-shadow: 0 0 8px var(--neon-green); }
    50% { box-shadow: 0 0 20px var(--neon-green), 0 0 40px rgba(var(--neon-green-rgb), 0.3); }
  }

  @keyframes flashRed {
    0%, 100% { opacity: 1; background: rgba(var(--neon-red-rgb), 0.9); }
    50% { opacity: 0.7; background: rgba(var(--neon-red-rgb), 1); }
  }

  @keyframes logScroll {
    0% { transform: translateY(0); }
    100% { transform: translateY(-100%); }
  }

  @keyframes dotPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.7; }
  }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    background: rgba(var(--text-inverse-rgb), 0.1);
    border-radius: 2px;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--neon-green);
    cursor: pointer;
    box-shadow: 0 0 10px var(--neon-green);
  }

  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--neon-green);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 10px var(--neon-green);
  }
`

/* ──────────────────────────── Helpers ──────────────────────────── */

const CHART_FONT = { fontFamily: 'var(--font-mono)', fontSize: 11 }

function GlassPanel({ children, style = {}, ...rest }) {
  return (
    <div
      style={{
        background: 'rgba(var(--bg-dark-rgb), 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(var(--neon-green-rgb), 0.15)',
        borderRadius: 12,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(var(--black-rgb), 0.3), inset 0 1px 0 rgba(var(--text-inverse-rgb), 0.05)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

function CardLabel({ children, color = 'var(--neon-green)' }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(0.55rem, 0.9vw, 0.7rem)',
        color,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 8,
        textShadow: `0 0 8px ${color}33`,
      }}
    >
      {children}
    </div>
  )
}

/* ──────────────────────────── Main Scene ──────────────────────────── */

export default function CockpitScene({ step }) {
  const { mutate } = useBackgroundMutation()
  const [flashSale, setFlashSale] = useState(false)
  const [scrubberIndex, setScrubberIndex] = useState(0)
  const [logLines, setLogLines] = useState([])
  const [surgeAlert, setSurgeAlert] = useState(null)
  const logTimerRef = useRef(null)
  const liveTimerRef = useRef(null)
  const liveIndexRef = useRef(0)

  /* ── Pre-generate synthetic datasets ── */
  const generateTimeSeries = useCallback((length = 200, base = 50, variance = 20) => {
    return Array.from({ length }, (_, i) => ({
      time: `${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
      value: Math.max(0, base + (Math.sin(i * 0.1) * variance) + (Math.random() - 0.5) * 10),
    }))
  }, [])

  const cpuBaseData = useMemo(() => generateTimeSeries(600, 55, 15), [generateTimeSeries])
  const gpuBaseData = useMemo(() => generateTimeSeries(600, 65, 20), [generateTimeSeries])

  /* ── CPU pod scaling data ── */
  const cpuPodsData = useMemo(() => {
    return Array.from({ length: 600 }, (_, i) => {
      const basePods = 3
      let pods = basePods
      if (i > 80 && i < 120) pods = flashSale ? 6 : 4
      else if (i >= 120) pods = flashSale ? 8 : 5
      return {
        time: `${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
        cpuPods: pods,
        gpuPods: Math.floor(pods * 0.7),
      }
    })
  }, [flashSale])

  /* ── Apply flash sale spike ── */
  const cpuData = useMemo(() => {
    return cpuBaseData.map((pt, i) => ({
      ...pt,
      actual: pt.value,
      forecast: pt.value + (Math.sin(i * 0.08) * 8),
      upper: pt.value + 12,
      lower: Math.max(0, pt.value - 12),
      ...(flashSale && i >= 80 && i <= 120 ? { actual: pt.value + 60, forecast: pt.value + 65, upper: pt.value + 75, lower: pt.value + 50 } : {}),
    }))
  }, [cpuBaseData, flashSale])

  const gpuData = useMemo(() => {
    return gpuBaseData.map((pt, i) => ({
      ...pt,
      actual: pt.value,
      forecast: pt.value + (Math.sin(i * 0.06) * 10),
      upper: pt.value + 18,
      lower: Math.max(0, pt.value - 18),
      ...(flashSale && i >= 80 && i <= 120 ? { actual: pt.value + 60, forecast: pt.value + 70, upper: pt.value + 85, lower: pt.value + 55 } : {}),
    }))
  }, [gpuBaseData, flashSale])

  /* ── Decision log entries ── */
  const allLogEntries = useMemo(() => [
    { time: '12:00:00', color: 'var(--cyan-500)', text: 'cpu_forecast=72.1% ci=3.8% | CONFIDENT → scale inference-api 3→5' },
    { time: '12:00:30', color: 'var(--soft-purple)', text: 'gpu_forecast=81.4% ci=6.1% | BORDERLINE → scale-conservatively gpu-worker 2→3' },
    { time: '12:01:00', color: 'var(--soft-purple)', text: 'gpu_forecast=89.2% ci=2.9% | CONFIDENT → scale gpu-worker 3→6' },
    { time: '12:01:00', color: 'var(--neon-gold)', text: 'sched: gpu-inference-job-0847 → node-09 (predicted free in 47s)' },
    { time: '12:01:30', color: 'var(--neon-gold)', text: 'node-09 capacity freed → gpu-inference-job-0847 ACTIVATED (0s queue)' },
    ...(flashSale ? [
      { time: '12:01:45', color: 'var(--alert-red)', text: '⚡ TRAFFIC SURGE: +340% request volume detected' },
      { time: '12:01:45', color: 'var(--cyan-500)', text: 'cpu_forecast=94.2% ci=1.2% | CONFIDENT → scale inference-api 5→12' },
      { time: '12:01:45', color: 'var(--soft-purple)', text: 'gpu_forecast=97.1% ci=0.8% | CONFIDENT → scale gpu-worker 6→14' },
      { time: '12:02:00', color: 'var(--neon-gold)', text: 'sched: batch-prioritize gpu-inference-job-0847,0848,0849 → preempt low-priority' },
      { time: '12:02:15', color: 'var(--emerald)', text: '✅ ALL PODS PRE-SCALED — zero queue time during surge' },
    ] : []),
  ], [flashSale])

  /* ── Live data index ── */
  const liveDataIndex = useRef(0)

  /* ── Live streaming interval ── */
  useEffect(() => {
    if (step === 0 && !flashSale) {
      liveTimerRef.current = setInterval(() => {
        liveIndexRef.current = Math.min(liveIndexRef.current + 1, cpuData.length - 1)
      }, 500)
      return () => clearInterval(liveTimerRef.current)
    }
    return () => clearInterval(liveTimerRef.current)
  }, [step, flashSale, cpuData.length])

  /* ── Log entry timer (step 0) ── */
  useEffect(() => {
    if (step === 0) {
      setLogLines([])
      let idx = 0
      logTimerRef.current = setInterval(() => {
        if (idx < 5) {
          setLogLines((prev) => [...prev, allLogEntries[idx]])
          idx++
        } else {
          clearInterval(logTimerRef.current)
        }
      }, 1200)
      return () => clearInterval(logTimerRef.current)
    }
  }, [step, allLogEntries])

  /* ── Flash sale surge alert ── */
  useEffect(() => {
    if (flashSale && step >= 2) {
      setSurgeAlert('surge')
      const timer = setTimeout(() => setSurgeAlert('ready'), 2000)
      return () => clearTimeout(timer)
    } else {
      setSurgeAlert(null)
    }
  }, [flashSale, step])

  /* ── Background mutation ── */
  useEffect(() => {
    if (step > 0 && step < 6) {
      mutate({ particleOpacity: 0.15, tint: { r: 10, g: 26, b: 42, opacity: 0.8 } })
    } else {
      mutate({ particleOpacity: 1, tint: null })
    }
  }, [step, mutate])

  /* ── Scrubber → chart data ── */
  const displayCpuData = useMemo(() => {
    if (step === 1) return cpuData.slice(0, scrubberIndex + 1)
    if (step === 0) return cpuData.slice(0, Math.min(liveIndexRef.current + 1, cpuData.length))
    return cpuData
  }, [step, scrubberIndex, cpuData])

  const displayGpuData = useMemo(() => {
    if (step === 1) return gpuData.slice(0, scrubberIndex + 1)
    if (step === 0) return gpuData.slice(0, Math.min(liveIndexRef.current + 1, gpuData.length))
    return gpuData
  }, [step, scrubberIndex, gpuData])

  const displayPodsData = useMemo(() => {
    if (step === 1) return cpuPodsData.slice(0, scrubberIndex + 1)
    return cpuPodsData
  }, [step, scrubberIndex, cpuPodsData])

  /* ── Log entries for current time ── */
  const displayLogLines = useMemo(() => {
    if (step === 1) {
      const timeStr = `${String(Math.floor(scrubberIndex / 60)).padStart(2, '0')}:${String(scrubberIndex % 60).padStart(2, '0')}`
      return allLogEntries.filter((e) => {
        const parts = e.time.split(':')
        const entrySecs = parseInt(parts[1]) * 60 + parseInt(parts[2])
        return entrySecs <= scrubberIndex
      })
    }
    return step === 0 ? logLines : allLogEntries
  }, [step, scrubberIndex, allLogEntries, logLines])

  /* ── Step gating ── */
  const showDashboard = step >= 0 && step < 5
  const showScrubber = step === 1
  const showFlashToggle = step >= 2 && step < 5
  const showZoom = step === 3
  const showDownload = step === 4
  const isExiting = step >= 5

  /* ── Card scatter targets for exit animation ── */
  const scatterTargets = [
    { x: '-80vw', y: '-80vh', rotate: -45 },
    { x: '80vw', y: '-80vh', rotate: 45 },
    { x: '-80vw', y: '80vh', rotate: -30 },
    { x: '80vw', y: '80vh', rotate: 30 },
  ]

  /* ── GPU chart zoom layout ── */
  const gpuChartLayout = showZoom
    ? { position: 'absolute', top: '5%', left: '5%', right: '5%', height: '55vh', zIndex: 40 }
    : {}

  return (
    <div
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 10,
        background: 'var(--bg-dark)',
      }}
    >
      <style>{STYLES}</style>

      {/* ── Scanline effect ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, transparent, rgba(var(--neon-green-rgb), 0.3), transparent)',
          animation: 'scanline 8s linear infinite',
          pointerEvents: 'none',
          zIndex: 50,
          opacity: 0.4,
        }}
      />

      {/* ── Top Label ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -40 : 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.7rem, 1.3vw, 0.9rem)',
          color: 'var(--neon-green)',
          letterSpacing: '0.2em',
          textShadow: '0 0 12px rgba(var(--neon-green-rgb), 0.4)',
          zIndex: 30,
          whiteSpace: 'nowrap',
        }}
      >
        THE EXPERIENCE — OPERATOR DASHBOARD
      </motion.div>

      {/* ── Headline ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -20 : 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{
          position: 'absolute',
          top: 56,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          textAlign: 'center',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.h2
            key={step >= 4 ? 'morphed' : 'original'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {step >= 4 ? 'Your cluster, understood.' : 'Complete visibility. Complete trust.'}
          </motion.h2>
        </AnimatePresence>
      </motion.div>

      {/* ── Dashboard Grid ── */}
      {showDashboard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isExiting ? 0 : 1 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute',
            top: 110,
            left: '3vw',
            right: '3vw',
            bottom: showScrubber ? '140px' : '40px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr 0.8fr',
            gap: 16,
            zIndex: 20,
          }}
        >
          {/* ── Card 1: CPU Forecast vs Actual ── */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isExiting
                ? { x: scatterTargets[0].x, y: scatterTargets[0].y, rotate: scatterTargets[0].rotate, opacity: 0 }
                : { scale: 1, opacity: 1 }
            }
            transition={
              isExiting
                ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                : { type: 'spring', stiffness: 200, damping: 20, delay: 0 }
            }
            style={{ minHeight: 0, overflow: 'hidden' }}
          >
            <GlassPanel style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardLabel>FORECAST vs ACTUAL — CPU%</CardLabel>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayCpuData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cpuActualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--cyan-500)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--cyan-500)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="cpuConfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--cyan-500)" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="var(--cyan-500)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--text-dim-rgb),0.1)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                      axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.12)' }}
                      tickLine={false}
                      interval={99}
                    />
                    <YAxis
                      domain={[0, 120]}
                      tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                      axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.12)' }}
                      tickLine={false}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(var(--bg-dark-rgb),0.9)',
                        border: '1px solid rgba(var(--neon-green-rgb),0.2)',
                        borderRadius: 8,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="upper"
                      stroke="none"
                      fill="url(#cpuConfGrad)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      stroke="none"
                      fill="var(--bg-dark)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="var(--cyan-500)"
                      strokeWidth={2}
                      fill="url(#cpuActualGrad)"
                      isAnimationActive={false}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="var(--cyan-500)"
                      strokeWidth={1.5}
                      strokeDasharray="6 3"
                      dot={false}
                      isAnimationActive={false}
                      opacity={0.5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>
          </motion.div>

          {/* ── Card 2: GPU Forecast vs Actual ── */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isExiting
                ? { x: scatterTargets[1].x, y: scatterTargets[1].y, rotate: scatterTargets[1].rotate, opacity: 0 }
                : showZoom
                ? { scale: 1, opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            transition={
              isExiting
                ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                : { type: 'spring', stiffness: 200, damping: 20, delay: 0.08 }
            }
            layout
            style={{
              minHeight: 0,
              overflow: 'hidden',
              ...(showZoom
                ? { position: 'absolute', top: '5%', left: '5%', right: '5%', height: '55vh', zIndex: 40 }
                : {}),
            }}
          >
            <GlassPanel
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: showZoom ? '1px solid rgba(var(--soft-purple-rgb), 0.3)' : undefined,
                boxShadow: showZoom ? '0 0 40px rgba(var(--soft-purple-rgb), 0.15)' : undefined,
              }}
            >
              <CardLabel color="var(--soft-purple)">FORECAST vs ACTUAL — GPU UTIL%</CardLabel>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayGpuData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gpuActualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--soft-purple)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--soft-purple)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gpuConfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--soft-purple)" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="var(--soft-purple)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--text-dim-rgb),0.1)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                      axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.12)' }}
                      tickLine={false}
                      interval={99}
                    />
                    <YAxis
                      domain={[0, 130]}
                      tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                      axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.12)' }}
                      tickLine={false}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(var(--bg-dark-rgb),0.9)',
                        border: '1px solid rgba(var(--soft-purple-rgb),0.2)',
                        borderRadius: 8,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="upper"
                      stroke="none"
                      fill="url(#gpuConfGrad)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      stroke="none"
                      fill="var(--bg-dark)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="var(--soft-purple)"
                      strokeWidth={2}
                      fill="url(#gpuActualGrad)"
                      isAnimationActive={false}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="var(--soft-purple)"
                      strokeWidth={1.5}
                      strokeDasharray="6 3"
                      dot={false}
                      isAnimationActive={false}
                      opacity={0.5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* ── Step 3 callout annotation ── */}
              {showZoom && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  style={{
                    position: 'absolute',
                    top: 60,
                    right: 20,
                    maxWidth: 260,
                    background: 'rgba(var(--bg-dark-rgb), 0.9)',
                    border: '1px solid rgba(var(--soft-purple-rgb), 0.3)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    zIndex: 50,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 20,
                      left: -8,
                      width: 0,
                      height: 0,
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderRight: '8px solid rgba(var(--soft-purple-rgb), 0.3)',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      color: 'var(--soft-purple)',
                      lineHeight: 1.5,
                    }}
                  >
                    Wider band = IntelliScale acts conservatively.
                    <br />
                    Narrower band = scales aggressively.
                    <br />
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem' }}>Risk-aware by design.</span>
                  </div>
                </motion.div>
              )}
            </GlassPanel>
          </motion.div>

          {/* ── Card 3: Pod Scaling Timeline (full-width middle row) ── */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isExiting
                ? { x: scatterTargets[2].x, y: scatterTargets[2].y, rotate: scatterTargets[2].rotate, opacity: 0 }
                : { scale: 1, opacity: 1 }
            }
            transition={
              isExiting
                ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                : { type: 'spring', stiffness: 200, damping: 20, delay: 0.16 }
            }
            style={{ gridColumn: '1 / -1', minHeight: 0, overflow: 'hidden' }}
          >
            <GlassPanel style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardLabel>POD SCALING TIMELINE</CardLabel>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayPodsData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--text-dim-rgb),0.1)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                      axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.12)' }}
                      tickLine={false}
                      interval={99}
                    />
                    <YAxis
                      domain={[0, 14]}
                      tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                      axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.12)' }}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(var(--bg-dark-rgb),0.9)',
                        border: '1px solid rgba(var(--neon-green-rgb),0.2)',
                        borderRadius: 8,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                      }}
                    />
                    <ReferenceLine
                      x={displayPodsData.length > 0 ? displayPodsData[Math.min(80, displayPodsData.length - 1)]?.time : undefined}
                      stroke="var(--neon-green)"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      label={{
                        value: 'NOW',
                        position: 'top',
                        fill: 'var(--neon-green)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                      }}
                    />
                    <Bar dataKey="cpuPods" fill="var(--cyan-500)" radius={[2, 2, 0, 0]} opacity={0.8} />
                    <Bar dataKey="gpuPods" fill="var(--soft-purple)" radius={[2, 2, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* ── Legend ── */}
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--cyan-500)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>CPU Pods</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--soft-purple)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>GPU Pods</span>
                </div>
              </div>
            </GlassPanel>
          </motion.div>

          {/* ── Card 4: Decision Log ── */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isExiting
                ? { x: scatterTargets[3].x, y: scatterTargets[3].y, rotate: scatterTargets[3].rotate, opacity: 0 }
                : { scale: 1, opacity: 1 }
            }
            transition={
              isExiting
                ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                : { type: 'spring', stiffness: 200, damping: 20, delay: 0.24 }
            }
            style={{ gridColumn: '1 / -1', minHeight: 0, overflow: 'hidden' }}
          >
            <GlassPanel style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardLabel color="var(--neon-gold)">DECISION LOG</CardLabel>
              <div
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    overflowY: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(0.55rem, 0.85vw, 0.7rem)',
                    lineHeight: 1.8,
                  }}
                  className="hide-scrollbar"
                >
                  {displayLogLines.filter(Boolean).map((entry, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '2px 0',
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: entry.color,
                          boxShadow: `0 0 6px ${entry.color}`,
                          flexShrink: 0,
                          marginTop: 5,
                          animation: 'dotPulse 2s ease-in-out infinite',
                        }}
                      />
                      <span style={{ color: 'var(--text-dim)' }}>[{entry.time}]</span>
                      <span style={{ color: entry.color }}>{entry.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}

      {/* ── Time Scrubber (Step 1) ── */}
      <AnimatePresence>
        {showScrubber && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              bottom: 30,
              left: '5vw',
              right: '5vw',
              zIndex: 30,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(0.6rem, 0.9vw, 0.75rem)',
                color: 'var(--neon-green)',
                letterSpacing: '0.08em',
                marginBottom: 8,
                textShadow: '0 0 8px rgba(var(--neon-green-rgb), 0.3)',
              }}
            >
              TIME SCRUBBER: Replay 10-minute window
            </div>
            <input
              type="range"
              min={0}
              max={599}
              value={scrubberIndex}
              onChange={(e) => setScrubberIndex(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(0.55rem, 0.8vw, 0.65rem)',
                color: 'var(--text-dim)',
                marginTop: 8,
                letterSpacing: '0.04em',
              }}
            >
              Operators can replay any window to audit every scaling and scheduling decision.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Flash Sale Toggle (Step 2+) ── */}
      <AnimatePresence>
        {showFlashToggle && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              top: 20,
              right: 24,
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(0.55rem, 0.8vw, 0.65rem)',
                color: flashSale ? 'var(--alert-red)' : 'var(--text-dim)',
                letterSpacing: '0.06em',
              }}
            >
              FLASH SALE
            </span>
            <button
              onClick={() => setFlashSale((f) => !f)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                background: flashSale ? 'var(--alert-red)' : 'rgba(var(--text-inverse-rgb),0.1)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.3s',
                boxShadow: flashSale ? '0 0 12px rgba(var(--alert-red-rgb),0.5)' : 'none',
              }}
            >
              <motion.div
                animate={{ x: flashSale ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--text-inverse)',
                  position: 'absolute',
                  top: 2,
                }}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Surge Alert Badge ── */}
      <AnimatePresence>
        {surgeAlert === 'surge' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'absolute',
              top: 60,
              right: 24,
              zIndex: 50,
              background: 'rgba(var(--neon-red-rgb), 0.9)',
              borderRadius: 8,
              padding: '8px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.6rem, 0.9vw, 0.75rem)',
              color: 'var(--text-inverse)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              animation: 'flashRed 0.5s ease-in-out infinite',
              boxShadow: '0 4px 20px rgba(var(--neon-red-rgb), 0.4)',
            }}
          >
            ⚡ TRAFFIC SURGE DETECTED
          </motion.div>
        )}
        {surgeAlert === 'ready' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'absolute',
              top: 60,
              right: 24,
              zIndex: 50,
              background: 'rgba(var(--neon-green-rgb), 0.9)',
              borderRadius: 8,
              padding: '8px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.6rem, 0.9vw, 0.75rem)',
              color: 'var(--text-inverse)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              animation: 'pulseGreen 2s ease-in-out infinite',
            }}
          >
            ✅ PRE-SCALED AND READY
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Download Report Button (Step 4) ── */}
      <AnimatePresence>
        {showDownload && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              textAlign: 'center',
            }}
          >
            <button
              onClick={() => {}}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(0.65rem, 1vw, 0.8rem)',
                color: 'var(--neon-green)',
                background: 'rgba(var(--neon-green-rgb), 0.1)',
                border: '1px solid rgba(var(--neon-green-rgb), 0.3)',
                borderRadius: 8,
                padding: '10px 24px',
                cursor: 'pointer',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                transition: 'all 0.3s',
                boxShadow: '0 0 20px rgba(var(--neon-green-rgb), 0.1)',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(var(--neon-green-rgb), 0.2)'
                e.target.style.boxShadow = '0 0 30px rgba(var(--neon-green-rgb), 0.2)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(var(--neon-green-rgb), 0.1)'
                e.target.style.boxShadow = '0 0 20px rgba(var(--neon-green-rgb), 0.1)'
              }}
            >
              ↓ DOWNLOAD REPORT
            </button>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(0.5rem, 0.75vw, 0.6rem)',
                color: 'var(--text-dim)',
                marginTop: 10,
                letterSpacing: '0.04em',
              }}
            >
              Every forecast, decision, and action is logged and exportable. Full audit trail.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
