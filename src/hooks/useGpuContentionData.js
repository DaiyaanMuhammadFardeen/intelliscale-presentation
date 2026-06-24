import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

const JOB_NAMES = [
  'inference-job-001', 'train-job-A3', 'batch-score-04',
  'inference-job-017', 'fine-tune-B2', 'batch-score-12',
  'inference-job-042',
]

/**
 * useGpuContentionData — simulates GPU job contention timeline
 *
 * @param {{ active: boolean, tickSpeed?: number }} opts
 *   active=true starts the simulation; tickSpeed=800ms between ticks
 * @returns {{
 *   tick: number,
 *   jobPods: Array<{
 *     id: number,
 *     name: string,
 *     targetGpu: number,
 *     status: 'spawning'|'in-flight'|'attached'|'queued',
 *     attachTick: number | null,
 *   }>,
 *   gpuUtil: number,
 *   cpuUtil: number,
 *   gpuCost: number,
 *   waitSecs: number,
 *   queueLengths: [number, number, number],
 *   isFull: boolean,
 *   phase: 'initial' | 'filling' | 'full' | 'overloaded',
 * }}
 */
export function useGpuContentionData({ active, tickSpeed = 800 }) {
  const [tick, setTick] = useState(0)
  const jobPodsRef = useRef([])
  const nextJobIdRef = useRef(1)
  const timerRef = useRef(null)

  // CPU utilisation — set once on mount so it doesn't jump around
  const cpuUtil = useMemo(() => +(23 + Math.random() * 2).toFixed(1), [])

  /* ── Advance simulation one tick ── */
  const handleTick = useCallback(() => {
    setTick((prevTick) => {
      const newTick = prevTick + 1

      // Collect which GPUs currently have attached jobs
      const occupiedGpus = new Set(
        jobPodsRef.current
          .filter((j) => j.status === 'attached')
          .map((j) => j.targetGpu),
      )

      // Advance every existing job's status
      const updated = jobPodsRef.current.map((job) => {
        if (job.status === 'spawning') {
          // GPU already occupied → go straight to queued (skip in-flight)
          return {
            ...job,
            status: occupiedGpus.has(job.targetGpu) ? 'queued' : 'in-flight',
          }
        }
        if (job.status === 'in-flight') {
          return { ...job, status: 'attached', attachTick: newTick }
        }
        // attached / queued — no transition
        return job
      })

      // Decide whether to spawn a new job this tick
      const shouldSpawn =
        (newTick >= 6 && newTick <= 12 && newTick % 3 === 0) ||
        (newTick >= 16 && newTick <= 30 && newTick % 2 === 0) ||
        (newTick >= 31 && newTick <= 50 && newTick % 2 === 1)

      if (shouldSpawn) {
        const id = nextJobIdRef.current++
        updated.push({
          id,
          name: JOB_NAMES[(id - 1) % JOB_NAMES.length],
          targetGpu: (id - 1) % 3,
          status: 'spawning',
          attachTick: null,
        })
      }

      jobPodsRef.current = updated
      return newTick
    })
  }, [])

  /* ── Start / stop the interval based on `active` ── */
  useEffect(() => {
    if (!active) return

    timerRef.current = setInterval(handleTick, tickSpeed)
    return () => {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [active, tickSpeed, handleTick])

  /* ── Derived state ── */

  const phase =
    tick <= 5
      ? 'initial'
      : tick <= 15
        ? 'filling'
        : tick <= 30
          ? 'full'
          : 'overloaded'

  const jobPods = jobPodsRef.current

  const gpuUtil = Math.min(tick * 2, 98)

  const gpuCost = +Math.min(tick * 0.105, 4.2).toFixed(2)

  const waitSecs = tick >= 16 ? (tick - 16) * (tickSpeed / 1000) : 0

  const queueLengths = [
    jobPods.filter((j) => j.status === 'queued' && j.targetGpu === 0).length,
    jobPods.filter((j) => j.status === 'queued' && j.targetGpu === 1).length,
    jobPods.filter((j) => j.status === 'queued' && j.targetGpu === 2).length,
  ]

  const isFull = phase === 'full' || phase === 'overloaded'

  return {
    tick,
    jobPods,
    gpuUtil,
    cpuUtil,
    gpuCost,
    waitSecs,
    queueLengths,
    isFull,
    phase,
  }
}
