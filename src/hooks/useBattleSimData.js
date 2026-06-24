import { useState, useEffect, useRef } from 'react';

const TOTAL_POINTS = 50;
const TICK_MS = 200;

// Traffic waveform helpers
function sigmoidSpike(t) {
  const baseline = 20;
  const peak = 95;
  const midpoint = 6;
  // steepness factor 5 centered at t=6
  return baseline + (peak - baseline) / (1 + Math.exp(-5 * (t - midpoint)));
}

function computeTraffic(pointIndex) {
  const t = (pointIndex / TOTAL_POINTS) * 10; // map 0..49 → 0..10 seconds

  // t=0..5   (pts 0-24)   flat at 20%
  if (t <= 5) return 20;

  // t=5..7   (pts 25-34)  sigmoid spike 20% → 95%
  if (t <= 7) return sigmoidSpike(t);

  // t=7..9   (pts 35-44)  peak at 95%
  if (t <= 9) return 95;

  // t=9..10  (pts 45-49)  drop from 95% → 30%
  const alpha = (t - 9) / 1; // 0→1 over 1 second
  return 95 - alpha * (95 - 30);
}

// Build the full 50-point lookup table once
function buildLookupTable() {
  const table = [];
  for (let i = 0; i < TOTAL_POINTS; i++) {
    const traffic = computeTraffic(i);

    // —— HPA side ——
    let hpaPods;
    if (i < 15) {
      hpaPods = 2; // cooldown delay
    } else {
      // after point 15, increase by 1 every 4 points up to max 8
      hpaPods = Math.min(8, 2 + Math.floor((i - 15) / 4));
    }
    const hpaCapacity = (traffic / 100) * 8;
    const hpaErrorRate =
      hpaPods < hpaCapacity ? 0 : (traffic * 8 - hpaPods) / (traffic * 8);

    // —— IntelliScale side ——
    let intelliPods;
    // start at 2, jump to 6 at t=0
    if (i < 1) {
      intelliPods = 2;
    } else {
      intelliPods = 6;
      // after point 40, scale down 6→4→2: 1 every 3 points
      if (i >= 40) {
        intelliPods = Math.max(2, 6 - Math.floor((i - 40) / 3));
      }
    }
    const intelliErrorRate = 0;

    table.push({
      time: (i / TOTAL_POINTS) * 10,
      traffic,
      hpa: { pods: hpaPods, errorRate: hpaErrorRate },
      intelli: { pods: intelliPods, errorRate: intelliErrorRate },
    });
  }
  return table;
}

const LOOKUP = buildLookupTable();

export default function useBattleSimData(active) {
  const [tick, setTick] = useState(0);
  const [simDone, setSimDone] = useState(false);
  const dataRef = useRef([]);
  const intervalRef = useRef(null);

  // Derived arrays for charting
  const hpaData = dataRef.current.map((d) => ({
    time: d.time,
    traffic: d.traffic,
    pods: d.hpa.pods,
    errorRate: d.hpa.errorRate,
  }));

  const intelliData = dataRef.current.map((d) => ({
    time: d.time,
    traffic: d.traffic,
    pods: d.intelli.pods,
    errorRate: d.intelli.errorRate,
  }));

  const hpaFinalErrorRate = simDone ? LOOKUP[LOOKUP.length - 1].hpa.errorRate : 0;
  const intelliFinalErrorRate = 0;

  useEffect(() => {
    if (!active) {
      // Stop and reset
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      dataRef.current = [];
      setTick(0);
      setSimDone(false);
      return;
    }

    // Start streaming
    intervalRef.current = setInterval(() => {
      dataRef.current.push(LOOKUP[dataRef.current.length]);
      const currentTick = dataRef.current.length;
      setTick(currentTick);

      if (currentTick >= TOTAL_POINTS) {
        setSimDone(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, TICK_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active]);

  return {
    hpaData,
    intelliData,
    tick,
    hpaFinalErrorRate,
    intelliFinalErrorRate,
    simDone,
  };
}
