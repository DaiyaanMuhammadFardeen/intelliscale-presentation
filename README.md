# IntelliScale

An immersive, interactive presentation showcasing **IntelliScale** — an AI-powered cluster intelligence platform built for the DIU Hackathon by **Team Falah**.

The presentation walks through the problem of reactive cloud scaling, the gold rush of GPU costs, and how IntelliScale uses predictive AI, reinforcement learning, and neural orchestration to make clusters intelligent.

## Features

- **11 animated scenes** — each telling part of the IntelliScale story with step-by-step reveals
- **3D particle star field** — persistent Three.js background with slow-rotating torus knot
- **Live Recharts visualizations** — line charts, area charts, bar charts with animated data
- **Glassmorphism UI** — frosted-glass panels with dark-theme contrast
- **Typewriter & morph effects** — text animates character-by-character with Framer Motion
- **Keyboard navigation** — arrow keys and Enter to advance through scenes

### Scene Flow

| # | Scene | Story |
|---|-------|-------|
| 1 | **Ignition** | Title sequence with IntelliScale branding |
| 2 | **Tsunami** | Traffic surge simulation — the scaling problem |
| 3 | **Gold Rush** | GPU cost burning — the financial pressure |
| 4 | **Oracle** | Predictive intelligence introduction |
| 5 | **Formula** | Anomaly detection flow diagram |
| 6 | **Battle** | GPU contention area charts |
| 7 | **Ghost Scheduler** | Phantom auto-scaling visualization |
| 8 | **Nervous System** | Architecture deep dive with cycle timer |
| 9 | **Cockpit** | Dual monitoring dashboard |
| 10 | **Galaxy** | Neural network visualization and roadmap |
| 11 | **Impact** | Results grid and closing credits |

## Tech Stack

- **React 19** + **Vite 8** — fast dev and build
- **Three.js** via `@react-three/fiber` — 3D star field and torus knot
- **Framer Motion** — scene transitions, typewriter effects, morph animations
- **Recharts** — interactive line, area, and bar charts
- **GSAP** — timeline-based animation sequences
- **Tailwind CSS 4** — utility classes where needed
- **Oxlint** — fast Rust-based linting

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Navigation

| Key | Action |
|-----|--------|
| `Enter` / `→` | Advance to next step or scene |
| `←` | Go back one step |

Each scene has multiple steps — content reveals progressively as you navigate forward.

## Project Structure

```
src/
├── App.jsx                    # Scene registry and keyboard routing
├── index.css                  # CSS custom properties and dark theme
├── main.jsx                   # React entry point
├── components/
│   ├── BackgroundCanvas.jsx   # Three.js star field + torus knot
│   ├── BackgroundContext.jsx   # Background mutation state (tint, opacity)
│   ├── CrystalSphere.jsx      # 3D wireframe sphere component
│   ├── MatrixRain.jsx         # Falling matrix text effect
│   ├── ProgressBar.jsx        # Global scene progress indicator
│   └── Scene.jsx              # AnimatePresence scene wrapper
├── hooks/
│   ├── useBattleSimData.js    # GPU contention simulation
│   ├── useGpuContentionData.js # GPU contention time-series
│   ├── useSceneManager.js     # Step/scene state machine
│   └── useTsunamiData.js      # Traffic surge simulation
└── scenes/
    ├── TitleScene.jsx         # Opening title
    ├── TsunamiScene.jsx       # Traffic surge line chart
    ├── GoldRushScene.jsx      # GPU cost bar chart
    ├── OregonScene.jsx        # Scaling metrics
    ├── FormulaScene.jsx       # Anomaly detection flow
    ├── BattleScene.jsx        # GPU contention area charts
    ├── GhostScene.jsx         # Phantom auto-scaling
    ├── ArchitectureScene.jsx  # Deep dive with cycle timer
    ├── CockpitScene.jsx       # Monitoring dashboard
    ├── GalaxyScene.jsx        # Neural network + roadmap
    └── ImpactScene.jsx        # Results grid + credits
```

## Customization

Scenes are registered in `App.jsx` — add a new component to `src/scenes/`, import it, and append to the `SCENES` and `SCENE_COMPONENTS` arrays.

The dark theme uses CSS custom properties defined in `src/index.css` — accent colors, glass panels, and text colors are all centralized there.

## License

Built for the DIU Hackathon — AI for Cluster Intelligence Track.
