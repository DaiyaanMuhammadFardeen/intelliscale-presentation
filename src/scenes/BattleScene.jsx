import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useBackgroundMutation } from '../components/BackgroundContext'
import useBattleSimData from '../hooks/useBattleSimData'

/* ──────────────────────────── Helpers ──────────────────────────── */

function CountUp({ target, decimals = 1, suffix = '%', duration = 1500, active }) {
  const [value, setValue] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    if (!active) { setValue(0); return }
    const start = performance.now()
    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(eased * target)
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [active, target, duration])

  return (
    <span>{value.toFixed(decimals)}{suffix}</span>
  )
}

/* ──────────────────────────── CSS Keyframes ──────────────────────────── */

const STYLES = `
  @keyframes dividerGlow {
    0%, 100% { box-shadow: 0 0 8px var(--neon-gold), 0 0 2px var(--neon-gold); }
    50%      { box-shadow: 0 0 16px var(--neon-gold), 0 0 6px var(--neon-gold); }
  }

  @keyframes neonFlicker {
    0%   { opacity: 1; }
    10%  { opacity: 0.4; }
    15%  { opacity: 0.7; }
    30%  { opacity: 1; }
    40%  { opacity: 0.3; }
    50%  { opacity: 0.9; }
    55%  { opacity: 0.5; }
    70%  { opacity: 1; }
    80%  { opacity: 0.6; }
    100% { opacity: 1; }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%  { transform: translateX(-4px); }
    20%  { transform: translateX(4px); }
    30%  { transform: translateX(-4px); }
    40%  { transform: translateX(4px); }
    50%  { transform: translateX(-2px); }
    60%  { transform: translateX(2px); }
    70%  { transform: translateX(-1px); }
    80%  { transform: translateX(1px); }
  }

  @keyframes blinkYellow {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.25; }
  }

  @keyframes goldFlash {
    0%   { box-shadow: 0 0 30px rgba(var(--neon-gold-rgb), 0.6); }
    100% { box-shadow: 0 0 0px transparent; }
  }

  @keyframes goldPulse {
    0%, 100% { box-shadow: 0 0 10px rgba(var(--neon-gold-rgb), 0.3); }
    50%      { box-shadow: 0 0 24px rgba(var(--neon-gold-rgb), 0.5); }
  }
`

/* ──────────────────────────── Shared Components ──────────────────────────── */

const CHART_FONT = { fontFamily: 'var(--font-mono)', fontSize: 11 }

function GlassPanel({ children, style = {}, ...rest }) {
  return (
    <div
      style={{
        background: 'rgba(var(--black-rgb),0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(var(--text-inverse-rgb),0.06)',
        borderRadius: 12,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

function ErrorRateBlock({ rate, color, show }) {
  if (!show) return null
  return (
    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, textAlign: 'right' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.7rem, 1.1vw, 0.9rem)',
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
          fontSize: 'clamp(1rem, 2vw, 1.4rem)',
          fontWeight: 700,
          color,
          textShadow: `0 0 12px ${color}33`,
          lineHeight: 1.2,
        }}
      >
        {rate}
      </div>
    </div>
  )
}

function PodCountLabel({ pods, color, extra, show }) {
  if (!show) return null
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(0.85rem, 1.3vw, 1rem)',
        color,
        marginTop: 8,
        letterSpacing: '0.02em',
      }}
    >
      Active Pods: {pods}
      {extra && (
        <span style={{ color: 'var(--neon-gold)', marginLeft: 12, fontSize: 'clamp(0.75rem, 1.1vw, 0.95rem)' }}>
          {extra}
        </span>
      )}
    </div>
  )
}

/* ──────────────────────────── Main Scene ──────────────────────────── */

export default function BattleScene({ step }) {
  const { mutate } = useBackgroundMutation()

  const [simActive, setSimActive] = useState(false)
  const [goldFlash, setGoldFlash] = useState(false)
  const [currentErrorRate, setCurrentErrorRate] = useState('0.0')

  const { hpaData, intelliData, hpaFinalErrorRate, intelliFinalErrorRate, tick, simDone } = useBattleSimData(simActive)

  // No background mutation — tint overlays are CSS-only

  // Activate simulation at step 2
  useEffect(() => {
    setSimActive(step >= 2)
  }, [step])

  // Track live HPA error rate for the counter
  useEffect(() => {
    if (hpaData.length > 0) {
      const latest = hpaData[hpaData.length - 1]
      setCurrentErrorRate((latest.errorRate * 100).toFixed(1))
    }
  }, [hpaData])

  // Gold flash on right side when pods jump
  useEffect(() => {
    if (step === 2 && tick === 1) {
      setGoldFlash(true)
      const timer = setTimeout(() => setGoldFlash(false), 500)
      return () => clearTimeout(timer)
    }
  }, [step, tick])

  /* ── Layout weights ── */
  const leftFlex = step >= 5 ? 3 : 5
  const rightFlex = step >= 5 ? 7 : 5
  const leftDimmed = step >= 5

  /* ── Show/hide gates ── */
  const showCharts = step >= 1
  const showWave = step >= 2
  const showConsequences = step >= 3
  const showScoreboard = step >= 4
  const showWinner = step >= 5

  /* ── Current pods (from data or defaults) ── */
  const hpaPods = hpaData.length > 0 ? hpaData[hpaData.length - 1].pods : 2
  const intelliPods = intelliData.length > 0 ? intelliData[intelliData.length - 1].pods : 2

  /* ── Current HPA++ forecast buffer label ── */
  const intelliForecastExtra =
    showWave && intelliPods >= 6 ? 'Forecast Buffer: 2→6 pods staged' :
    showWave ? `Auto-scaled to ${intelliPods} pods` : ''

  /* ── Winner headline ── */
  const winnerHeadline = "30–50% faster response. Zero error rate during flash spikes."

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

      {/* ── Tint overlays ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: 'rgba(var(--neon-red-rgb), 0.08)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: 'rgba(var(--bright-cyan-rgb), 0.05)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Center divider ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 2,
          height: '100%',
          background: 'linear-gradient(180deg, transparent, var(--neon-gold), transparent)',
          animation: 'dividerGlow 2s ease-in-out infinite',
          zIndex: 15,
          pointerEvents: 'none',
        }}
      />

      {/* ── VS / WINNER label ── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence mode="wait">
          {!showScoreboard ? (
            <motion.div
              key="vs"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                color: 'var(--neon-gold)',
                animation: 'neonFlicker 3s ease-in-out infinite',
                textShadow: '0 0 12px var(--neon-gold)',
                userSelect: 'none',
              }}
            >
              VS
            </motion.div>
          ) : (
            <motion.div
              key="winner"
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(1.2rem, 2.5vw, 2rem)',
                color: 'var(--neon-gold)',
                textShadow: '0 0 12px var(--neon-gold)',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              WINNER
              <span style={{ fontSize: 'clamp(1rem, 2vw, 1.6rem)' }}>▶</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Arena layout ── */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          zIndex: 5,
        }}
      >
        {/* ══════════ LEFT HALF — HPA ══════════ */}
        <motion.div
          layout
          animate={{ flex: leftFlex, opacity: leftDimmed ? 0.3 : 1, filter: leftDimmed ? 'saturate(0.2)' : 'none' }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '4vh 2vw',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Shake wrapper for consequences */}
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              animation: showConsequences ? 'shake 0.5s ease-in-out' : 'none',
            }}
          >
            {/* Arena label */}
            <motion.div
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
                color: 'var(--neon-red)',
                letterSpacing: '0.15em',
                textShadow: '0 0 10px rgba(var(--neon-red-rgb),0.4)',
                marginBottom: 4,
              }}
            >
              TRADITIONAL HPA
            </motion.div>
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--text-dim)',
                letterSpacing: '0.08em',
                marginBottom: '2vh',
              }}
            >
              Reactive. Blind. Too Late.
            </motion.div>

            {/* Chart panel */}
            <AnimatePresence>
              {showCharts && (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ flex: 1, minHeight: 0 }}
                >
                  <GlassPanel
                    style={{
                      height: '55vh',
                      position: 'relative',
                      /* Striped overlay for request drop zone */
                      ...(showConsequences
                        ? {
                            backgroundImage:
                              'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(var(--red-rgb),0.15) 4px, rgba(var(--red-rgb),0.15) 8px)',
                          }
                        : {}),
                    }}
                  >
                    {/* Waiting label */}
                    {showWave && !showConsequences && (
                      <motion.div
                        animate={{ opacity: [1, 0.25, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        style={{
                          position: 'absolute',
                          top: 16,
                          left: 16,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'clamp(0.55rem, 0.9vw, 0.72rem)',
                          color: 'var(--amber-light)',
                          letterSpacing: '0.04em',
                          zIndex: 10,
                          pointerEvents: 'none',
                        }}
                      >
                        ⏱ Waiting for threshold breach...
                      </motion.div>
                    )}

                    {/* SERVICE DEGRADED banner */}
                    {showConsequences && (
                      <motion.div
                        initial={{ y: -40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(var(--neon-red-rgb), 0.9)',
                          backdropFilter: 'blur(4px)',
                          color: 'var(--text-inverse)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'clamp(0.6rem, 1vw, 0.8rem)',
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          textAlign: 'center',
                          padding: '6px 0',
                          borderRadius: '0 0 8px 8px',
                          zIndex: 10,
                          textShadow: '0 0 8px rgba(var(--neon-red-rgb),0.5)',
                        }}
                      >
                        SERVICE DEGRADED
                      </motion.div>
                    )}

                    {/* REQUEST DROP ZONE label */}
                    {showConsequences && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 60,
                          left: 16,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'clamp(0.75rem, 1.1vw, 0.95rem)',
                          color: 'var(--alert-red)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          zIndex: 10,
                          pointerEvents: 'none',
                          textShadow: '0 0 6px rgba(var(--alert-red-rgb),0.4)',
                        }}
                      >
                        REQUEST DROP ZONE
                      </div>
                    )}

                    <ErrorRateBlock
                      rate={showConsequences ? '18.3%' : `${currentErrorRate}%`}
                      color="var(--neon-red)"
                      show={showWave}
                    />

                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hpaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="hpaTrafficGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent-pink)" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="var(--accent-pink)" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="hpaPodGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--neon-blue)" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="var(--neon-blue)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--text-dim-rgb),0.12)" vertical={false} />
                        <XAxis
                          dataKey="time"
                          tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                          axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.15)' }}
                          tickLine={false}
                          label={{
                            value: 'Time (seconds)',
                            position: 'insideBottom',
                            offset: -5,
                            style: { fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 },
                          }}
                        />
                        <YAxis
                          yAxisId="left"
                          domain={[0, 100]}
                          tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                          axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.15)' }}
                          tickLine={false}
                          label={{
                            value: 'Load',
                            angle: -90,
                            position: 'insideLeft',
                            offset: 10,
                            style: { fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 },
                          }}
                        />
                        <YAxis
                          yAxisId="pods"
                          orientation="right"
                          domain={[0, 10]}
                          tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                          axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.15)' }}
                          tickLine={false}
                          label={{
                            value: 'Pods',
                            angle: 90,
                            position: 'insideRight',
                            offset: 10,
                            style: { fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 },
                          }}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="traffic"
                          stroke="var(--accent-pink)"
                          strokeWidth={2}
                          fill="url(#hpaTrafficGrad)"
                          isAnimationActive={false}
                          dot={false}
                        />
                        <Area
                          yAxisId="pods"
                          type="monotone"
                          dataKey="pods"
                          stroke="var(--neon-blue)"
                          strokeWidth={2}
                          fill="url(#hpaPodGrad)"
                          isAnimationActive={false}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </GlassPanel>

                  <PodCountLabel pods={hpaPods} color="var(--neon-red)" show />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ══════════ RIGHT HALF — HPA++ ══════════ */}
        <motion.div
          layout
          animate={{ flex: rightFlex }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '4vh 2vw',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Arena label */}
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
              color: 'var(--neon-cyan)',
              letterSpacing: '0.15em',
              textShadow: '0 0 10px rgba(var(--neon-cyan-rgb),0.4)',
              marginBottom: 4,
              textAlign: 'right',
            }}
          >
            HPA++
          </motion.div>
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              marginBottom: '2vh',
              textAlign: 'right',
            }}
          >
            Proactive. Predicted. Ready.
          </motion.div>

          {/* Chart panel */}
          <AnimatePresence>
            {showCharts && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  boxShadow: goldFlash
                    ? ['0 0 30px rgba(var(--neon-gold-rgb), 0.6)', '0 0 0px transparent']
                    : showConsequences
                    ? '0 0 16px rgba(var(--neon-gold-rgb), 0.35)'
                    : '0 0 0px transparent',
                }}
                transition={{
                  scale: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
                  opacity: { duration: 0.6 },
                  boxShadow: { duration: showConsequences ? 1 : 0.5 },
                }}
                style={{ flex: 1, minHeight: 0 }}
              >
                <GlassPanel style={{ height: '55vh', position: 'relative' }}>
                  {/* ALL REQUESTS SERVED banner */}
                  {showConsequences && (
                    <motion.div
                      initial={{ y: -40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.2 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(var(--neon-green-rgb), 0.9)',
                        backdropFilter: 'blur(4px)',
                        color: 'var(--text-inverse)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'clamp(0.6rem, 1vw, 0.8rem)',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textAlign: 'center',
                        padding: '6px 0',
                        borderRadius: '0 0 8px 8px',
                        zIndex: 10,
                      }}
                    >
                      ALL REQUESTS SERVED
                    </motion.div>
                  )}

                  <ErrorRateBlock
                    rate="0.0%"
                    color="var(--emerald)"
                    show={showWave}
                  />

                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={intelliData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="intelliTrafficGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-pink)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--accent-pink)" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="intelliPodGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--bright-cyan)" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="var(--bright-cyan)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--text-dim-rgb),0.12)" vertical={false} />
                      <XAxis
                        dataKey="time"
                        tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                        axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.15)' }}
                        tickLine={false}
                        label={{
                          value: 'Time (seconds)',
                          position: 'insideBottom',
                          offset: -5,
                          style: { fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 },
                        }}
                      />
                      <YAxis
                        yAxisId="left"
                        domain={[0, 100]}
                        tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                        axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.15)' }}
                        tickLine={false}
                        label={{
                          value: 'Load',
                          angle: -90,
                          position: 'insideLeft',
                          offset: 10,
                          style: { fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 },
                        }}
                      />
                      <YAxis
                        yAxisId="pods"
                        orientation="right"
                        domain={[0, 10]}
                        tick={{ ...CHART_FONT, fill: 'var(--text-dim)' }}
                        axisLine={{ stroke: 'rgba(var(--text-dim-rgb),0.15)' }}
                        tickLine={false}
                        label={{
                          value: 'Pods',
                          angle: 90,
                          position: 'insideRight',
                          offset: 10,
                          style: { fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 },
                        }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="traffic"
                        stroke="var(--accent-pink)"
                        strokeWidth={2}
                        fill="url(#intelliTrafficGrad)"
                        isAnimationActive={false}
                        dot={false}
                      />
                      <Area
                        yAxisId="pods"
                        type="monotone"
                        dataKey="pods"
                        stroke="var(--bright-cyan)"
                        strokeWidth={2}
                        fill="url(#intelliPodGrad)"
                        isAnimationActive={false}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassPanel>

                <PodCountLabel
                  pods={intelliPods}
                  color="var(--neon-cyan)"
                  extra={intelliForecastExtra}
                  show
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* ── Center stopwatch (Step 3) ── */}
      <AnimatePresence>
        {showConsequences && !showScoreboard && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(var(--black-rgb),0.6)',
              backdropFilter: 'blur(6px)',
              borderRadius: 10,
              padding: '10px 16px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--neon-red)', fontWeight: 700 }}>
              HPA Response: 118s
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--neon-gold)', fontWeight: 700 }}>
              HPA++ Response: 0s (pre-scaled)
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scoreboards (Step 4) ── */}
      <AnimatePresence>
        {showScoreboard && !showWinner && (
          <>
            {/* Left scoreboard */}
            <motion.div
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                position: 'absolute',
                top: '15%',
                left: '5%',
                width: '40%',
                maxWidth: 380,
                background: 'rgba(var(--black-rgb),0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--neon-red)',
                borderRadius: 12,
                padding: '20px 24px',
                zIndex: 25,
              }}
            >
              {[
                { label: 'Error Rate', value: 18.3, decimals: 1, suffix: '%' },
                { label: 'Latency P99', value: 2840, decimals: 0, suffix: 'ms', displayOverride: '2,840ms' },
                { label: 'Pod Readiness', value: 118, decimals: 0, suffix: 's', displayOverride: '118s' },
                { label: 'Cost Efficiency', value: 47, decimals: 0, suffix: '%' },
              ].map((row, i) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: i < 3 ? '1px solid rgba(var(--text-inverse-rgb),0.06)' : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'clamp(0.85rem, 1.3vw, 1rem)',
                      color: 'var(--text-dim)',
                    }}
                  >
                    ❌ {row.label}:
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'clamp(0.75rem, 1.1vw, 0.9rem)',
                      color: 'var(--neon-red)',
                      fontWeight: 700,
                    }}
                  >
                    {row.displayOverride || (
                      <CountUp target={row.value} decimals={row.decimals} suffix={row.suffix} active={showScoreboard} />
                    )}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Right scoreboard */}
            <motion.div
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                position: 'absolute',
                top: '15%',
                right: '5%',
                width: '40%',
                maxWidth: 380,
                background: 'rgba(var(--black-rgb),0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--neon-cyan)',
                borderRadius: 12,
                padding: '20px 24px',
                zIndex: 25,
              }}
            >
              {[
                { label: 'Error Rate', value: 0, decimals: 1, suffix: '%', color: 'var(--emerald)' },
                { label: 'Latency P99', value: 340, decimals: 0, suffix: 'ms', displayOverride: '340ms', color: 'var(--neon-cyan)' },
                { label: 'Pod Readiness', value: 0, decimals: 0, suffix: 's', displayOverride: '0s (pre-scaled)', color: 'var(--neon-cyan)' },
                { label: 'Cost Efficiency', value: 71, decimals: 0, suffix: '%', color: 'var(--neon-cyan)' },
              ].map((row, i) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: i < 3 ? '1px solid rgba(var(--text-inverse-rgb),0.06)' : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'clamp(0.85rem, 1.3vw, 1rem)',
                      color: 'var(--text-dim)',
                    }}
                  >
                    ✅ {row.label}:
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'clamp(0.75rem, 1.1vw, 0.9rem)',
                      color: row.color,
                      fontWeight: 700,
                    }}
                  >
                    {row.displayOverride || (
                      <CountUp target={row.value} decimals={row.decimals} suffix={row.suffix} active={showScoreboard} />
                    )}
                  </span>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Winner reveal (Step 5) ── */}
      <AnimatePresence>
        {showWinner && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              position: 'absolute',
              bottom: '8vh',
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
                textShadow: '0 0 20px rgba(var(--neon-cyan-rgb),0.4)',
              }}
            >
              {winnerHeadline}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
