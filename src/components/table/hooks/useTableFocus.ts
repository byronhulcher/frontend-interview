import { useCallback, useLayoutEffect, useRef, type RefObject } from "react"
import { useTableContext } from "../TableContext"

function focusElement(el: HTMLElement) {
  el.focus({ preventScroll: true })
  el.scrollIntoView({ block: "nearest", inline: "nearest" })
}

interface UseTableFocusOptions {
  sentinelFocusing: RefObject<boolean>
}

/**
 * Imperatively moves DOM focus to match the reducer's focusedCell state,
 * and restores focus to the cell wrapper when exiting edit mode.
 */
export function useTableFocus({ sentinelFocusing }: UseTableFocusOptions) {
  const { state, dispatch, cellRefs } = useTableContext()
  const { focusedCell, editingCell } = state

  const prevFocusedRef = useRef(focusedCell)
  const prevEditingRef = useRef(editingCell)

  // Move focus when navigating to a different cell.
  // Skipped when editing — the editor widget auto-focuses itself.
  useLayoutEffect(() => {
    const prevFocused = prevFocusedRef.current
    prevFocusedRef.current = focusedCell

    const moved =
      focusedCell?.row !== prevFocused?.row ||
      focusedCell?.col !== prevFocused?.col
    if (focusedCell && moved && !editingCell) {
      const el = cellRefs.current[focusedCell.row]?.[focusedCell.col]
      if (el) focusElement(el)
    }
  }, [focusedCell, editingCell, cellRefs])

  // Restore focus to the cell wrapper when exiting edit mode.
  useLayoutEffect(() => {
    const prevEditing = prevEditingRef.current
    prevEditingRef.current = editingCell

    if (prevEditing && !editingCell && focusedCell) {
      const el = cellRefs.current[focusedCell.row]?.[focusedCell.col]
      if (el) focusElement(el)
    }
  }, [editingCell, focusedCell, cellRefs])

  // On initial container focus, select the first header cell.
  const handleFocus = useCallback(() => {
    if (sentinelFocusing.current) return
    if (!focusedCell) {
      dispatch({ type: "FOCUS_CELL", coord: { row: -1, col: 0 } })
    }
  }, [focusedCell, dispatch, sentinelFocusing])

  return { handleFocus }
}
