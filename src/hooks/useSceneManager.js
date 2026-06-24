import { useState, useCallback, useMemo } from 'react';

export function useSceneManager(sceneConfigs) {
  const [currentScene, setCurrentScene] = useState(0);
  const [step, setStep] = useState(0);

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
  };
}
