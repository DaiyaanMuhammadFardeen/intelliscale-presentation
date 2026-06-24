import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

const AUTO_PLAY_DELAY = 4000; // ms between auto-advance steps

export function useSceneManager(sceneConfigs) {
  const [currentScene, setCurrentScene] = useState(0);
  const [step, setStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const timerRef = useRef(null);
  const sceneRef = useRef(currentScene);
  const stepRef = useRef(step);

  // Keep refs in sync with state
  sceneRef.current = currentScene;
  stepRef.current = step;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const maxStepsForScene = useMemo(
    () => (sceneConfigs[currentScene] ? sceneConfigs[currentScene].steps : 0),
    [sceneConfigs, currentScene]
  );

  const totalSteps = useMemo(
    () => sceneConfigs.reduce((sum, scene) => sum + scene.steps, 0),
    [sceneConfigs]
  );

  const totalConsumed = useMemo(() => {
    let completed = 0;
    for (let i = 0; i < currentScene; i++) {
      completed += sceneConfigs[i].steps;
    }
    return completed + step;
  }, [sceneConfigs, currentScene, step]);

  const currentSceneName = useMemo(
    () => (sceneConfigs[currentScene] ? sceneConfigs[currentScene].name : ''),
    [sceneConfigs, currentScene]
  );

  const isLastStep = useMemo(
    () => step === maxStepsForScene - 1,
    [step, maxStepsForScene]
  );

  const isFirstScene = useMemo(() => currentScene === 0, [currentScene]);

  const isLastScene = useMemo(
    () => currentScene === sceneConfigs.length - 1,
    [currentScene, sceneConfigs]
  );

  const advanceStep = useCallback(() => {
    if (step < maxStepsForScene - 1) {
      setStep((s) => s + 1);
    } else if (step === maxStepsForScene - 1) {
      if (currentScene < sceneConfigs.length - 1) {
        setCurrentScene((s) => s + 1);
        setStep(0);
      }
    }
  }, [step, maxStepsForScene, currentScene, sceneConfigs]);

  const prevStep = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else if (step === 0 && currentScene > 0) {
      const prevScene = currentScene - 1;
      setCurrentScene(prevScene);
      setStep(sceneConfigs[prevScene].steps - 1);
    }
  }, [step, currentScene, sceneConfigs]);

  const goToScene = useCallback((index) => {
    setCurrentScene(index);
    setStep(0);
  }, []);

  /* ─── Auto-Play Logic ─── */
  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsAutoPlaying(false);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => {
      if (prev) {
        // Currently playing → stop
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return false;
      } else {
        // Currently stopped → start
        return true;
      }
    });
  }, []);

  // When isAutoPlaying changes, manage the interval
  useEffect(() => {
    if (isAutoPlaying) {
      timerRef.current = setInterval(() => {
        const s = stepRef.current;
        const sc = sceneRef.current;
        const maxSteps = sceneConfigs[sc]?.steps ?? 0;

        if (s < maxSteps - 1) {
          // Advance step within current scene
          setStep(s + 1);
        } else if (sc < sceneConfigs.length - 1) {
          // Move to next scene
          setCurrentScene(sc + 1);
          setStep(0);
        } else {
          // Last step of last scene — stop auto-play
          stopAutoPlay();
        }
      }, AUTO_PLAY_DELAY);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAutoPlaying, sceneConfigs, stopAutoPlay]);

  return {
    currentScene,
    step,
    advanceStep,
    prevStep,
    goToScene,
    totalSteps,
    totalConsumed,
    scenes: sceneConfigs,
    currentSceneName,
    isLastStep,
    isFirstScene,
    isLastScene,
    isAutoPlaying,
    toggleAutoPlay,
    stopAutoPlay,
  };
}
