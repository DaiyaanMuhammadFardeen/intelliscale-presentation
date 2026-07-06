import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useBackgroundMutation } from '../components/BackgroundContext'

const GLITCH_CHARS = '#@%!&*^'
const TERMINAL_LINES = [
  '> INITIALIZING HPA++ v1.0...',
  '> LOADING FORECASTING ENGINE...',
  '> CONNECTING TO CLUSTER...',
  '> STATUS: ONLINE ██████████ 100%',
]

function glitchChar() {
  return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
}

// ─── Step 0: Scanline ───

function Scanline({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: '100%',
        height: '2px',
        background:
          'linear-gradient(90deg, transparent, var(--neon-cyan), transparent)',
        boxShadow:
          '0 0 12px var(--neon-cyan), 0 0 40px var(--neon-cyan)',
        zIndex: 30,
        pointerEvents: 'none',
        animation: 'scanline 1.5s linear forwards',
      }}
    />
  )
}

// ─── Step 0: Terminal Boot ───

function TerminalBoot({ visible }) {
  const [displayedLines, setDisplayedLines] = useState([])
  const [currentLineIdx, setCurrentLineIdx] = useState(0)
  const [currentCharIdx, setCurrentCharIdx] = useState(0)
  const [allDone, setAllDone] = useState(false)

  useEffect(() => {
    if (!visible || currentLineIdx >= TERMINAL_LINES.length) return

    const line = TERMINAL_LINES[currentLineIdx]
    if (currentCharIdx < line.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const copy = [...prev]
          copy[currentLineIdx] = line.slice(0, currentCharIdx + 1)
          return copy
        })
        setCurrentCharIdx((c) => c + 1)
      }, 60)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setCurrentLineIdx((i) => i + 1)
        setCurrentCharIdx(0)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [visible, currentLineIdx, currentCharIdx])

  useEffect(() => {
    if (currentLineIdx >= TERMINAL_LINES.length) {
      setAllDone(true)
    }
  }, [currentLineIdx])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '48px',
        left: '48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(0.7rem, 1.5vw, 1.1rem)',
        color: 'var(--neon-cyan)',
        lineHeight: 1.6,
        zIndex: 20,
        textShadow: '0 0 8px var(--neon-cyan)',
      }}
    >
      {TERMINAL_LINES.map((_, i) => {
        if (i > displayedLines.length) return null
        return (
          <div key={i} style={{ whiteSpace: 'pre' }}>
            {displayedLines[i] || ''}
            {i === Math.min(currentLineIdx, TERMINAL_LINES.length - 1) &&
              !allDone && <span className="terminal-cursor">▊</span>}
          </div>
        )
      })}
      {allDone && (
        <div style={{ whiteSpace: 'pre' }}>
          {displayedLines[TERMINAL_LINES.length - 1]}
          <span className="terminal-cursor">▊</span>
        </div>
      )}
    </div>
  )
}

// ─── Step 1: Glitch Title ───

function GlitchTitle({ trigger }) {
  const TITLE = 'HPA++'
  const [chars, setChars] = useState(() => TITLE.split('').map(glitchChar))
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    if (!trigger) return
    const interval = setInterval(() => {
      setChars((prev) => prev.map(glitchChar))
    }, 50)
    const timer = setTimeout(() => {
      clearInterval(interval)
      setChars(TITLE.split(''))
      setResolved(true)
    }, 800)
    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [trigger])

  if (!trigger) return null

  return (
    <h1
      className="font-display"
      style={{
        fontWeight: 700,
        fontSize: 'clamp(3rem, 8vw, 7rem)',
        color: 'var(--text-inverse)',
        textAlign: 'center',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        textShadow: '0 0 40px var(--bright-cyan), 0 0 80px var(--bright-cyan)',
        position: 'relative',
        zIndex: 15,
      }}
    >
      {chars.map((c, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            minWidth: c === ' ' ? '0.3em' : undefined,
            transition: resolved ? 'color 0.3s' : 'none',
          }}
        >
          {c}
        </span>
      ))}
    </h1>
  )
}

// ─── Step 2: Stat Badges ───

const BADGES = [
  { text: 'FASTER SCALING', color: 'var(--neon-cyan)' },
  { text: 'LOWER GPU QUEUE TIME', color: 'var(--neon-purple)' },
  { text: 'LESS RESOURCE WASTE', color: 'var(--neon-gold)' },
]

function StatBadges({ visible }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '32px',
        position: 'relative',
        zIndex: 15,
        // paddingTop: '36vh'
        // translateY:'-50%'
      }}
    >
      {BADGES.map((badge, i) => (
        <motion.div
          key={badge.text}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={
            visible
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 20, scale: 0.9 }
          }
          transition={{
            duration: 0.5,
            delay: i * 0.15,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            background: 'rgba(var(--bright-cyan-rgb),0.05)',
            border: `1px solid ${badge.color}`,
            borderRadius: '999px',
            padding: '8px 24px',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.6rem, 1.2vw, 0.85rem)',
            color: 'var(--text-primary)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            boxShadow: `0 0 12px ${badge.color}33, inset 0 0 12px ${badge.color}11`,
          }}
        >
          {badge.text}
        </motion.div>
      ))}
    </div>
  )
}

// ─── Step 3: Watermark ───

function Watermark({ visible }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.8 }}
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-dim)',
        zIndex: 20,
        letterSpacing: '0.02em',
      }}
    >
      Team Falah | DIU | AI for Cluster Intelligence
    </motion.div>
  )
}

// ─── Step 3: Enter Prompt (fixed centering) ───

function EnterPrompt({ visible }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '64px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
      }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={
          visible
            ? { opacity: 1, scale: [1, 1.05, 1] }
            : { opacity: 0 }
        }
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          display: 'inline-block',
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)',
          color: 'var(--neon-cyan)',
          textShadow: '0 0 12px var(--neon-cyan)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.08em',
        }}
      >
        PRESS ENTER TO BEGIN ▶
      </motion.span>
    </div>
  )
}

// ─── Step 3: Team Panel ───

const TEAM_MEMBERS = [
  { name: 'Sanzida Chowdhury Dristee', id: '222-15-6281', tag: 'Alumni' },
  { name: 'Ahmed Farhanur Rashid', id: '0242310005101839', tag: 'Student' },
  { name: 'Daiyaan Muhammad Fardeen', id: '222-15-6531', tag: 'Alumni' },
]

function TeamPanel({ visible }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: '-50%', y: 20 }}
      animate={visible ? { opacity: 1, x: '-50%', y: 0 } : { opacity: 0, x: '-50%', y: 20 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '110px',
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(0.55rem, 0.9vw, 0.75rem)',
        color: 'var(--text-dim)',
        lineHeight: 2,
        zIndex: 20,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        background: 'rgba(var(--bright-cyan-rgb), 0.03)',
        border: '1px solid rgba(var(--bright-cyan-rgb), 0.12)',
        borderRadius: '8px',
        padding: '16px 24px',
        minWidth: '300px',
      }}
    >
      <div
        style={{
          color: 'var(--neon-cyan)',
          fontSize: 'clamp(0.65rem, 1vw, 0.85rem)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          marginBottom: '6px',
          textTransform: 'uppercase',
          textShadow: '0 0 8px var(--neon-cyan)',
        }}
      >
        {'>>> TEAM FALAH'}
      </div>
      <div
        style={{
          borderTop: '1px solid rgba(var(--bright-cyan-rgb), 0.15)',
          marginBottom: '8px',
        }}
      />
      {TEAM_MEMBERS.map((m) => (
        <div
          key={m.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: 'var(--text-primary)' }}>{m.name}</span>
          <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
            {m.id}{m.tag ? ' (' + m.tag + ')' : ''}
          </span>
        </div>
      ))}
      <div
        style={{
          borderTop: '1px solid rgba(var(--bright-cyan-rgb), 0.15)',
          marginTop: '8px',
          marginBottom: '4px',
        }}
      />
      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem', letterSpacing: '0.04em' }}>
        DIU | AI for Cluster Intelligence
      </div>
    </motion.div>
  )
}

// ─── Main Scene ───

export default function TitleScene({ step }) {
  const { mutate } = useBackgroundMutation()
  const [scanlineDone, setScanlineDone] = useState(false)
  const [titleTriggered, setTitleTriggered] = useState(false)

  // Step 0: activate torus knot in background
  useEffect(() => {
    mutate({ torusKnot: true })
  }, [mutate])

  // Step 1: trigger glitch title reveal
  useEffect(() => {
    if (step >= 1) setTitleTriggered(true)
  }, [step])

  // Step 2: accelerate torus knot
  useEffect(() => {
    if (step >= 2) mutate({ torusKnotSpeed: 0.006 })
  }, [step, mutate])

  // Step 4: brighten background particles (launch effect)
  useEffect(() => {
    if (step >= 4) mutate({ particleOpacity: 1.5 })
  }, [step, mutate])

  const onScanlineComplete = useCallback(() => {
    setScanlineDone(true)
  }, [])

  // ── Step 4: Exit transition (zoom-in + fade) ──
  if (step >= 4) {
    return (
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1.3, opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
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
          // paddingBottom: '18vh',
        }}
      >
        <GlitchTitle trigger />
        <motion.p
          className="font-body"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            fontWeight: 400,
            fontSize: 'clamp(1rem, 2.5vw, 1.6rem)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginTop: '16px',
            letterSpacing: '0.01em',
          }}
        >
          AI-Powered Predictive Auto-Scaling &amp; GPU Scheduling
        </motion.p>
        <StatBadges visible />
        <TeamPanel visible />
      </motion.div>
    )
  }

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
        paddingBottom: '48vh',
      }}
    >
      <style>{`
        @keyframes scanline {
          0% { top: -2px; }
          100% { top: 100vh; }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .terminal-cursor {
          display: inline;
          animation: cursor-blink 0.8s step-end infinite;
          color: var(--neon-cyan);
          margin-left: 2px;
        }
      `}</style>

      {/* Step 0: Scanline effect (only on step 0) */}
      {step === 0 && <Scanline onComplete={onScanlineComplete} />}

      {/* Step 0: Terminal typing */}
      {step === 0 && <TerminalBoot visible={scanlineDone} />}

      {/* Steps 1+: Terminal fades + slides to bottom-left corner */}
      {step >= 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            left: '48px',
            opacity: 0.2,
            transform: 'translateY(40px) scale(0.85)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.7rem, 1.5vw, 1.1rem)',
              color: 'var(--neon-cyan)',
              lineHeight: 1.6,
              textShadow: '0 0 8px var(--neon-cyan)',
              whiteSpace: 'pre',
            }}
          >
            {'> INITIALIZING HPA++ v1.0...\n'}
            {'> LOADING FORECASTING ENGINE...\n'}
            {'> CONNECTING TO CLUSTER...\n'}
            {'> STATUS: ONLINE ██████████ 100%'}
            <span className="terminal-cursor">▊</span>
          </div>
        </div>
      )}

      {/* Step 1: Glitch title */}
      <GlitchTitle trigger={titleTriggered} />

      {/* Step 1: Subtitle */}
      <motion.p
        className="font-body"
        initial={{ opacity: 0, y: 24 }}
        animate={
          step >= 1
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 24 }
        }
        transition={{
          duration: 0.7,
          delay: step >= 1 ? 0.3 : 0,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{
          fontWeight: 400,
          fontSize: 'clamp(1rem, 2.5vw, 1.6rem)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginTop: '16px',
          letterSpacing: '0.01em',
          position: 'relative',
          zIndex: 15,
        }}
      >
        AI-Powered Predictive Auto-Scaling &amp; GPU Scheduling
      </motion.p>

      {/* Step 2: Stat badges */}
      <StatBadges visible={step >= 2} />

      {/* Step 3: Watermark top-left */}
      <Watermark visible={step >= 3} />

      {/* Step 3: Enter prompt bottom-center */}
      <EnterPrompt visible={step >= 3} />

      {/* Step 3: Team info panel bottom-right */}
      <TeamPanel visible={step >= 3} />
    </div>
  )
}
