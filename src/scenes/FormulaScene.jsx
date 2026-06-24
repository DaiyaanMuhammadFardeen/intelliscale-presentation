import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBackgroundMutation } from '../components/BackgroundContext'
import MatrixRain from '../components/MatrixRain'

const CPU_FORMULA = `REPLICAS = clamp(
  ⌈ max(predicted_rps / rps_per_pod,
        predicted_cpu% / cpu_threshold%) ⌉,
  MIN_REPLICAS,
  MAX_REPLICAS
)`

const GPU_FORMULA = `REPLICAS = clamp(
  ⌈ max(predicted_gpu_util% / gpu_threshold%,
        predicted_cpu% / cpu_threshold%) ⌉,
  MIN_REPLICAS,
  MAX_REPLICAS
)`

const CONFIDENCE_CODE = `IF confidence_interval_width > threshold:
  scale_conservatively()
ELSE:
  scale_aggressively()`

const LOG_LINES = [
  '[12:00:01] forecast: cpu=78.3%, ci_width=4.2% → CONFIDENT',
  '[12:00:01] target_replicas = ceil(78.3/20.0) = 4 → clamped to 4',
  '[12:00:01] current_replicas = 2 → SCALING UP to 4',
  '[12:00:02] kubectl patch deployment/inference-svc --replicas=4',
  '[12:00:02] scaling_action=UP | replicas=2→4 | confidence=HIGH',
]

function Arrow({ label, color }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 60,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div
        style={{
          width: '100%',
          height: 2,
          background: color,
          opacity: 0.4,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <motion.div
          animate={{ left: ['0%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: -3,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
          borderLeft: `8px solid ${color}`,
          opacity: 0.4,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-dim)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  )
}

export default function FormulaScene({ step }) {
  const { mutate } = useBackgroundMutation()
  const [typedChars, setTypedChars] = useState(0)
  const [typedChars2, setTypedChars2] = useState(0)
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [mode, setMode] = useState('cpu')
  const [showConfidence, setShowConfidence] = useState(false)
  const [logLinesVisible, setLogLinesVisible] = useState(0)
  const logPanelRef = useRef(null)

  // Background mutation
  useEffect(() => {
    mutate({ tint: { r: 0, g: 50, b: 0, opacity: 0.05 }, torusKnot: false })
  }, [mutate])

  // Step 1: Formula typewriter
  useEffect(() => {
    if (step < 1) return
    const formula = mode === 'cpu' ? CPU_FORMULA : GPU_FORMULA
    if (typedChars >= formula.length) {
      setShowAnnotations(true)
      return
    }
    const interval = setInterval(() => {
      setTypedChars((c) => Math.min(c + 1, formula.length))
    }, 40)
    return () => clearInterval(interval)
  }, [step, mode, typedChars])

  // Step 2: Confidence modifier typewriter
  useEffect(() => {
    if (step < 2) return
    setShowConfidence(true)
    if (typedChars2 >= CONFIDENCE_CODE.length) return
    const interval = setInterval(() => {
      setTypedChars2((c) => Math.min(c + 1, CONFIDENCE_CODE.length))
    }, 40)
    return () => clearInterval(interval)
  }, [step, typedChars2])

  // Step 4: Decision log line reveal
  useEffect(() => {
    if (step < 4) return
    if (logLinesVisible < LOG_LINES.length) {
      const t = setTimeout(() => setLogLinesVisible((v) => v + 1), 400)
      return () => clearTimeout(t)
    }
  }, [step, logLinesVisible])

  // Auto-scroll log panel
  useEffect(() => {
    if (logPanelRef.current) {
      logPanelRef.current.scrollTop = logPanelRef.current.scrollHeight
    }
  }, [logLinesVisible])

  const currentFormula = mode === 'cpu' ? CPU_FORMULA : GPU_FORMULA
  const typedFormula = currentFormula.slice(0, typedChars)

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
      {/* MatrixRain background */}
      {step >= 1 && <MatrixRain opacity={0.05} />}

      {/* ── Label ── */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.7rem, 1.5vw, 0.95rem)',
          color: 'var(--neon-green)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          zIndex: 20,
          textShadow: '0 0 10px rgba(var(--neon-green-rgb), 0.4)',
        }}
      >
        THE LOGIC — DECISION FORMULA
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
          {step < 5 ? (
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
              Every decision, fully auditable.
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
                Transparent.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ color: 'var(--neon-gold)' }}
              >
                Traceable.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{ color: 'rgb(var(--emerald-rgb))' }}
              >
                Configurable.
              </motion.span>
            </motion.h2>
          )}
        </AnimatePresence>
      </div>

      {/* ── Formula Area ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: step >= 1 ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 15,
          padding: '0 5vw',
          marginTop: '-4vh',
        }}
      >
        {/* Formula text */}
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '80%' }}>
          <pre
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(1rem, 2.5vw, 1.8rem)',
              color: 'var(--text-inverse)',
              lineHeight: 1.6,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {typedFormula.split('').map((char, i) => (
              <motion.span
                key={`${i}-${mode}`}
                initial={{ color: 'var(--neon-cyan)', textShadow: '0 0 6px var(--neon-cyan)' }}
                animate={{ color: 'var(--text-inverse)', textShadow: '0 0 0px transparent' }}
                transition={{ duration: 1, delay: 0 }}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(1rem, 2.5vw, 1.8rem)',
                }}
              >
                {char}
              </motion.span>
            ))}
            {typedChars < currentFormula.length && (
              <span
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: '1.2em',
                  background: 'var(--neon-green)',
                  marginLeft: 2,
                  animation: 'blink 0.8s step-end infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            )}
          </pre>
        </div>

        {/* Annotations */}
        <AnimatePresence>
          {showAnnotations && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'flex',
                gap: 32,
                justifyContent: 'center',
                marginTop: 24,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    color: 'var(--neon-cyan)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                  }}
                >
                  ━
                </span>
                <span
                  style={{
                    color: 'var(--neon-cyan)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(0.85rem, 1.3vw, 1rem)',
                  }}
                >
                  predicted_rps
                </span>
                <span
                  style={{
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                  }}
                >
                  — from Prophet forecast
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    color: 'rgb(var(--emerald-rgb))',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                  }}
                >
                  ━
                </span>
                <span
                  style={{
                    color: 'rgb(var(--emerald-rgb))',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(0.85rem, 1.3vw, 1rem)',
                  }}
                >
                  cpu_threshold%
                </span>
                <span
                  style={{
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                  }}
                >
                  — operator-configured
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    color: 'var(--neon-gold)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                  }}
                >
                  ━
                </span>
                <span
                  style={{
                    color: 'var(--neon-gold)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(0.85rem, 1.3vw, 1rem)',
                  }}
                >
                  clamp()
                </span>
                <span
                  style={{
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                  }}
                >
                  — safety guard rail
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Tabs */}
        <AnimatePresence>
          {showAnnotations && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                display: 'flex',
                gap: 0,
                justifyContent: 'center',
                marginTop: 32,
              }}
            >
              <button
                onClick={() => {
                  setMode('cpu')
                  setTypedChars(0)
                  setShowAnnotations(false)
                }}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  padding: '6px 16px',
                  borderRadius: '4px 0 0 4px',
                  border: '1px solid',
                  borderColor:
                    mode === 'cpu' ? 'var(--neon-green)' : 'rgba(var(--text-inverse-rgb),0.15)',
                  background:
                    mode === 'cpu' ? 'rgba(var(--matrix-green-rgb),0.1)' : 'transparent',
                  color: mode === 'cpu' ? 'var(--neon-green)' : 'var(--text-dim)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                [CPU MODE]
              </button>
              <button
                onClick={() => {
                  setMode('gpu')
                  setTypedChars(0)
                  setShowAnnotations(false)
                }}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  padding: '6px 16px',
                  borderRadius: '0 4px 4px 0',
                  border: '1px solid',
                  borderLeft: 'none',
                  borderColor:
                    mode === 'gpu' ? 'var(--neon-green)' : 'rgba(var(--text-inverse-rgb),0.15)',
                  background:
                    mode === 'gpu' ? 'rgba(var(--matrix-green-rgb),0.1)' : 'transparent',
                  color: mode === 'gpu' ? 'var(--neon-green)' : 'var(--text-dim)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                [GPU MODE]
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confidence modifier */}
        <AnimatePresence>
          {showConfidence && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                marginTop: 24,
                textAlign: 'center',
              }}
            >
              <pre
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.8rem, 1.8vw, 1.1rem)',
                  color: 'var(--neon-cyan)',
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {CONFIDENCE_CODE.slice(0, typedChars2)}
                {typedChars2 < CONFIDENCE_CODE.length && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: '1.1em',
                      background: 'var(--neon-cyan)',
                      marginLeft: 2,
                      animation: 'blink 0.8s step-end infinite',
                      verticalAlign: 'text-bottom',
                    }}
                  />
                )}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Flow Diagram ── */}
      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              bottom: '8vh',
              left: '25%',
              transform: 'translateX(-50%)',
              zIndex: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center',
              }}
            >
              <div
                className="glass-panel"
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  width: 120,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--neon-cyan)',
                  }}
                >
                  Prometheus
                  <br />
                  + DCGM
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-dim)',
                    marginTop: 4,
                  }}
                >
                  metrics source
                </div>
              </div>
              <Arrow label="raw metrics" color="var(--neon-cyan)" />
              <div
                className="glass-panel"
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  width: 120,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--neon-purple)',
                  }}
                >
                  Prophet
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-dim)',
                    marginTop: 4,
                  }}
                >
                  forecast + CI
                </div>
              </div>
              <Arrow label="forecast + CI" color="var(--neon-purple)" />
              <div
                className="glass-panel"
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  width: 120,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--neon-gold)',
                  }}
                >
                  Controller
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-dim)',
                    marginTop: 4,
                  }}
                >
                  target replicas
                </div>
              </div>
              <Arrow label="PATCH request" color="rgb(var(--emerald-rgb))" />
              <div
                className="glass-panel"
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  width: 120,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'rgb(var(--emerald-rgb))',
                  }}
                >
                  kubectl patch
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-dim)',
                    marginTop: 4,
                  }}
                >
                  action
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Decision Log Panel ── */}
      <AnimatePresence>
        {step >= 4 && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-panel"
            style={{
              position: 'absolute',
              right: '3vw',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 420,
              maxHeight: 300,
              borderRadius: 12,
              padding: 0,
              zIndex: 25,
              overflow: 'hidden',
            }}
          >
            {/* Title bar */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(var(--text-inverse-rgb),0.06)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--neon-cyan)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              [DECISION LOG]
            </div>

            {/* Log content */}
            <div
              ref={logPanelRef}
              style={{
                padding: '12px 16px',
                maxHeight: 240,
                overflowY: 'auto',
              }}
              className="hide-scrollbar"
            >
              {LOG_LINES.slice(0, logLinesVisible).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'rgba(var(--matrix-green-rgb),0.8)',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'rgb(var(--emerald-rgb))',
                      marginRight: 8,
                      verticalAlign: 'middle',
                      boxShadow: '0 0 4px rgba(var(--emerald-rgb),0.6)',
                    }}
                  />
                  {line}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Caption ── */}
      <AnimatePresence>
        {step >= 4 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-body"
            style={{
              position: 'absolute',
              bottom: '4vh',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 'clamp(0.85rem, 1.3vw, 1rem)',
              color: 'var(--text-dim)',
              textAlign: 'center',
              letterSpacing: '0.01em',
              zIndex: 20,
              maxWidth: 500,
            }}
          >
            Full audit trail. Forecast value, confidence, decision, and action — all
            logged.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Keyframes */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
