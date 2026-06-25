# HPA++ — Hackathon Web Presentation: Full Build Prompt

## Project Overview

Build a **single-page, full-browser, cinematic hackathon presentation website** for **HPA++**, an AI-powered predictive auto-scaling and GPU scheduling system for Kubernetes clusters. The presentation is for **Team Falah** at **DIU** for the **AI for Cluster Intelligence** hackathon track.

This is NOT a traditional slide deck clone. It is a **living, breathing, interactive simulation** — judges should feel like they are watching a real system operate in real time. Every "page" (called a **Scene**) fills the entire viewport. A global `Enter` key press (or right arrow key) advances the internal step counter of the current scene. Once all steps within a scene are exhausted, the next `Enter` press transitions to the next scene.

The final deliverable is a **Vite + React (JSX)** project using no backend, no SSR, pure client-side. All dependencies are installed via npm.

---

## Tech Stack (Exact)

- **Vite + React (JSX)** — `npm create vite@latest HPA++-presentation -- --template react`
- **Framer Motion** — all div/component transitions, spring physics, staggered reveals
- **Three.js + @react-three/fiber + @react-three/drei** — 3D scenes (title screen, architecture, galaxy)
- **Recharts** — animated SVG line/bar/area charts inside scenes
- **React-TSParticles** — particle field backgrounds
- **GSAP (GreenSock)** — complex multi-element timeline animations (battle simulator, formula morphing)
- **Tailwind CSS** — utility styling (no component library needed)
- **Google Fonts** — `Space Grotesk` (display/headings), `JetBrains Mono` (data/code/terminal text), `Inter` (body copy)

Install all via npm. Do not use CDN links.

---

## Global Design System

### Color Palette
```
:root {
  /* --- Backgrounds (Clean, layered slate/white) --- */
  --bg-void:       #f1f5f9;   /* Slate-100 — soft, airy base (replaces deep space) */
  --bg-panel:      #ffffff;   /* Pure white for glass panels, crisp contrast */

  /* --- Accents (Slightly deepened for contrast on light) --- */
  --neon-cyan:     #0891b2;   /* Cyan-600 — strong, readable, keeps the tech vibe */
  --neon-gold:     #d97706;   /* Amber-600 — warmer gold for success/wins */
  --neon-red:      #dc2626;   /* Red-600 — urgent, clear danger */
  --neon-purple:   #7c3aed;   /* Violet-600 — deep, rich for GPU/AI workloads */
  --neon-green:    #16a34a;   /* Green-600 — healthy, stable states */

  /* --- Text (High contrast for readability) --- */
  --text-primary:  #0f172a;   /* Slate-900 — near-black for main body text */
  --text-dim:      #64748b;   /* Slate-500 — soft gray for secondary labels */

  /* --- Glassmorphism (Frosted white glass for light mode) --- */
  --glass-bg:      rgba(255, 255, 255, 0.6);  /* Semi-transparent white */
  --glass-border:  rgba(8, 145, 178, 0.15);   /* Faint cyan edge for that high-tech sheen */

  /* --- Extras: Shadows (Crucial for light themes) --- */
  --shadow-sm:     0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  --shadow-glow:   0 8px 30px rgba(8, 145, 178, 0.15); /* Cyan glow for interactive elements */
}
```

### Typography
- `Space Grotesk` — all headings (H1–H4), weights 400/700
- `JetBrains Mono` — all data values, formulas, terminal text, counters
- `Inter` — all body copy, labels, tooltips

### Global Background
A persistent Three.js canvas lives at `z-index: 0` behind ALL scenes, always rendering. It shows a slowly rotating star field (3000 white point particles drifting at 0.0002 rad/frame). Each scene can send commands to mutate this background (e.g., add fog, change camera tilt, add colored nebula glow). Scene content sits at `z-index: 10` over this canvas.

### Global Layout
Every scene is a `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh` div with `overflow: hidden`. Scenes transition via Framer Motion's `AnimatePresence` — exiting scene slides up and fades while entering scene rises from below, spring-physics driven.

### Step System
Each scene has an internal `step` state (0-indexed). The global `Enter`/`ArrowRight` key handler calls `advanceStep()`. If `step < maxSteps - 1`, it increments step. If `step === maxSteps - 1`, it calls `nextScene()`. Each scene's components receive `step` as a prop and conditionally reveal/animate based on it. `ArrowLeft` goes back one step (or to the previous scene).

### Progress Indicator
A thin `2px` horizontal progress bar at the very top of the viewport (full width). It fills proportionally based on total steps consumed across ALL scenes. Color: `--neon-cyan`. Scene dots are shown at scene boundaries.

---

## Scene 0: "IGNITION" — The Title Screen

**Purpose:** Make judges immediately feel they are looking at something unprecedented.

**Background mutation:** Persistent star field canvas — add a slow-rotating, glowing torus knot (THREE.TorusKnotGeometry) in electric cyan, scale 4, wireframe mode, rotating at 0.003 rad/frame. It sits at 60% opacity behind the content.

**Step 0 (initial render):**
- Black screen. Only the torus knot is rotating in the background.
- A horizontal scanline effect sweeps top-to-bottom (CSS animation, 2px bright cyan line, 1.5s duration, once).
- After scanline completes (1.5s), a terminal-style text starts typing character-by-character:
  ```
  > INITIALIZING HPA++ v1.0...
  > LOADING FORECASTING ENGINE...
  > CONNECTING TO CLUSTER...
  > STATUS: ONLINE ██████████ 100%
  ```
  Each line types at ~60ms per character using a JS interval. Lines appear sequentially. Cursor blinks at end of each line. Font: `JetBrains Mono`, color: `--neon-cyan`, size: `clamp(0.7rem, 1.5vw, 1.1rem)`. This text block is left-aligned, bottom-left of screen, like a real terminal.

**Step 1:**
- Terminal text fades to 20% opacity and slides to the bottom-left corner, staying as an ambient element.
- The main title **"HPA++"** explodes into existence from the center. Not a fade — it glitch-animates in: rapidly flickers between the real text and scrambled ASCII chars (`#@%!&*^`) for 800ms before "resolving" to the correct text. Implement this with a JS interval that randomizes individual characters, then settles. Font: `Space Grotesk`, weight: 700, size: `clamp(3rem, 8vw, 7rem)`, color: white with a `text-shadow: 0 0 40px #00f5ff, 0 0 80px #00f5ff`.
- Subtitle appears 300ms after title resolves, fading up: `"AI-Powered Predictive Auto-Scaling & GPU Scheduling"`. Font: `Space Grotesk` 400, `clamp(1rem, 2.5vw, 1.6rem)`, color: `--text-primary`.

**Step 2:**
- Three stat badges materialize below the subtitle in a staggered Framer Motion sequence (150ms apart):
  - Badge 1: `"30–50% FASTER SCALING"` — cyan border glow
  - Badge 2: `"40–60% LOWER GPU QUEUE TIME"` — purple border glow  
  - Badge 3: `"25% COST REDUCTION"` — gold border glow
- Each badge is a `glassmorphism` pill: `backdrop-filter: blur(8px); background: rgba(0,245,255,0.05); border: 1px solid rgba(0,245,255,0.3); border-radius: 999px; padding: 8px 24px`. Text in `JetBrains Mono`.
- The torus knot in the background accelerates slightly (rotation speed × 2) when these appear.

**Step 3:**
- Two more lines appear, staggered:
  - Top-left corner watermark: `"Team Falah | DIU | AI for Cluster Intelligence"` in small `JetBrains Mono`, `--text-dim` color.
  - Bottom center: A pulsing `"PRESS ENTER TO BEGIN ▶"` prompt in `--neon-cyan`, with a subtle scale pulse animation (1.0 → 1.05 → 1.0, infinite, 2s period).

**Step 4:**
- The entire scene (torus knot, title, badges) begins a dramatic zoom-in + fade: `scale: 1 → 1.3, opacity: 1 → 0` over 600ms using Framer Motion. Simultaneously, the background star field brightens (increase particle opacity) to simulate "launching through space." This is the scene EXIT transition into Scene 1.

**Max steps: 5** (0–4, step 4 triggers transition)

---

## Scene 1: "THE TSUNAMI" — Problem: Reactive CPU Scaling

**Purpose:** Make judges viscerally feel the pain of reactive HPA.

**Background mutation:** Persistent star field takes on a reddish nebula tint (add a large, low-opacity red radial gradient overlay at 30% opacity). The torus knot fades out.

**Step 0:**
- Scene fades in with a single large label in the top-left corner: `"THE PROBLEM — REACTIVE SCALING"` in `JetBrains Mono`, `--neon-red`, `clamp(0.7rem, 1.5vw, 0.95rem)`, letter-spacing 0.2em.
- Headline animates in from left: `"By the time HPA reacts..."`. `Space Grotesk 700`, `clamp(2rem, 5vw, 4rem)`, white.
- A large empty dark panel (the chart area) materializes in the center-bottom 60% of screen with glass styling. Inside, ONLY the X-axis and Y-axis are visible, labeled `"Time (seconds)"` and `"Load / Pod Count"` in dim mono text. Nothing else yet — the emptiness creates tension.

**Step 1:**
- A realistic-looking traffic load waveform (a red Recharts AreaChart) begins animating from left to right across the chart panel. The data represents a flash sale: starts flat at ~20% load, then spikes violently to 95% over 10 seconds, stays there 20 seconds, then drops. The area fill is a red gradient (`#ff3b5c` → transparent). The animation is smooth using Recharts' built-in `isAnimationActive` and a custom useEffect that streams data points one-by-one every 200ms.
- A label appears on the red wave: `"REAL TRAFFIC"` with a red dot indicator.

**Step 2:**
- A second line appears on the chart — the blue "Pod Scaling Response" line. It starts at the same origin as the red line BUT is visibly DELAYED. Implement by starting the blue data stream 3 seconds (15 data points) after the red starts. This creates a painful visual lag gap.
- In the lag gap area, a shaded red zone appears with a blinking label: `"⚠ REQUESTS FAILING"`. The chart background in that zone flickers slightly red.
- A label appears: `"HPA RESPONSE"` with a blue dot.
- Top-right corner of chart: a counter labeled `"ERROR RATE"` starts incrementing from 0% to 18.3% using a JS animation over 1.5 seconds. Number in `JetBrains Mono`, large, red.

**Step 3:**
- The entire chart panel **shakes** (CSS keyframe shake, 3 iterations, 0.1s duration each) when the error rate hits its peak.
- A red alert modal/toast slams in from the top: styled like a real Kubernetes alert box — `[CRITICAL] CrashLoopBackOff detected on inference-service-7b4f9. OOMKilled. 47 pending requests dropped.` — in `JetBrains Mono` red text on a dark red panel with a blinking red LED dot.
- Below the chart, a single-line annotation fades in: `"Traditional HPA: scale-up takes 90–180 seconds after CPU threshold is breached."` in `Inter`, `--text-dim`.

**Step 4:**
- The red wave and the chart animate a "freeze frame" — everything pauses.
- The headline morphs (Framer Motion layout animation): `"By the time HPA reacts..."` → `"...your users have already left."` The transition uses a crossfade and a slight vertical shift.
- A large number `"18.3%"` materializes in the center of the screen with a red glow, then cracks and shatters using CSS clip-path animation (the number splits into fragments that fly outward). This is the punctuation mark.

**Step 5:**
- Scene exit: everything contracts to a point in the center of the screen (scale to 0.01, opacity 0). Simultaneously, Scene 2 begins appearing.

**Max steps: 6**

---

## Scene 2: "THE GOLD RUSH" — Problem: GPU Contention

**Purpose:** Show GPU contention chaos with a live 3D simulation.

**Background mutation:** Nebula shifts from red to deep purple.

**Step 0:**
- Label: `"THE PROBLEM — GPU CONTENTION"` in `--neon-purple`, same style as Scene 1 label.
- Headline: `"GPUs don't wait for anyone."` fades in.
- A **2D isometric grid** (CSS-drawn, no Three.js needed here — pure div/CSS with `transform: rotateX(60deg) rotateZ(45deg)`) appears center-screen. It shows a 4×3 grid of "node" tiles. Each tile is a dark glassmorphism square with a small GPU icon (simple SVG cube shape) in the corner. Initial state: all GPU indicator dots on 3 specific nodes are glowing gold = `"GPU AVAILABLE"`.

**Step 1:**
- An animated stream of "job pods" materializes at the top of the isometric grid and begins flowing down toward the GPU nodes. These are small glowing purple squares with labels like `"inference-job-001"`, `"train-job-A3"`, etc. They use Framer Motion to animate position from top → respective node.
- Jobs hit the 3 available GPU nodes and "attach" (they stack on top of the node tiles with a satisfying "click" animation — scale up then settle).
- All 3 GPU nodes are now marked `"FULL"` — their gold glow turns red.

**Step 2:**
- MORE purple job pods keep spawning and flowing down. But the GPU nodes are full. They hit the nodes and visually BOUNCE BACK (Framer Motion spring with negative stiffness bounce). A queue pile starts forming above each GPU node — pods stack up in a vertical queue column with a number counter: `"Queue: 7"`, incrementing.
- Non-GPU CPU nodes are visibly idle — their indicators are green but the pods ignore them completely and keep trying to reach GPU nodes.
- A label appears over the idle CPU nodes: `"IDLE CAPACITY (IGNORED)"` in `--text-dim`.

**Step 3:**
- A Recharts horizontal bar chart animates in from the right side of the screen, showing `"GPU Utilisation: 98%"` (critical red) vs `"CPU Utilisation: 23%"` (green/low). The contrast is jarring and makes the imbalance obvious.
- A cost counter appears below: `"💰 GPU Cost Burning: $4.20 / min"` in gold `JetBrains Mono`, incrementing in real-time.
- A "time in queue" counter appears for the top-queued job: `"Waiting: 00:03:47..."` incrementing.

**Step 4:**
- Headline morphs: `"GPUs don't wait for anyone."` → `"Default scheduler is flying blind."` 
- The isometric grid dims to 30% opacity.
- A callout box appears over it: `"The scheduler sees only NOW. It has no forecast. It cannot pre-place jobs. It wastes $12k/month in GPU idle time."` in `Inter`, white on glass panel.

**Step 5:**
- Scene exit: the isometric grid flips upward like a card being flipped over (CSS 3D transform: rotateX from 60deg to 180deg, opacity out). This transitions into Scene 3.

**Max steps: 6**

---

## Scene 3: "THE ORACLE" — The Forecasting Engine

**Purpose:** Introduce Prophet forecasting as HPA++'s core superpower. Make it feel magical.

**Background mutation:** Nebula purifies — deep space cyan. Background star field gets slightly brighter. The mood shifts from danger to intelligence.

**Step 0:**
- Label: `"THE SOLUTION — FORECASTING ENGINE"` in `--neon-cyan`.
- Headline: `"HPA++ doesn't react."` fades in from right, settling with spring physics.
- Center stage is completely empty — a dramatic pause before the reveal.

**Step 1:**
- A **3D crystal sphere** (Three.js, rendered in a fixed `<Canvas>` within the scene at z-index 20) fades in at center-screen. The sphere is built with `THREE.SphereGeometry(2, 64, 64)` using a custom ShaderMaterial:
  - Inside the sphere: animated noise (GLSL simplex noise) in electric blue/cyan tones, suggesting internal intelligence.
  - Outer shell: refractive glass effect using envMap and `roughness: 0, transmission: 1, thickness: 0.5` (Three.js physical material).
  - The sphere slowly rotates on Y axis.
- Mouse movement causes the sphere to tilt slightly (3D parallax via mouse position mapped to rotation delta).

**Step 2:**
- A **Recharts ComposedChart** materializes INSIDE a glass panel that appears to float in front of the crystal sphere (positioned as a `div` overlay on top of the Three.js canvas using `pointer-events: none`). The chart shows:
  - A solid cyan line: `"HISTORICAL LOAD (actual)"` — real-looking data with natural variance, 30 data points to the left of a vertical "NOW" divider line.
  - A dashed cyan line extending to the RIGHT of the "NOW" divider: `"PROPHET FORECAST (5 min ahead)"` — smooth curve predicting a coming spike.
  - A translucent cyan band around the forecast line: the **confidence interval** — wider in further-future, narrower near present.
- The chart animates in with `isAnimationActive` and streams the historical data first (200ms/point), then the forecast appears (400ms delay) in a single Framer Motion reveal.
- The "NOW" divider is a pulsing vertical line with a glowing dot labeled `"NOW"`.

**Step 3:**
- A horizontal slider appears below the chart panel, labeled `"FORECAST CONFIDENCE THRESHOLD"`. Dragging it changes the width of the confidence band in real-time (React state `confidenceLevel` 0.5–0.99, mapped to band width). When dragged low, the band widens, the sphere turns amber. When dragged high, the band narrows, the sphere turns bright green.
- Small label below slider: `"Prophet provides native confidence intervals — HPA++ only acts when confident enough."`.
- Four metric badges animate in to the right of the chart: `"CPU%"` (cyan), `"Memory%"` (blue), `"GPU Util%"` (purple), `"GPU Mem%"` (pink). Each has a small sparkline (tiny Recharts LineChart) showing a 10-point forecast. They stagger in 100ms apart.

**Step 4:**
- Headline morphs: `"HPA++ doesn't react."` → `"HPA++ predicts."` The word "predicts" materializes with a golden shimmer.
- The crystal sphere does a single dramatic pulse (scale: 1 → 1.4 → 1 over 0.6s) and its internal color shifts from cyan to gold.
- A text block fades in below: `"Prophet. Multi-seasonality. Native confidence intervals. Per-metric models. Fast rolling-window retraining."` — each phrase separated by a `|` divider, mono font, dim color.

**Step 5:**
- A "forecast arrow" animates from the "NOW" line forward along the predicted curve — a glowing particle traces the dashed forecast line at 2x speed, then explodes into a golden spark burst at the forecast peak.
- Caption: `"5 minutes of forewarning. Enough to pre-scale. Enough to pre-schedule."`.

**Step 6:**
- Scene exit: crystal sphere explodes outward into particles that scatter across the screen, then reforms as the architecture diagram in Scene 7. For now, just fade out with a white flash (0.3s) then transition to Scene 4.

**Max steps: 7**

---

## Scene 4: "THE FORMULA" — Scaling Logic

**Purpose:** Show the math behind the decisions — make the system feel rigorous and transparent.

**Background mutation:** Deep dark. Subtle matrix-style green symbols raining very slowly in background at 5% opacity (not the main focus — just ambiance). Implement with a Canvas 2D element showing slowly falling `"0"` and `"1"` characters.

**Step 0:**
- Label: `"THE LOGIC — DECISION FORMULA"` in `--neon-green`.
- Headline: `"Every decision, fully auditable."` slides in.
- The center of the screen is dark and empty, ready for the formula.

**Step 1:**
- The core formula materializes letter-by-letter (typewriter effect, JetBrains Mono, very large: `clamp(1rem, 2.5vw, 1.8rem)`, white):
  ```
  REPLICAS = clamp(
    ⌈ max(predicted_rps / rps_per_pod,
          predicted_cpu% / cpu_threshold%) ⌉,
    MIN_REPLICAS,
    MAX_REPLICAS
  )
  ```
  Each term types in sequentially with a 40ms per character delay. When a term appears, it briefly glows cyan before settling to white.
- A bracket/brace annotation system activates: each part of the formula gets a color-coded underline + a small floating label:
  - `predicted_rps` → cyan glow, label: `"from Prophet forecast"`
  - `cpu_threshold%` → green glow, label: `"operator-configured"`
  - `clamp(...)` → gold glow, label: `"safety guard rail"`

**Step 2:**
- Two tabs appear below the formula: `[CPU MODE]` and `[GPU MODE]`. Clicking/pressing Enter on GPU MODE morphs the formula — the `predicted_rps / rps_per_pod` term crossfades to `predicted_gpu_util% / gpu_threshold%`. The morph is a Framer Motion layout animation. The color accent on the changed term shifts from cyan to purple.
- A **confidence modifier** section fades in below:
  ```
  IF confidence_interval_width > threshold:
    scale_conservatively()   // hold or scale up only 1 replica
  ELSE:
    scale_aggressively()     // use full predicted count
  ```
  This types in with the same typewriter effect.

**Step 3:**
- An **animated flow diagram** appears to the right of the formula. It shows the pipeline:
  - Box 1: `"Prometheus + DCGM"` (metrics source, cyan) → 
  - Box 2: `"Prophet"` (forecast, purple) → 
  - Box 3: `"Controller"` (this formula, gold) → 
  - Box 4: `"kubectl patch"` (action, green)
  - Glowing particles flow along the connectors between boxes in real-time (CSS animation: small dots traveling along SVG paths using stroke-dashoffset animation). Each connector has a label showing what data is flowing: `"raw metrics"`, `"forecast + CI"`, `"target replicas"`, `"PATCH request"`.

**Step 4:**
- A **live decision log** panel slides in from the right — styled exactly like a real terminal log:
  ```
  [12:00:01] forecast: cpu=78.3%, ci_width=4.2% → CONFIDENT
  [12:00:01] target_replicas = ceil(78.3/20.0) = 4 → clamped to 4
  [12:00:01] current_replicas = 2 → SCALING UP to 4
  [12:00:02] kubectl patch deployment/inference-svc --replicas=4
  [12:00:02] scaling_action=UP | replicas=2→4 | confidence=HIGH
  ```
  New log lines scroll in one by one with a 400ms stagger. Each line has a small green dot before it. The container scrolls automatically as lines appear.
- Caption below: `"Full audit trail. Forecast value, confidence, decision, and action — all logged."`.

**Step 5:**
- Headline morphs: `"Every decision, fully auditable."` → `"Transparent. Traceable. Configurable."` The three adjectives materialize one by one, each in a different accent color (cyan, gold, green).

**Max steps: 6**

---

## Scene 5: "THE BATTLE" — HPA vs HPA++ Simulator

**Purpose:** The most dramatic scene. A real-time side-by-side simulation that judges can watch run. This should feel like a video game battle.

**Background mutation:** Screen divides vertically. LEFT half takes on a red tint overlay. RIGHT half takes on a cyan/gold tint overlay. A vertical divider line pulses between them.

**Step 0:**
- A dramatic **split-screen** layout materializes. The screen is divided exactly 50/50 vertically by a glowing `2px` vertical line.
- LEFT HALF: Label `"TRADITIONAL HPA"` in `--neon-red`, top-center. Subtitle: `"Reactive. Blind. Too Late."` in small dim mono.
- RIGHT HALF: Label `"HPA++"` in `--neon-cyan`, top-center. Subtitle: `"Proactive. Predicted. Ready."` in small dim mono.
- Both halves are dark and empty except for their labels — like two fighters entering an arena.
- A large `"VS"` label pulses in the center on the dividing line, gold, using a neon sign flicker animation (CSS: `opacity: 1 → 0.6 → 1` at irregular intervals using multiple keyframe stops to simulate neon buzz).

**Step 1:**
- Both halves simultaneously reveal their respective chart areas (Recharts AreaCharts, dark glass panels occupying 50% of each half's height).
- Both charts show the same initial state: flat traffic, 2 pods running. The data is identical on both sides — same starting conditions.
- Pod count indicators appear below each chart:
  - LEFT: `"Active Pods: 2"` in red.
  - RIGHT: `"Active Pods: 2"` in cyan, plus a `"Forecast Buffer: 2→6 pods staged"` label in gold — suggesting HPA++ has ALREADY pre-scaled.

**Step 2:**
- Both charts begin animating the SAME traffic wave simultaneously — a massive spike starting from t=0.
- LEFT (HPA): Pod count stays at 2 for the first 15 data points while traffic climbs. The chart background turns progressively redder. A yellow `"⏱ Waiting for threshold breach..."` label blinks. Error rate counter appears in top-right of left panel, counting up: `0% → 3% → 9% → 18%`.
- RIGHT (HPA++): Pod count JUMPS from 2 → 6 at t=-3 (before the wave). This is shown by the pod counter incrementing and a gold flash animation. The traffic wave hits and the right chart's latency line barely blips. Error rate counter: stays at `0.0%`.
- The contrast is visceral and unmistakable.

**Step 3:**
- LEFT: The error rate hits 18.3%. The entire LEFT half shakes (CSS shake keyframe). A red `"SERVICE DEGRADED"` banner drops from the top of the left panel. The traffic chart's peak zone shows a red hatched fill area labeled `"REQUEST DROP ZONE"`.
- RIGHT: The HPA++ side glows with a golden pulse. A green `"ALL REQUESTS SERVED"` banner appears. The pod count begins scaling back DOWN gracefully after the wave passes (from 6 → 4 → 2 as traffic drops). A label: `"Auto scale-down: 15% cost savings."`.
- A stopwatch appears between the two halves on the divider line, showing `"HPA Response: 118s"` in red vs `"HPA++ Response: 0s (pre-scaled)"` in gold.

**Step 4:**
- The real-time simulation "freezes" (data stops animating). A scoreboard slides down from the top of each half:
  - LEFT scoreboard: Error Rate `18.3% ❌`, Latency P99 `2,840ms ❌`, Pod Readiness Lag `118s ❌`, Cost Efficiency `47% ❌`
  - RIGHT scoreboard: Error Rate `0.0% ✅`, Latency P99 `340ms ✅`, Pod Readiness Lag `0s (pre-scaled) ✅`, Cost Efficiency `71% ✅`
  - Numbers count up one by one using Framer Motion number counters.
- The `"VS"` label on the divider morphs to `"WINNER"` with an arrow pointing RIGHT.

**Step 5:**
- The LEFT half fades to 30% opacity and desaturates to near-grayscale using CSS filter.
- The RIGHT half (HPA++) expands to fill 70% of the screen with a smooth Framer Motion layout animation.
- Single large caption: `"30–50% faster response. Zero error rate during flash spikes."` in white, center.

**Max steps: 6**

---

## Scene 6: "THE GHOST SCHEDULER" — Predictive GPU Placement

**Purpose:** Visualize the predictive scheduler as a cinematic sci-fi capability.

**Background mutation:** Scene takes on a deep space purple/indigo tone. The background star field slows to near-stillness.

**Step 0:**
- Label: `"THE SOLUTION — PREDICTIVE GPU SCHEDULING"` in `--neon-purple`.
- Headline: `"Place workloads where capacity WILL be, not where it IS."` fades in.
- A **top-down 2D cluster grid** materializes — a 3×4 grid of node cards. Each card shows: Node name (`node-01` through `node-12`), GPU indicator bar, CPU indicator bar, Current load %. Built with React components using Framer Motion. Six nodes have a small GPU chip icon. The initial state: 3 GPU nodes are at 85% (nearly full, red bars), 3 GPU nodes are at 40% (available, orange bars).

**Step 1:**
- A new GPU workload "pod" appears at the top of the screen: a glowing purple hexagon with label `"gpu-inference-job-0847"`. It pulsates with a soft glow.
- The DEFAULT SCHEDULER behavior is shown first (the "wrong way"):
  - Three nodes light up green — they are currently available. They are `node-04`, `node-07`, `node-11`.
  - The pod floats toward `node-04` (the first available).
  - A Framer Motion `AnimatePresence` shows it traveling to `node-04`.
  - It lands on `node-04`. `node-04`'s bar jumps to 95% — it was already under load, and this causes `node-04` to show a `"⚠ HIGH PRESSURE"` warning.
  - Greyed label below: `"Default scheduler: first-fit. Ignores future state."`.

**Step 2:**
- A rewind effect plays: the pod un-lands from `node-04` and floats back to the top (Framer Motion `exit` animation, reversed). A diagonal "REWIND" stamp briefly appears in the corner.
- Now the **HPA++ Predictive Scheduler** takes over. The grid updates:
  - A `"⏱ FORECAST HORIZON: +5 minutes"` banner fades in over the grid.
  - Each node tile updates to show TWO values: `"Now: 85%"` and `"In 5min: 12%"` (with a small downward arrow, green color). This is the forecast-aware view.
  - `node-09` currently shows `"Now: 88%"` but `"In 5min: 8% (job finishing)"`. It is highlighted with a cyan "PREDICTED AVAILABLE" badge.

**Step 3:**
- The pod appears to "PHASE SHIFT" — it flickers between solid and ghostly states (CSS animation alternating `opacity: 1` and `opacity: 0.3` with a slight blur filter, 3× at 0.2s intervals).
- The pod materializes on `node-09` even though it currently shows 88% load. A countdown timer appears on `node-09`: `"Capacity freeing in: 00:00:47..."` counting down.
- When the countdown hits zero, `node-09`'s load bar dramatically drops from 88% → 8% (the running job finishes), and the new pod "activates" with a satisfying glow animation.
- Label: `"Zero queue time. The job was ready exactly when capacity was available."`.

**Step 4:**
- A comparison panel slides in from the right:
  ```
  DEFAULT SCHEDULER:
  → Placed on node-04 (88% load)
  → Job queued: 4m 23s
  → GPU contention: HIGH
  
  HPA++ SCHEDULER:
  → Predicted node-09 freeing in 47s
  → Job queued: 0s (pre-bound)
  → GPU contention: NONE
  ```
  Text appears in `JetBrains Mono`. Lines animate in one-by-one.
- A single metric badge: `"40–60% reduction in GPU queue time"` in gold, large.

**Step 5:**
- The grid dims except for `node-09`, which brightens. A caption: `"Kubernetes node affinity + pod annotations. No custom infrastructure. Native primitives."`.
- Headline morphs: `"...not where it IS."` → the word `"IS"` is struck through with a red line, and `"WILL BE"` is highlighted in gold.

**Max steps: 6**

---

## Scene 7: "THE NERVOUS SYSTEM" — Architecture Data Flow

**Purpose:** Show the system architecture as a living, pulsing organism — not a static diagram box.

**Background mutation:** Dark circuit board aesthetic. Add subtle CSS background-image with a faint hexagonal grid pattern at 3% opacity (use CSS radial-gradient or SVG data URI).

**Step 0:**
- Label: `"THE ARCHITECTURE — SYSTEM DATA FLOW"` in `--neon-cyan`.
- Headline: `"Five components. One intelligence."` fades in.
- The center stage is empty — preparing for the architecture diagram to build itself.

**Step 1:**
- Five component nodes "drop in" from above with Framer Motion spring physics, one by one with 200ms stagger, landing at their correct positions in a horizontal pipeline layout:
  1. `"Prometheus + DCGM"` — left, cyan, with small server icon (SVG)
  2. `"Prophet Engine"` — left-center, purple, with brain/wave icon
  3. `"Predictive Controller"` — center, gold, with gears icon
  4. `"K8s API"` — right-center, blue, with Kubernetes wheel icon (SVG)
  5. `"Dashboard"` — right, green, with chart icon
- Each node is a glassmorphism rounded rectangle with a component name, subtitle (e.g., `"Multi-metric forecasting"`), and icon. They appear but are not yet connected.

**Step 2:**
- SVG connector paths animate between the nodes. Each path is a smooth bezier curve. They are drawn using SVG `stroke-dashoffset` animation (the path "draws itself" left to right). Connector colors:
  - Prometheus → Prophet: `"raw metrics (30s interval)"` — cyan
  - Prophet → Controller: `"forecast + confidence bands"` — purple  
  - Controller → K8s API: `"PATCH replicas, node affinity"` — gold
  - Controller → Dashboard: `"decision log + predictions"` — green
- After connectors draw, glowing particles begin continuously traveling along each path in the direction of data flow. These are small bright dots (6px) using CSS animation along the SVG path using `offset-path` and `offset-distance`. Different colors match their connector.

**Step 3:**
- Click/hover affordance text: `"Click any component to learn more →"` appears in dim mono.
- Each component node becomes hoverable. On hover, a tooltip panel appears above the hovered node with a detailed breakdown. These tooltips contain:
  - **Prometheus + DCGM**: `"Scrapes metrics every 15s. CPU, Memory via Node Exporter. GPU Util + GPU Memory via NVIDIA DCGM Exporter. Stores in time-series format for Prophet ingestion."`
  - **Prophet Engine**: `"One Prophet model per metric. Handles daily + weekly seasonality. Rolling 7-day training window. Retrain on every cycle. Outputs (forecast, lower_bound, upper_bound) per metric."`
  - **Predictive Controller**: `"Core Python service. Reads forecasts. Computes target replicas using clamped formula. Checks confidence threshold. Issues scale commands. Writes GPU scheduling hints as pod annotations."`
  - **K8s API**: `"Receives PATCH requests for Deployment replica counts. Receives pod annotation updates for node affinity. Retains HPA + default scheduler as reactive safety nets."`
  - **Dashboard**: `"Streamlit + Plotly. Live charts: predicted vs actual per metric. Scaling action log. Node utilisation forecast heatmap. All data pulled from Prophet output + controller log."`
- Tooltips use glassmorphism style with cyan border.

**Step 4:**
- A **"LIVE CYCLE"** animation plays: a bright gold pulse travels through all 5 nodes sequentially (each node lights up fully as the pulse passes through). The cycle repeats continuously at 3s/cycle. This simulates the 30-second polling loop running.
- A cycle timer appears: `"System cycle: every 30s"` with a small circular progress ring counting down.
- The Predictive Scheduler node (shown as an optional branch below the Controller node) fades in separately, connected with a dashed line to Controller and a dotted line to K8s API. It's labeled `"Predictive Scheduler (optional module)"`.

**Step 5:**
- Headline morphs: `"Five components. One intelligence."` → `"Built on standard K8s primitives. Zero cloud lock-in."`.
- All nodes get a secondary badge: a small green checkmark with `"Open Source"`. Each one briefly glows green in turn.
- Caption: `"Prometheus, Prophet, Python, Kubernetes. No proprietary APIs. No vendor lock-in. Deployable on any cluster."`.

**Max steps: 6**

---

## Scene 8: "THE COCKPIT" — Live Dashboard Simulation

**Purpose:** Show judges what operators would see — a real, beautiful monitoring dashboard. This should look production-ready.

**Background mutation:** Slightly lighter background (`#0a0f1a`) to simulate a dashboard environment. The star field dims to near-invisible.

**Step 0:**
- Label: `"THE EXPERIENCE — OPERATOR DASHBOARD"` in `--neon-green`.
- Headline: `"Complete visibility. Complete trust."` fades in.
- A full-screen mock dashboard layout materializes with Framer Motion (each dashboard card scales in from 0 with spring physics, staggered 80ms apart). The layout uses CSS Grid: 2 columns top, 1 full-width chart middle, 1 log panel bottom.
- **Card 1 (top-left):** `"FORECAST vs ACTUAL — CPU%"` — Recharts ComposedChart: solid line (actual, cyan) + dashed line (forecast, dim cyan) + confidence band (shaded area). Data streams in real-time (new point every 500ms via React useEffect + setInterval, cycling through a pre-generated synthetic dataset).
- **Card 2 (top-right):** `"FORECAST vs ACTUAL — GPU UTIL%"` — Same chart style but in purple. Shows GPU utilisation forecast with a wider confidence band.
- **Card 3 (middle full-width):** `"POD SCALING TIMELINE"` — Recharts BarChart showing pod counts over time for both CPU pods (cyan bars) and GPU pods (purple bars). A vertical "NOW" line divides past/future. Right side shows scaled-up bars pre-emptively.
- **Card 4 (bottom):** `"DECISION LOG"` — A scrolling terminal-style log with lines appearing at 1.2s intervals:
  ```
  [12:00:00] cpu_forecast=72.1% ci=3.8% | CONFIDENT → scale inference-api 3→5
  [12:00:30] gpu_forecast=81.4% ci=6.1% | BORDERLINE → scale-conservatively gpu-worker 2→3
  [12:01:00] gpu_forecast=89.2% ci=2.9% | CONFIDENT → scale gpu-worker 3→6
  [12:01:00] sched: gpu-inference-job-0847 → node-09 (predicted free in 47s)
  [12:01:30] node-09 capacity freed → gpu-inference-job-0847 ACTIVATED (0s queue)
  ```
  Each line has a colored dot: cyan=CPU action, purple=GPU action, gold=scheduler action.

**Step 1:**
- A **time scrubber slider** appears below the dashboard, labeled `"TIME SCRUBBER: Replay 10-minute window"`. Dragging it fast-forwards the entire dashboard: all charts update simultaneously to show the state at the dragged time position. The decision log scrolls to the corresponding timestamp. This is implemented by pre-generating 600 data points (1/sec for 10min) and indexing into them based on slider value.
- Caption: `"Operators can replay any window to audit every scaling and scheduling decision."`.

**Step 2:**
- A **"FLASH SALE EVENT"** toggle button appears in the top-right corner. Clicking it injects a traffic spike into the synthetic data — all charts immediately show the spike beginning. The forecast lines show the predicted peak. Pod counts in the bar chart begin increasing ahead of the spike (the HPA++ pre-scale behavior). Decision log floods with new scale-up entries.
- A red flashing badge: `"⚡ TRAFFIC SURGE DETECTED"` appears momentarily in the top-right corner then fades to a calm green `"✅ PRE-SCALED AND READY"`.

**Step 3:**
- The dashboard zooms in on Card 2 (GPU chart) using Framer Motion layout animation — it expands to fill the top 60% of the screen. The GPU forecast line shows a predicted spike, and the confidence band is visible.
- A callout annotation arrow points to the confidence band: `"Wider band = HPA++ acts conservatively. Narrower band = scales aggressively. Risk-aware by design."`.

**Step 4:**
- Dashboard zooms back out to full layout. All 4 cards are visible.
- A `"DOWNLOAD REPORT"` button appears (non-functional but styled beautifully). Caption: `"Every forecast, decision, and action is logged and exportable. Full audit trail."`.
- Headline morphs: `"Complete visibility. Complete trust."` → `"Your cluster, understood."`.

**Step 5:**
- Scene exit: dashboard cards scatter outward like cards being dealt from a table — each card flies to a different corner, then fade out. Transition to Scene 9.

**Max steps: 6**

---

## Scene 9: "THE GALAXY" — Cluster Intelligence Future Vision

**Purpose:** Zoom out dramatically to show HPA++'s potential at scale. End on an inspiring, epic note before the finale.

**Background mutation:** Full Three.js takeover. Star field explodes in density (particle count triples). A galaxy-like structure begins forming.

**Step 0:**
- Label: `"THE VISION — CLUSTER INTELLIGENCE AT SCALE"` in `--neon-gold`.
- Headline: `"One cluster is just the beginning."` fades in.
- The Three.js background canvas transitions to a new scene: a top-down view of a **galaxy of clusters** built from Three.js `Points` geometry. Each cluster is a group of 50–100 white/cyan point particles arranged in a rough cluster shape. There are 6 cluster groups positioned at galaxy positions. They slowly drift/rotate. Scale: impressive, occupying the full background.
- The mouse allows dragging to rotate the entire galaxy view (Three.js OrbitControls or manual quaternion rotation based on pointer delta).

**Step 1:**
- Four specific cluster nodes in the galaxy pulsate and reveal labels that slide in:
  - `"E-Commerce Platform"` — gold, northeast quadrant
  - `"University AI Research"` — purple, southwest quadrant
  - `"FinTech Fraud Detection"` — cyan, northwest quadrant
  - `"Real-Time Inference"` — green, southeast quadrant
- Each cluster's label card is a small glassmorphism div positioned as a CSS overlay using the cluster's projected 3D coordinates converted to 2D screen coords.

**Step 2:**
- Glowing golden "intelligence beams" animate from a central node (labeled `"HPA++ Brain"` — a larger, brighter cluster in the center) outward to each of the 4 clusters. These beams are Three.js `Line` objects or CSS SVG overlays. They pulse with traveling particles.
- Each beam shows a data label traveling along it: `"Forecast distributed"`, `"Schedules optimized"`, `"Costs minimized"`.
- Caption: `"Multi-cluster workload coordination. Global resource optimization."`.

**Step 3:**
- Four "use case" cards materialize next to their respective clusters (positioned in CSS as overlays). Each card is a glassmorphism panel with:
  - **E-Commerce:** `"Flash sale? HPA++ pre-scales all services 5 min before. Zero error rate."`
  - **University:** `"Overnight idle GPUs? HPA++ coordinates training job schedules to maximize utilisation."`
  - **FinTech:** `"Fraud detection inference? Pre-scaled before market opens every morning."`
  - **Real-Time Inference:** `"Traffic spike? Pre-placed inference pods. P99 latency unchanged."`
- Cards animate in with Framer Motion stagger.

**Step 4:**
- The central `"HPA++ Brain"` cluster explodes in a bright flash, revealing a glowing neural network SVG (animated, nodes connected by pulses) replacing the cluster dot. The network slowly animates with traveling signals.
- Headline morphs: `"One cluster is just the beginning."` → `"Cluster-Wide Resource Intelligence."`.
- Three future roadmap items fade in below the headline: `"→ Node-level forecasting"`, `"→ Reinforcement learning scheduler"`, `"→ Multi-cluster federation"` — each in dim mono, staggering in 200ms apart.

**Step 5:**
- The galaxy slowly contracts — all clusters drift toward the center, as if being unified. The background star field brightens dramatically.
- A single large caption builds character by character: `"From reactive firefighting to proactive intelligence."`.
- The transition to the final scene is a blinding white flash (2 frames: `opacity: 0 → 1 → 0`) followed by the finale scene fading in.

**Max steps: 6**

---

## Scene 10: "THE IMPACT" — Grand Finale

**Purpose:** Leave judges with the numbers burned into their memory. Triumphant, cinematic, unforgettable.

**Background mutation:** The background transitions to a slowly sweeping radial gradient: deep navy to black, with a large gold radial glow emanating from the center. Star field at medium density with subtle gold tint on some stars.

**Step 0:**
- Complete silence (visually) — the screen is dark. Only the background glow. A 1-second pause.
- A single word materializes in the center: `"RESULTS."` in `Space Grotesk 700`, white, very large (`clamp(3rem, 8vw, 6rem)`). No animation — it just appears, harsh and direct.

**Step 1:**
- The five impact stats materialize one by one with a dramatic animation: each number "thumps" into existence from scale 0.5 → 1.0 with a spring physics bounce (Framer Motion), accompanied by a subtle vibration of the background (CSS `@keyframes` applying a tiny `translate` to the whole scene for 0.1s). Numbers count up from 0 to target using a JS counter (70ms interval, easing to end). They appear with a 600ms stagger:
  
  ```
  30–50%    FASTER SCALING RESPONSE
  20–30%    LOWER REQUEST LATENCY
  40–60%    REDUCED GPU QUEUE TIME
  15–25%    HIGHER GPU UTILISATION
  25%       LOWER CLOUD COSTS
  ```
  
  Each stat: the number is in `JetBrains Mono`, very large (`clamp(2.5rem, 6vw, 5rem)`), in its accent color (cyan, green, purple, purple, gold). The label is in `Inter`, `--text-dim`, medium size. The layout is a centered column with generous vertical spacing.

**Step 2:**
- The five numbers remain. Below them, a horizontal divider line draws itself left-to-right (SVG line animation, 0.5s).
- Below the divider, the tagline fades in, word by word with 150ms stagger:
  `"Proactive."` (cyan) — pause — `"Risk-Aware."` (gold) — pause — `"Intelligent."` (white) — full stop.
- Each word is large (`clamp(1.5rem, 4vw, 3rem)`), `Space Grotesk 700`.
- The `"HPA++"` logo/wordmark rebuilds from particles below the tagline (use a canvas particle system where particles converge from random positions to form the text shape using a pixel-sampling technique on a hidden canvas containing the text). ~300 particles, 1.5s animation.

**Step 3:**
- The five stat numbers get a secondary treatment: a thin progress bar appears under each number, filling to its represented percentage from left to right over 0.8s. Left half of bar is baseline color (dim red), right half overflows in accent color — visually showing the improvement.
- Team info fades in at the bottom: `"Team Falah | Daffodil International University | AI for Cluster Intelligence Track"` in small dim mono.

**Step 4:**
- A final, single call-to-action button materializes in the center-bottom: `"[ VIEW ARCHITECTURE DEEP DIVE ]"` styled as a terminal command input. On hover, it glows cyan. On click, it loops back to Scene 7 (architecture).
- The entire background pulses slowly (the gold radial glow breathes in and out, scale 0.9 → 1.1, 3s period infinite). Like the system is alive and waiting.
- The progress bar at the top shows 100% — a satisfying completion state.

**Step 5:**
- If Enter is pressed on Step 4, a **credit sequence** briefly appears: the screen fades to black, then three lines type in mono:
  ```
  > HPA++ v1.0
  > Built by Team Falah — DIU
  > "Dont Be Reactive. Be Predictive"
  ```
  Then it loops back to Scene 0 (the title screen) — the presentation becomes a seamless loop for showcase display.

**Max steps: 6**

---

## Global Component Architecture

### File Structure
```
HPA++-presentation/
├── src/
│   ├── main.jsx
│   ├── App.jsx                    // Global state: currentScene, currentStep, keyhandler
│   ├── components/
│   │   ├── GlobalBackground.jsx   // Persistent Three.js star field canvas
│   │   ├── ProgressBar.jsx        // Top progress indicator
│   │   └── SceneWrapper.jsx       // AnimatePresence + transition wrapper
│   ├── scenes/
│   │   ├── Scene0_Ignition.jsx
│   │   ├── Scene1_Tsunami.jsx
│   │   ├── Scene2_GoldRush.jsx
│   │   ├── Scene3_Oracle.jsx
│   │   ├── Scene4_Formula.jsx
│   │   ├── Scene5_Battle.jsx
│   │   ├── Scene6_GhostScheduler.jsx
│   │   ├── Scene7_NervousSystem.jsx
│   │   ├── Scene8_Cockpit.jsx
│   │   ├── Scene9_Galaxy.jsx
│   │   └── Scene10_Impact.jsx
│   ├── hooks/
│   │   ├── useKeyPress.js         // Global Enter/ArrowRight/ArrowLeft handler
│   │   └── useTypingEffect.js     // Reusable typewriter hook
│   ├── utils/
│   │   ├── syntheticData.js       // Pre-generated time-series data for charts
│   │   └── particleText.js        // Canvas particle-to-text utility for logo
│   └── styles/
│       ├── globals.css            // CSS variables, font imports, base resets
│       └── animations.css         // Reusable keyframe animations (shake, flicker, scanline)
├── index.html
├── vite.config.js
└── package.json
```

### App.jsx Core Logic
```javascript
// Pseudo-code — implement fully in JSX
const SCENE_MAX_STEPS = [5, 6, 6, 7, 6, 6, 6, 6, 6, 6, 6]; // per scene
const [currentScene, setCurrentScene] = useState(0);
const [currentStep, setCurrentStep] = useState(0);

useEffect(() => {
  const handler = (e) => {
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      if (currentStep < SCENE_MAX_STEPS[currentScene] - 1) {
        setCurrentStep(s => s + 1);
      } else if (currentScene < SCENE_COUNT - 1) {
        setCurrentScene(s => s + 1);
        setCurrentStep(0);
      } else {
        // Loop back to 0
        setCurrentScene(0);
        setCurrentStep(0);
      }
    }
    if (e.key === 'ArrowLeft') {
      if (currentStep > 0) {
        setCurrentStep(s => s - 1);
      } else if (currentScene > 0) {
        setCurrentScene(s => s - 1);
        setCurrentStep(SCENE_MAX_STEPS[currentScene - 1] - 1);
      }
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [currentScene, currentStep]);
```

### Scene Component Interface
Each scene component must accept and use:
```jsx
function SceneN({ step }) {
  // step: 0-indexed current step within this scene
  // All content transitions are driven by (step >= N) conditionals
  // Use Framer Motion AnimatePresence + motion.div for all transitions
  // Never use setTimeout for core logic — use step gating exclusively
}
```

---

## Key Implementation Notes

### Recharts Data Strategy
Pre-generate all synthetic time-series data in `utils/syntheticData.js` at startup. Use `useMemo` to avoid recalculation. For "streaming" animations, use `useState` with a data slice that grows via `setInterval` — stream `prevData.slice(0, currentIndex)` where `currentIndex` increments every 200ms in a `useEffect` that starts when the step activating the chart is reached.

### Three.js Integration
Use `@react-three/fiber`'s `<Canvas>` component. The global background canvas should use `gl={{ antialias: true, alpha: true }}` and `style={{ position: 'fixed', top: 0, left: 0, zIndex: 0 }}`. Scene-specific 3D elements (crystal ball, galaxy) use a SECOND canvas with higher z-index, also fixed, but only rendered when `currentScene === N`.

### CSS Particle Flow Along SVG Paths (Architecture Scene)
```css
.flow-particle {
  offset-path: path("M 0 0 C ..."); /* SVG path matching the connector */
  animation: flowAlong 3s linear infinite;
}
@keyframes flowAlong {
  from { offset-distance: 0%; }
  to   { offset-distance: 100%; }
}
```

### Glassmorphism Panel Mixin
All glass panels share:
```css
.glass-panel {
  background: rgba(13, 20, 32, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 245, 255, 0.15);
  border-radius: 12px;
}
```

### Font Import (index.html `<head>`)
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
```

### Vite Config
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: './',  // important for relative paths
});
```

### Performance Guard
Every scene that is NOT `currentScene` must be unmounted (not just hidden) to prevent multiple Three.js canvases and `setInterval` calls running simultaneously. Use `AnimatePresence` and only render the active scene.

### Touch/Click Fallback
For the video recording, also support mouse click anywhere (except interactive elements) to advance steps, in addition to `Enter` key. Add a global `onClick` handler at the `App` level.

---

## Absolute Non-Negotiables

1. **Full viewport** at ALL times — no scrollbars, no overflow, `overflow: hidden` on `body` and `html`.
2. **No white flash** between scenes — the background star field canvas persists without remounting between scene transitions.
3. **All charts use real animated data** — no static images, no lorem ipsum numbers. All data must be pre-generated synthetic but realistic time-series data.
4. **No placeholder UI** — every glassmorphism panel, every chart, every label has real content from the HPA++ concept.
5. **Step gating is strict** — content for step N+1 must be completely invisible (not just transparent) until step N+1 is reached. Use `AnimatePresence` with `mode="wait"` where needed.
6. **The Battle scene (Scene 5) must truly be a live simulation** — both sides animate simultaneously in real-time, not statically. The contrast must be unmissable.
7. **The Dashboard scene (Scene 8) must be interactive** — the time scrubber and flash sale toggle must actually work and change the chart data.
8. **Fonts must load before first render** — use `document.fonts.ready` in `main.jsx` before mounting React, or use a minimal loading screen until fonts are ready.

---

*End of prompt. Total scenes: 11 (Scene 0–10). Total steps: ~66. Estimated presentation duration at ~20s per step: ~22 minutes. Build with care — this will be recorded and judged.*
