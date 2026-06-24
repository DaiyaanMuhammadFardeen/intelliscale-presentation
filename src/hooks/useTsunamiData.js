import { useState, useEffect, useRef, useCallback } from 'react'

const TOTAL_POINTS = 100
const INTERVAL_MS = 200
const HPA_DELAY_POINTS = 15 // 3 seconds behind traffic

/* ── Pre-compute the full traffic waveform ── */
function buildTrafficWave() {
  const wave = []
  for (let i = 0; i < TOTAL_POINTS; i++) {
    let load
    if (i < 20) {
      load = 20 + (Math.random() - 0.5) * 4 // baseline ~20%
    } else if (i < 70) {
      const t = (i - 20) / 50 // 0 → 1 over 50 points
      load = 20 + 75 * (1 - Math.exp(-t * 6)) // sigmoid spike to ~95%
    } else if (i < 90) {
      load = 95 + (Math.random() - 0.5) * 2 // peak plateau ~95%
    } else {
      const t = (i - 90) / 10 // 0 → 1 over 10 points
      load = 95 - 65 * t // rapid drop
    }
    wave.push({ second: +(i * 0.2).toFixed(1), load: +load.toFixed(1) })
  }
  return wave
}

/* ── Build HPA pod response (delayed + smoothed) ── */
function buildHpaResponse(wave) {
  return wave.map((_, i) => {
    const srcIdx = Math.max(0, i - HPA_DELAY_POINTS)
    const srcLoad = wave[srcIdx].load
    // Map load (0-100) → pods (2-10), smoothed
    const rawPods = 2 + (srcLoad / 100) * 8
    const smooth = rawPods * (1 - Math.exp(-i * 0.08))
    return {
      second: +(i * 0.2).toFixed(1),
      pods: +smooth.toFixed(1),
    }
  })
}

/* ── Compute error rate from gap between traffic & HPA ── */
function computeErrorRates(wave, hpa) {
  return wave.map((pt, i) => {
    const normalizedTraffic = pt.load / 10 // 0–10 scale
    const gap = Math.max(0, normalizedTraffic - hpa[i].pods)
    const rate = Math.min(gap / 10 * 100, 18.3)
    return +rate.toFixed(1)
  })
}

// All data pre-computed once (module-level cache)
const FULL_WAVE = buildTrafficWave()
const FULL_HPA = buildHpaResponse(FULL_WAVE)
const FULL_ERROR = computeErrorRates(FULL_WAVE, FULL_HPA)

/**
 * useTsunamiData — streams chart data points one-by-one
 *
 * @param {{ streaming: boolean }} opts — set streaming=true to start
 * @returns {{
 *   trafficData:  Array<{ second: number, load: number }>,
 *   hpaData:      Array<{ second: number, pods: number }>,
 *   errorRate:    number,
 *   streamingDone: boolean,
 *   peakHit:      boolean,
 * }}
 */
export function useTsunamiData({ streaming }) {
  const [count, setCount] = useState(0)
  const doneRef = useRef(false)
  const timerRef = useRef(null)

  const advance = useCallback(() => {
    setCount((c) => {
      const next = c + 1
      if (next >= TOTAL_POINTS) {
        doneRef.current = true
        return TOTAL_POINTS
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!streaming || doneRef.current) return

    timerRef.current = setInterval(advance, INTERVAL_MS)

    return () => {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [streaming, advance])

  // Slice arrays to current count
  const trafficData = FULL_WAVE.slice(0, count)
  const hpaData = FULL_HPA.slice(
    0,
    Math.max(0, count - HPA_DELAY_POINTS)
  )
  const errorRate = count > 0 ? FULL_ERROR[count - 1] : 0
  const streamingDone = doneRef.current || count >= TOTAL_POINTS
  const peakHit = errorRate >= 18.3

  return { trafficData, hpaData, errorRate, streamingDone, peakHit }
}
