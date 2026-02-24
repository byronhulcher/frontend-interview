import { useCallback, type RefObject } from "react"
import type { TableAction } from "../TableContext"
import type { CellCoordinate, ColumnDefinition } from "../types"
import { ARROW_KEYS } from "../consts"

const HANDLED_KEYS = [...ARROW_KEYS, "Tab", "Enter", "Escape"]

interface UseTableKeyboardOptions {
  focusedCell: CellCoordinate | null
  editingCell: CellCoordinate | null
  numRows: number
  columns: ColumnDefinition[]
  dispatch: React.Dispatch<TableAction>
  containerRef: RefObject<HTMLDivElement | null>
  beforeSentinelRef: RefObject<HTMLSpanElement | null>
  afterSentinelRef: RefObject<HTMLSpanElement | null>
}

export function useTableKeyboard({
  focusedCell,
  editingCell,
  numRows,
  columns,
  dispatch,
  containerRef,
  beforeSentinelRef,
  afterSentinelRef,
}: UseTableKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!HANDLED_KEYS.includes(e.key)) return

      if (!focusedCell) {
        e.preventDefault()
        e.stopPropagation()
        dispatch({ type: "FOCUS_CELL", coord: { row: -1, col: 0 } })
        return
      }

      e.stopPropagation()

      const numCols = columns.length
      const { row, col } = focusedCell

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          if (e.shiftKey) {
            dispatch({ type: "FOCUS_CELL", coord: { row: -1, col } })
          } else if (row > -1) {
            dispatch({ type: "FOCUS_CELL", coord: { row: row - 1, col } })
          }
          break
        case "ArrowDown":
          e.preventDefault()
          if (e.shiftKey) {
            dispatch({ type: "FOCUS_CELL", coord: { row: numRows - 1, col } })
          } else if (row < numRows - 1) {
            dispatch({ type: "FOCUS_CELL", coord: { row: row + 1, col } })
          }
          break
        case "ArrowLeft":
          e.preventDefault()
          if (e.shiftKey) {
            dispatch({ type: "FOCUS_CELL", coord: { row, col: 0 } })
          } else {
            dispatch({
              type: "FOCUS_CELL",
              coord: { row, col: Math.max(0, col - 1) },
            })
          }
          break
        case "ArrowRight":
          e.preventDefault()
          if (e.shiftKey) {
            dispatch({ type: "FOCUS_CELL", coord: { row, col: numCols - 1 } })
          } else {
            dispatch({
              type: "FOCUS_CELL",
              coord: { row, col: Math.min(numCols - 1, col + 1) },
            })
          }
          break
        case "Tab": {
          if (e.shiftKey) {
            if (col > 0) {
              e.preventDefault()
              dispatch({ type: "FOCUS_CELL", coord: { row, col: col - 1 } })
            } else if (row > -1) {
              e.preventDefault()
              dispatch({
                type: "FOCUS_CELL",
                coord: { row: row - 1, col: numCols - 1 },
              })
            } else {
              // Temporarily remove from tab order so browser skips to external elements
              if (containerRef.current) containerRef.current.tabIndex = -1
              if (beforeSentinelRef.current)
                beforeSentinelRef.current.tabIndex = -1
              requestAnimationFrame(() => {
                if (containerRef.current) containerRef.current.tabIndex = 0
                if (beforeSentinelRef.current)
                  beforeSentinelRef.current.tabIndex = 0
              })
              dispatch({ type: "CLEAR_FOCUS" })
            }
          } else {
            if (col < numCols - 1) {
              e.preventDefault()
              dispatch({ type: "FOCUS_CELL", coord: { row, col: col + 1 } })
            } else if (row < numRows - 1) {
              e.preventDefault()
              dispatch({
                type: "FOCUS_CELL",
                coord: { row: row + 1, col: 0 },
              })
            } else {
              // Temporarily remove from tab order so browser skips to external elements
              if (containerRef.current) containerRef.current.tabIndex = -1
              if (afterSentinelRef.current)
                afterSentinelRef.current.tabIndex = -1
              requestAnimationFrame(() => {
                if (containerRef.current) containerRef.current.tabIndex = 0
                if (afterSentinelRef.current)
                  afterSentinelRef.current.tabIndex = 0
              })
              dispatch({ type: "CLEAR_FOCUS" })
            }
          }
          break
        }
        case "Enter": {
          e.preventDefault()
          if (row !== -1) {
            const colDef = columns[focusedCell.col]
            if (colDef.editable !== false) {
              dispatch({ type: "EDIT_CELL", coord: focusedCell })
            }
          }
          break
        }
        case "Escape":
          e.preventDefault()
          if (editingCell) {
            dispatch({ type: "CLEAR_EDIT" })
          } else {
            dispatch({ type: "CLEAR_FOCUS" })
          }
          break
      }
    },
    [focusedCell, editingCell, numRows, columns, dispatch],
  )

  return { handleKeyDown }
}
