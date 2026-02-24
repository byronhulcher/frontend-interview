import { useCallback, useState } from "react"

/**
 * Returns shake state and handlers for the animate-shake animation.
 * Uses requestAnimationFrame to force a re-trigger even if already shaking.
 */
export function useShake() {
  const [isShaking, setIsShaking] = useState(false)

  const triggerShake = useCallback(() => {
    setIsShaking(false)
    requestAnimationFrame(() => setIsShaking(true))
  }, [])

  const onAnimationEnd = useCallback(() => {
    setIsShaking(false)
  }, [])

  return { isShaking, triggerShake, onAnimationEnd }
}
