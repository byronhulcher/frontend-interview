import { useCallback } from "react"
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
}

export function useTableKeyboard({
  focusedCell,
  editingCell,
  numRows,
  columns,
  dispatch,
}: UseTableKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!HANDLED_KEYS.includes(e.key)) return

      if (!focusedCell) {
        e.preventDefault()
        e.stopPropagation()
        dispatch({ type: "FOCUS_CELL", coord: { row: 0, col: 0 } })
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
          e.preventDefault()
          const tabTarget = e.shiftKey
            ? Math.max(0, col - 1)
            : Math.min(numCols - 1, col + 1)
          dispatch({ type: "FOCUS_CELL", coord: { row, col: tabTarget } })
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
