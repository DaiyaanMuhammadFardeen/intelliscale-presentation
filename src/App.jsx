import { lazy, Suspense, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BackgroundProvider } from './components/BackgroundContext'
import ProgressBar from './components/ProgressBar'
import SEO from './components/SEO'
import Scene from './components/Scene'
import { useSceneManager } from './hooks/useSceneManager'

const BackgroundCanvas = lazy(() => import('./components/BackgroundCanvas'))

/* ─── Scene Configuration ───
 * Add new scenes here: { name, steps }
 * The index order determines presentation flow.
 */
const SCENES = [
  { name: 'IGNITION', slug: 'ignition', steps: 5 },
  { name: 'TSUNAMI', slug: 'tsunami', steps: 6 },
  { name: 'GOLD RUSH', slug: 'gold-rush', steps: 6 },
  { name: 'ORACLE', slug: 'oracle', steps: 7 },
  { name: 'FORMULA', slug: 'formula', steps: 6 },
  { name: 'BATTLE', slug: 'battle', steps: 6 },
  { name: 'GHOST SCHEDULER', slug: 'ghost-scheduler', steps: 6 },
  { name: 'NERVOUS SYSTEM', slug: 'nervous-system', steps: 6 },
  { name: 'COCKPIT', slug: 'cockpit', steps: 6 },
  { name: 'GALAXY', slug: 'galaxy', steps: 6 },
  { name: 'IMPACT', slug: 'impact', steps: 6 },
]

/* ─── Scene Registry ───
 * Maps scene index → component.
 * Add imports above, then register here in the same order.
 */
const SCENE_LOADERS = [
  () => import('./scenes/TitleScene'),
  () => import('./scenes/TsunamiScene'),
  () => import('./scenes/GoldRushScene'),
  () => import('./scenes/OregonScene'),
  () => import('./scenes/FormulaScene'),
  () => import('./scenes/BattleScene'),
  () => import('./scenes/GhostScene'),
  () => import('./scenes/ArchitectureScene'),
  () => import('./scenes/CockpitScene'),
  () => import('./scenes/GalaxyScene'),
  () => import('./scenes/ImpactScene'),
]

const SCENE_COMPONENTS = SCENE_LOADERS.map((loadScene) => lazy(loadScene))

export default function App() {
  const sceneManager = useSceneManager(SCENES)
  const currentScene = sceneManager.currentScene

  /* ── Global Keyboard Navigation ── */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        sceneManager.toggleAutoPlay()
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        if (sceneManager.isAutoPlaying) sceneManager.stopAutoPlay()
        sceneManager.advanceStep()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (sceneManager.isAutoPlaying) sceneManager.stopAutoPlay()
        sceneManager.prevStep()
      }
    },
    [sceneManager]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const CurrentSceneComponent = SCENE_COMPONENTS[currentScene]
  const sceneConfig = SCENES[currentScene]

  useEffect(() => {
    SCENE_LOADERS[currentScene + 1]?.()
  }, [currentScene])

  return (
    <BackgroundProvider>
      {/* SEO - Dynamic head management per scene */}
      <SEO scene={sceneConfig?.name} />

      {/* Semantic HTML structure */}
      <main role="main" aria-label="HPA++ Presentation">
        {/* Persistent 3D star field behind everything */}
        <Suspense fallback={null}>
          <BackgroundCanvas />
        </Suspense>

        {/* Global progress bar */}
        <ProgressBar
          totalSteps={sceneManager.totalSteps}
          consumed={sceneManager.totalConsumed}
          scenes={SCENES}
          currentScene={currentScene}
          isAutoPlaying={sceneManager.isAutoPlaying}
        />

        {/* Scene transitions */}
        <AnimatePresence mode="wait">
          <Scene
            key={currentScene}
            id={sceneConfig?.name ?? 'scene'}
            step={sceneManager.step}
            maxSteps={sceneConfig?.steps ?? 0}
          >
            {CurrentSceneComponent && (
              <Suspense
                fallback={
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      display: 'grid',
                      width: '100%',
                      height: '100%',
                      placeItems: 'center',
                      color: '#94a3b8',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    Loading scene...
                  </div>
                }
              >
                <CurrentSceneComponent
                  step={sceneManager.step}
                  maxSteps={sceneConfig?.steps ?? 0}
                />
              </Suspense>
            )}
          </Scene>
        </AnimatePresence>
      </main>
    </BackgroundProvider>
  )
}
