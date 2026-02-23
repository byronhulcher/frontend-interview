import { useLayoutEffect, useRef } from "react"
import type { CellCoordinate } from "../types"

function focusCell(el: HTMLElement) {
  el.focus({ preventScroll: true })
  el.scrollIntoView({ block: "nearest", inline: "nearest" })
}

interface UseTableFocusOptions {
  focusedCell: CellCoordinate | null
  editingCell: CellCoordinate | null
  cellRefs: React.RefObject<(HTMLElement | null)[][]>
}

export function useTableFocus({
  focusedCell,
  editingCell,
  cellRefs,
}: UseTableFocusOptions) {
  const prevFocusedRef = useRef<CellCoordinate | null>(null)
  const prevEditingRef = useRef<CellCoordinate | null>(null)

  // Restore focus when navigating to a different cell.
  // Skipped when editingCell is set — the mounted editor widget auto-focuses itself.
  useLayoutEffect(() => {
    const wasFocused = prevFocusedRef.current
    const nowFocused = focusedCell
    prevFocusedRef.current = nowFocused

    const coordChanged =
      nowFocused?.row !== wasFocused?.row || nowFocused?.col !== wasFocused?.col
    if (nowFocused && coordChanged && !editingCell) {
      const el = cellRefs.current[nowFocused.row]?.[nowFocused.col]
      if (el) focusCell(el)
    }
  }, [focusedCell, editingCell, cellRefs])

  // Restore focus when exiting edit mode (but staying on same cell)
  useLayoutEffect(() => {
    const wasEditing = prevEditingRef.current
    const nowEditing = editingCell
    prevEditingRef.current = nowEditing

    const exitedEditMode = wasEditing && !nowEditing
    if (exitedEditMode && focusedCell) {
      const el = cellRefs.current[focusedCell.row]?.[focusedCell.col]
      if (el) focusCell(el)
    }
  }, [editingCell, focusedCell, cellRefs])
}
