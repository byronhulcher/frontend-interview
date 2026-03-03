import { useRef } from "react"
import { useTableSentinels } from "./useTableSentinels"
import { useTableFocus } from "./useTableFocus"
import { useTableKeyboard } from "./useTableKeyboard"

/**
 * Coordinates sentinel focus traps, cell focus management, and keyboard
 * navigation. Owns the shared refs used across the three sub-hooks.
 */
export function useTableNavigation() {
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    beforeSentinel,
    afterSentinel,
    beforeSentinelRef,
    afterSentinelRef,
    sentinelFocusing,
  } = useTableSentinels({ containerRef })

  const { handleFocus } = useTableFocus({ containerRef, sentinelFocusing })

  const { handleKeyDown } = useTableKeyboard({
    containerRef,
    beforeSentinelRef,
    afterSentinelRef,
  })

  return {
    containerRef,
    beforeSentinel,
    afterSentinel,
    handleFocus,
    handleKeyDown,
  }
}
