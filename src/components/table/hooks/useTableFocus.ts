import { useCallback, useLayoutEffect, useRef, type RefObject } from "react"
import { useTableReactiveContext } from "../context/TableReactiveContext"
import { useTableStableContext } from "../context/TableStableContext"

function focusElement(el: HTMLElement) {
  el.focus({ preventScroll: true })
  el.scrollIntoView({ block: "nearest", inline: "nearest" })
}

interface UseTableFocusOptions {
  containerRef: RefObject<HTMLDivElement | null>
  sentinelFocusing: RefObject<boolean>
}

/**
 * Imperatively moves DOM focus to match the reducer's focusedCell state,
 * and restores focus to the cell wrapper when exiting edit mode.
 */
export function useTableFocus({ containerRef, sentinelFocusing }: UseTableFocusOptions) {
  const { state } = useTableReactiveContext()
  const { tableId, dispatch, cellRefs } = useTableStableContext()
  const { focusedCell, editingCell } = state

  const prevEditingRef = useRef(editingCell)

  // Move focus when navigating to a different cell, or when the focused cell's
  // DOM element is replaced (e.g. after a row deletion causes a re-render).
  // Skipped when editing — the editor widget auto-focuses itself.
  useLayoutEffect(() => {
    if (focusedCell && !editingCell) {
      const el = cellRefs.current[focusedCell.row]?.[focusedCell.col]
      const active = document.activeElement
      const focusIsRelevant = !active || active === document.body || containerRef.current?.contains(active)
      if (el && active !== el && focusIsRelevant) {
        focusElement(el)
      }
    }
  }, [tableId, focusedCell, editingCell, cellRefs, containerRef])

  // Restore focus to the cell wrapper when exiting edit mode.
  useLayoutEffect(() => {
    const prevEditing = prevEditingRef.current
    prevEditingRef.current = editingCell

    if (prevEditing && !editingCell && focusedCell) {
      const el = cellRefs.current[focusedCell.row]?.[focusedCell.col]
      const active = document.activeElement
      const focusIsRelevant = !active || active === document.body || containerRef.current?.contains(active)
      if (el && active !== el && focusIsRelevant) {
        focusElement(el)
      }
    }
  }, [tableId, editingCell, focusedCell, cellRefs])

  // On initial container focus, select the first header cell.
  const handleFocus = useCallback(() => {
    if (sentinelFocusing.current) return
    if (!focusedCell) {
      dispatch({ type: "FOCUS_CELL", coord: { row: -1, col: 0 } })
    }
  }, [focusedCell, dispatch, sentinelFocusing])

  return { handleFocus }
}
