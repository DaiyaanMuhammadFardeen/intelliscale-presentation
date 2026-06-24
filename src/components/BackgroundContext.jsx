import { createContext, useContext, useState, useCallback } from 'react'

const BackgroundContext = createContext(null)

const DEFAULT_STATE = {
  torusKnot: false,
  torusKnotSpeed: 0.003,
  torusKnotOpacity: 1,
  particleOpacity: 0.8,
  tint: null, // { r, g, b, opacity } for colored nebula overlay
}

export function BackgroundProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE)

  const mutate = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  const reset = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [])

  return (
    <BackgroundContext.Provider value={{ ...state, mutate, reset }}>
      {children}
    </BackgroundContext.Provider>
  )
}

export function useBackgroundMutation() {
  const ctx = useContext(BackgroundContext)
  if (!ctx) {
    throw new Error('useBackgroundMutation must be used within BackgroundProvider')
  }
  return ctx
}
