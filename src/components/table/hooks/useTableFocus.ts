import { useCallback, useLayoutEffect, useRef } from "react"
import type { CellCoordinate } from "../types"
import type { TableAction } from "../TableContext"

function focusElement(el: HTMLElement) {
  el.focus({ preventScroll: true })
  el.scrollIntoView({ block: "nearest", inline: "nearest" })
}

interface UseTableFocusOptions {
  focusedCell: CellCoordinate | null
  editingCell: CellCoordinate | null
  cellRefs: React.RefObject<(HTMLElement | null)[][]>
  dispatch: React.Dispatch<TableAction>
}

export function useTableFocus({
  focusedCell,
  editingCell,
  cellRefs,
  dispatch,
}: UseTableFocusOptions) {
  const prevFocusedRef = useRef<CellCoordinate | null>(null)
  const prevEditingRef = useRef<CellCoordinate | null>(null)

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

  // Restore focus to the cell wrapper when exiting edit mode
  useLayoutEffect(() => {
    const prevEditing = prevEditingRef.current
    prevEditingRef.current = editingCell

    if (prevEditing && !editingCell && focusedCell) {
      const el = cellRefs.current[focusedCell.row]?.[focusedCell.col]
      if (el) focusElement(el)
    }
  }, [editingCell, focusedCell, cellRefs])

  // On initial focus, select the first header cell
  const handleFocus = useCallback(() => {
    if (!focusedCell) {
      dispatch({ type: "FOCUS_CELL", coord: { row: -1, col: 0 } })
    }
  }, [focusedCell, dispatch])

  return { handleFocus }
}
