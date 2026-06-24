import { useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import BackgroundCanvas from './components/BackgroundCanvas'
import { BackgroundProvider } from './components/BackgroundContext'
import ProgressBar from './components/ProgressBar'
import Scene from './components/Scene'
import { useSceneManager } from './hooks/useSceneManager'
import TitleScene from './scenes/TitleScene'
import TsunamiScene from './scenes/TsunamiScene'
import GoldRushScene from './scenes/GoldRushScene'
import OregonScene from './scenes/OregonScene'
import FormulaScene from './scenes/FormulaScene'
import BattleScene from './scenes/BattleScene'
import GhostScene from './scenes/GhostScene'
import ArchitectureScene from './scenes/ArchitectureScene'
import CockpitScene from './scenes/CockpitScene'
import GalaxyScene from './scenes/GalaxyScene'
import ImpactScene from './scenes/ImpactScene'

/* ─── Scene Configuration ───
 * Add new scenes here: { name, steps }
 * The index order determines presentation flow.
 */
const SCENES = [
  { name: 'IGNITION', steps: 5 },
  { name: 'TSUNAMI', steps: 6 },
  { name: 'GOLD RUSH', steps: 6 },
  { name: 'ORACLE', steps: 7 },
  { name: 'FORMULA', steps: 6 },
  { name: 'BATTLE', steps: 6 },
  { name: 'GHOST SCHEDULER', steps: 6 },
  { name: 'NERVOUS SYSTEM', steps: 6 },
  { name: 'COCKPIT', steps: 6 },
  { name: 'GALAXY', steps: 6 },
  { name: 'IMPACT', steps: 6 },
]

/* ─── Scene Registry ───
 * Maps scene index → component.
 * Add imports above, then register here in the same order.
 */
const SCENE_COMPONENTS = [
  TitleScene,
  TsunamiScene,
  GoldRushScene,
  OregonScene,
  FormulaScene,
  BattleScene,
  GhostScene,
  ArchitectureScene,
  CockpitScene,
  GalaxyScene,
  ImpactScene,
]

export default function App() {
  const sceneManager = useSceneManager(SCENES)

  /* ── Global Keyboard Navigation ── */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        sceneManager.advanceStep()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        sceneManager.prevStep()
      }
    },
    [sceneManager]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const CurrentSceneComponent = SCENE_COMPONENTS[sceneManager.currentScene]
  const sceneConfig = SCENES[sceneManager.currentScene]

  return (
    <BackgroundProvider>
      {/* Persistent 3D star field behind everything */}
      <BackgroundCanvas />

      {/* Global progress bar */}
      <ProgressBar
        totalSteps={sceneManager.totalSteps}
        consumed={sceneManager.totalConsumed}
        scenes={SCENES}
        currentScene={sceneManager.currentScene}
      />

      {/* Scene transitions */}
      <AnimatePresence mode="wait">
        <Scene
          key={sceneManager.currentScene}
          id={sceneConfig?.name ?? 'scene'}
          step={sceneManager.step}
          maxSteps={sceneConfig?.steps ?? 0}
        >
          {CurrentSceneComponent && (
            <CurrentSceneComponent
              step={sceneManager.step}
              maxSteps={sceneConfig?.steps ?? 0}
            />
          )}
        </Scene>
      </AnimatePresence>
    </BackgroundProvider>
  )
}
