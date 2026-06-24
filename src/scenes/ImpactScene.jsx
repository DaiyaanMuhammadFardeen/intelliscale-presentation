import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBackgroundMutation } from '../components/BackgroundContext'

/* ══════════════════════════════════════════════════════════════
   CSS Keyframes & Global Styles
   ══════════════════════════════════════════════════════════════ */

const IMPACT_STYLES = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10% { transform: translateX(-3px); }
    20% { transform: translateX(3px); }
    30% { transform: translateX(-3px); }
    40% { transform: translateX(3px); }
    50% { transform: translateX(-2px); }
    60% { transform: translateX(2px); }
    70% { transform: translateX(-1px); }
    80% { transform: translateX(1px); }
  }

  @keyframes breathe {
    0%, 100% { transform: scale(0.92); opacity: 0.3; }
    50% { transform: scale(1.12); opacity: 0.55; }
  }

  @keyframes drawLine {
    to { stroke-dashoffset: 0; }
  }

  @keyframes barFill {
    from { width: 0%; }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`

/* ══════════════════════════════════════════════════════════════
   Stat Data
   ══════════════════════════════════════════════════════════════ */

const STATS = [
  { range: '30–50%', target: 50, label: 'FASTER SCALING RESPONSE', color: 'var(--neon-cyan)' },
  { range: '20–30%', target: 30, label: 'LOWER REQUEST LATENCY', color: 'var(--neon-green)' },
  { range: '40–60%', target: 60, label: 'REDUCED GPU QUEUE TIME', color: 'var(--neon-purple)' },
  { range: '15–25%', target: 25, label: 'HIGHER GPU UTILISATION', color: 'var(--neon-purple)' },
  { range: '15–25%', target: 25, label: 'LOWER CLOUD COSTS', color: 'var(--neon-gold)' },
]

const INSIGHTS = [
  {
    metric: 'COLD START',
    value: '0',
    unit: '%',
    desc: 'Predictive pre-scaling eliminates cold starts during flash sales',
    color: 'var(--neon-green)',
  },
  {
    metric: 'GPU UTILISATION',
    value: '92',
    unit: '%',
    desc: 'RL-based scheduling keeps GPUs loaded vs industry average ~60%',
    color: 'var(--neon-purple)',
  },
  {
    metric: 'DEVOPS OVERHEAD',
    value: '-62',
    unit: '%',
    desc: 'Zero-touch operations via automated anomaly detection & scaling',
    color: 'var(--neon-cyan)',
  },
  {
    metric: 'INCIDENT RESPONSE',
    value: '8×',
    unit: 'faster',
    desc: 'Anomaly detection flags resource contention before users notice',
    color: 'var(--neon-gold)',
  },
]

/* ══════════════════════════════════════════════════════════════
   Particle Logo — renders "IntelliScale" from animated particles
   ══════════════════════════════════════════════════════════════ */

function ParticleLogo({ active }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W = 500
    const H = 90
    canvas.width = W * 2 // retina
    canvas.height = H * 2
    ctx.scale(2, 2)
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'

    // Draw text offscreen to sample pixel positions
    ctx.font = 'bold 48px "Space Grotesk", sans-serif'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('IntelliScale', W / 2, H / 2)

    const imageData = ctx.getImageData(0, 0, W * 2, H * 2)
    const px = imageData.data

    // Sample pixels where alpha > 128 — grab ~250 points
    const targets = []
    const step = 3
    for (let y = 0; y < H * 2; y += step) {
      for (let x = 0; x < W * 2; x += step) {
        const i = (y * W * 2 + x) * 4
        if (px[i + 3] > 128) {
          targets.push({ x: x / 2, y: y / 2 })
        }
      }
    }

    // Pick up to 250 random samples
    const shuffled = targets.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(250, shuffled.length))

    // Create particles: start at random positions, animate to targets
    const palette = ['#0891b2', '#d97706', '#ffffff', '#0891b2', '#ffffff']
    const particles = selected.map((t) => ({
      sx: Math.random() * W,
      sy: Math.random() * H,
      tx: t.x,
      ty: t.y,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: 1.2 + Math.random() * 1.8,
    }))

    let start = null
    const duration = 1800

    const animate = (now) => {
      if (!start) start = now
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - t, 4) // ease-out quart

      ctx.clearRect(0, 0, W, H)

      particles.forEach((p) => {
        const x = p.sx + (p.tx - p.sx) * ease
        const y = p.sy + (p.ty - p.sy) * ease
        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.6 + 0.4 * ease
        ctx.fill()
        ctx.globalAlpha = 1
      })

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Draw final text on top
        ctx.clearRect(0, 0, W, H)
        ctx.font = 'bold 48px "Space Grotesk", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#0891b2'
        ctx.shadowColor = 'rgba(8,145,178,0.5)'
        ctx.shadowBlur = 20
        ctx.fillText('IntelliScale', W / 2, H / 2)
        ctx.shadowBlur = 0
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        margin: '0 auto',
        maxWidth: '100%',
      }}
    />
  )
}

/* ══════════════════════════════════════════════════════════════
   ImpactStat — single stat row with count-up + shake
   ══════════════════════════════════════════════════════════════ */

function ImpactStat({ stat, index, active }) {
  const [displayValue, setDisplayValue] = useState(0)
  const [shaking, setShaking] = useState(false)
  const intervalRef = useRef(null)

  // Trigger shake on appearance
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => {
      setShaking(true)
      setTimeout(() => setShaking(false), 100)
    }, 50)
    return () => clearTimeout(timer)
  }, [active])

  // Count-up
  useEffect(() => {
    if (!active) {
      setDisplayValue(0)
      return
    }
    const target = stat.target
    const startTime = Date.now()
    const totalDuration = 1200

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / totalDuration, 1)
      // Ease toward end
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(eased * target))
      if (progress >= 1) clearInterval(intervalRef.current)
    }, 70)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [active, stat.target])

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 12, delay: index * 0.6 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        animation: shaking ? 'shake 0.1s ease-in-out' : 'none',
      }}
    >
      {/* Number */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          fontWeight: 700,
          color: stat.color,
          textShadow: `0 0 20px rgba(${['var(--neon-cyan-rgb)', 'var(--neon-green-rgb)', 'var(--neon-purple-rgb)', 'var(--neon-purple-rgb)', 'var(--neon-gold-rgb)'][index]}, 0.27)`,
          lineHeight: 1,
        }}
      >
        {displayValue}%
      </div>
      {/* Range display */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)',
          color: stat.color,
          opacity: 0.6,
          letterSpacing: '0.08em',
        }}
      >
        {stat.range}
      </div>
      {/* Label */}
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(0.8rem, 1.3vw, 1rem)',
          color: 'var(--text-dim)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          textAlign: 'center',
          maxWidth: 220,
        }}
      >
        {stat.label}
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ProgressBar — red baseline + accent improvement
   ══════════════════════════════════════════════════════════════ */

function ProgressBar({ stat, visible }) {
  if (!visible) return null
  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto', marginTop: 4 }}>
      <div
        style={{
          width: '100%',
          height: 4,
          borderRadius: 2,
          background: 'rgba(var(--text-inverse-rgb),0.08)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Baseline (red-ish) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${50 + stat.target / 2}%`,
            background: 'rgba(var(--muted-red-rgb), 0.35)',
            borderRadius: 2,
          }}
        />
        {/* Improvement (accent) */}
        <div
          style={{
            position: 'absolute',
            left: `${50}%`,
            top: 0,
            height: '100%',
            width: 0,
            background: stat.color,
            borderRadius: 2,
            animation: `barFill 0.8s ease-out forwards`,
            animationDelay: '0.2s',
          }}
        />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Typewriter — types text char by char
   ══════════════════════════════════════════════════════════════ */

function Typewriter({ text, speed = 40, active, style = {} }) {
  const [chars, setChars] = useState(0)

  useEffect(() => {
    if (!active) { setChars(0); return }
    if (chars >= text.length) return
    const interval = setInterval(() => {
      setChars((c) => Math.min(c + 1, text.length))
    }, speed)
    return () => clearInterval(interval)
  }, [active, chars, text, speed])

  if (!active) return null

  return (
    <span style={{ fontFamily: 'var(--font-mono)', ...style }}>
      {text.slice(0, chars)}
      {chars < text.length && (
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1.1em',
            background: style.color || 'var(--neon-green)',
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            animation: 'cursorBlink 0.8s step-end infinite',
          }}
        />
      )}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN SCENE — ImpactScene
   ══════════════════════════════════════════════════════════════ */

export default function ImpactScene({ step }) {
  const { mutate } = useBackgroundMutation()
  const [showResults, setShowResults] = useState(false)
  const [statsVisible, setStatsVisible] = useState(0)
  const [showDivider, setShowDivider] = useState(false)
  const [showTagline, setShowTagline] = useState(false)
  const [taglineWords, setTaglineWords] = useState(0)
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [showTeam, setShowTeam] = useState(false)
  const [showInsights, setShowInsights] = useState(0)
  const [showCTA, setShowCTA] = useState(false)
  const [fadeToBlack, setFadeToBlack] = useState(false)
  const [creditLines, setCreditLines] = useState(0)
  const [showParticleLogo, setShowParticleLogo] = useState(false)

  const timersRef = useRef([])

  // Helper to queue delayed actions
  const queueTimer = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }, [])

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout)
  }, [])

  /* ── Background mutation ── */
  useEffect(() => {
    if (step > 0) {
      mutate({
        tint: { r: 13, g: 10, b: 20, opacity: 0.5 },
        particleOpacity: 0.4,
      })
    } else {
      mutate({
        tint: { r: 13, g: 10, b: 20, opacity: 0.3 },
        particleOpacity: 0.2,
      })
    }
  }, [step, mutate])

  /* ── Step 0: "RESULTS." after 1s pause ── */
  useEffect(() => {
    if (step !== 0) return
    const timer = setTimeout(() => setShowResults(true), 1000)
    return () => clearTimeout(timer)
  }, [step])

  /* ── Step 1: Stats materialize one by one ── */
  useEffect(() => {
    if (step < 1) { setStatsVisible(0); return }
    // Reset when entering step 1
    setStatsVisible(0)
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    STATS.forEach((_, i) => {
      queueTimer(() => setStatsVisible(i + 1), i * 600)
    })
  }, [step, queueTimer])

  /* ── Step 2: Divider, tagline, particle logo ── */
  useEffect(() => {
    if (step < 2) {
      setShowDivider(false)
      setShowTagline(false)
      setTaglineWords(0)
      setShowParticleLogo(false)
      setShowInsights(0)
      return
    }
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    queueTimer(() => setShowDivider(true), 0)
    queueTimer(() => setShowTagline(true), 600)
    // Word-by-word tagline
    queueTimer(() => setTaglineWords(1), 800)
    queueTimer(() => setTaglineWords(2), 950)
    queueTimer(() => setTaglineWords(3), 1100)
    // Particle logo after tagline
    queueTimer(() => setShowParticleLogo(true), 1400)
    // Key insights stagger after logo
    queueTimer(() => setShowInsights(1), 1900)
    queueTimer(() => setShowInsights(2), 2200)
    queueTimer(() => setShowInsights(3), 2500)
    queueTimer(() => setShowInsights(4), 2800)
  }, [step, queueTimer])

  /* ── Step 3: Progress bars, team info ── */
  useEffect(() => {
    if (step < 3) {
      setShowProgressBar(false)
      setShowTeam(false)
      return
    }
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    queueTimer(() => setShowProgressBar(true), 0)
    queueTimer(() => setShowTeam(true), 400)
  }, [step, queueTimer])

  /* ── Step 4: CTA button ── */
  useEffect(() => {
    if (step < 4) { setShowCTA(false); return }
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    queueTimer(() => setShowCTA(true), 200)
  }, [step, queueTimer])

  /* ── Step 5: Credit sequence (triggered by Enter) ── */
  useEffect(() => {
    if (step < 5) return
    setFadeToBlack(true)
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    // Type each credit line
    queueTimer(() => setCreditLines(1), 800)
    queueTimer(() => setCreditLines(2), 2600)
    queueTimer(() => setCreditLines(3), 4400)
    // After all typed, wait 2s then restart
    queueTimer(() => {
      window.location.reload()
    }, 7500)
  }, [step, queueTimer])

  /* ── Enter key listener (triggers step 5) ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && step >= 4 && step < 5) {
        // We don't control step from here — the parent does.
        // Instead, dispatch an event the parent listens for.
        window.dispatchEvent(new CustomEvent('impact-credit', { detail: 5 }))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step])

  const taglineText = ['Proactive.', 'Risk-Aware.', 'Intelligent.']
  const taglineColors = ['var(--neon-cyan)', 'var(--neon-gold)', 'var(--text-inverse)']

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
        justifyContent: 'center',
      }}
    >
      <style>{IMPACT_STYLES}</style>

      {/* ── Gold radial glow (breathing) ── */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80vw',
          height: '80vh',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(var(--neon-gold-rgb),0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
          animation: 'breathe 3s ease-in-out infinite',
        }}
      />

      {/* ══════════ STEP 0: "RESULTS." ══════════ */}
      <AnimatePresence>
        {step === 0 && showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              color: 'var(--text-inverse)',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              zIndex: 20,
            }}
          >
            RESULTS.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ STEP 1: Impact Stats ══════════ */}
      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'clamp(1.5rem, 3vh, 2.5rem)',
              zIndex: 20,
              position: 'relative',
              padding: '0 4vw',
              maxWidth: 900,
              justifyItems: 'center',
            }}
          >
            {STATS.map((stat, i) => (
              <ImpactStat
                key={stat.label}
                stat={stat}
                index={i}
                active={i < statsVisible}
              />
            ))}

            {/* ── Step 2: Divider line ── */}
            <AnimatePresence>
              {showDivider && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ width: '60%', maxWidth: 400, marginTop: 8 }}
                >
                  <svg
                    width="100%"
                    height="3"
                    viewBox="0 0 400 3"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="0" y1="1.5" x2="400" y2="1.5"
                      stroke="url(#dividerGrad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="400"
                      strokeDashoffset="400"
                      style={{ animation: 'drawLine 0.5s ease-out forwards' }}
                    />
                    <defs>
                      <linearGradient id="dividerGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--neon-cyan)" />
                        <stop offset="50%" stopColor="var(--neon-gold)" />
                        <stop offset="100%" stopColor="var(--neon-cyan)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Step 2: Tagline (word by word) ── */}
            {showTagline && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex',
                  gap: '0.6em',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginTop: 4,
                }}
              >
                {taglineText.map((word, i) => (
                  <motion.span
                    key={word}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: i < taglineWords ? 1 : 0, y: i < taglineWords ? 0 : 10 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                      color: taglineColors[i],
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.div>
            )}

            {/* ── Step 2: Particle Logo ── */}
            <AnimatePresence>
              {showParticleLogo && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ marginTop: 8 }}
                >
                  <ParticleLogo active={showParticleLogo} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Step 2: Key Insights Cards ── */}
            {showInsights > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 10,
                  marginTop: 16,
                  maxWidth: 700,
                }}
              >
                {INSIGHTS.map((insight, i) => (
                  <motion.div
                    key={insight.metric}
                    initial={{ opacity: 0, scale: 0.85, y: 12 }}
                    animate={
                      i < showInsights
                        ? { opacity: 1, scale: 1, y: 0 }
                        : { opacity: 0, scale: 0.85, y: 12 }
                    }
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    style={{
                      background: 'rgba(var(--black-rgb),0.35)',
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                      border: `1px solid rgba(${['var(--neon-green-rgb)', 'var(--neon-purple-rgb)', 'var(--neon-cyan-rgb)', 'var(--neon-gold-rgb)'][i]}, 0.2)`,
                      borderRadius: 8,
                      padding: '8px 14px',
                      minWidth: 140,
                      flex: '1 1 auto',
                      maxWidth: 200,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'clamp(0.7rem, 1vw, 0.8rem)',
                        color: insight.color,
                        letterSpacing: '0.1em',
                        opacity: 0.7,
                        marginBottom: 2,
                      }}
                    >
                      {insight.metric}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: 'clamp(1rem, 2vw, 1.4rem)',
                        color: insight.color,
                        lineHeight: 1.2,
                      }}
                    >
                      {insight.value}
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'clamp(0.7rem, 1.05vw, 0.85rem)',
                          fontWeight: 400,
                          opacity: 0.6,
                          marginLeft: 4,
                        }}
                      >
                        {insight.unit}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'clamp(0.7rem, 1vw, 0.8rem)',
                        color: 'var(--text-dim)',
                        lineHeight: 1.4,
                        marginTop: 3,
                      }}
                    >
                      {insight.desc}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── Step 3: Progress Bars ── */}
            {step >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 12,
                  width: '100%',
                  maxWidth: 400,
                }}
              >
                {STATS.map((stat) => (
                  <ProgressBar key={stat.label} stat={stat} visible={showProgressBar} />
                ))}
              </motion.div>
            )}

            {/* ── Step 3: Team Info ── */}
            <AnimatePresence>
              {showTeam && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(0.75rem, 1.2vw, 0.95rem)',
                    color: 'var(--text-dim)',
                    textAlign: 'center',
                    marginTop: 16,
                    lineHeight: 1.6,
                    letterSpacing: '0.04em',
                  }}
                >
                  Concept for Hackathon by Team Falah
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ STEP 4: CTA Button ══════════ */}
      <AnimatePresence>
        {showCTA && step < 5 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            onClick={() => window.dispatchEvent(new CustomEvent('scene-jump', { detail: 7 }))}
            style={{
              position: 'absolute',
              bottom: 'clamp(3rem, 6vh, 5rem)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.7rem, 1.1vw, 0.9rem)',
              color: 'rgba(var(--emerald-rgb),0.85)',
              background: 'rgba(var(--black-rgb),0.4)',
              border: '1px solid rgba(var(--emerald-rgb),0.25)',
              borderRadius: 6,
              padding: '12px 28px',
              cursor: 'pointer',
              letterSpacing: '0.06em',
              zIndex: 30,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(var(--neon-cyan-rgb),0.6)'
              e.currentTarget.style.color = 'var(--neon-cyan)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(var(--neon-cyan-rgb),0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(var(--emerald-rgb),0.25)'
              e.currentTarget.style.color = 'rgba(var(--emerald-rgb),0.85)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            [ VIEW ARCHITECTURE DEEP DIVE ]
          </motion.button>
        )}
      </AnimatePresence>

      {/* ══════════ STEP 5: Credit Sequence ══════════ */}
      <AnimatePresence>
        {fadeToBlack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'black',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            {creditLines >= 1 && (
              <div style={{ fontSize: 'clamp(0.8rem, 1.3vw, 1rem)', color: 'var(--neon-green)' }}>
                <Typewriter
                  text="> IntelliScale v1.0"
                  speed={45}
                  active={creditLines >= 1}
                  style={{ color: 'var(--neon-green)' }}
                />
              </div>
            )}
            {creditLines >= 2 && (
              <div style={{ fontSize: 'clamp(0.8rem, 1.3vw, 1rem)', color: 'var(--neon-cyan)' }}>
                <Typewriter
                  text='> Concept for Hackathon by Team Falah'
                  speed={45}
                  active={creditLines >= 2}
                  style={{ color: 'var(--neon-cyan)' }}
                />
              </div>
            )}
            {creditLines >= 3 && (
              <div style={{ fontSize: 'clamp(0.8rem, 1.3vw, 1rem)', color: 'var(--neon-gold)' }}>
                <Typewriter
                  text='> "Making clusters intelligent."'
                  speed={45}
                  active={creditLines >= 3}
                  style={{ color: 'var(--neon-gold)' }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
