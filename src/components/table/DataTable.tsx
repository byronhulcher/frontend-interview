import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useCallback,
} from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BoolTableCell } from "./BoolTableCell"
import { TextTableCell } from "./TextTableCell"
import { NumberTableCell } from "./NumberTableCell"
import { PopperTableCell } from "./PopperTableCell"
import type { CellCoordinate, ColumnDefinition, TableData } from "./types"
import { TableContext } from "./TableContext"
import { tableReducer } from "./tableReducer"
import { cn } from "@/lib/utils"

interface DataTableProps {
  columns: ColumnDefinition[]
  data: TableData[]
  onDataChange?: (data: TableData[]) => void
}

export function DataTable({ columns, data, onDataChange }: DataTableProps) {
  const [state, dispatch] = useReducer(tableReducer, {
    focusedCell: null,
    editingCell: null,
    internalData: data,
  })

  const { internalData, focusedCell, editingCell } = state

  // 2D array of td refs indexed by [rowIndex][colIndex].
  // Stored as a ref so assignments never cause re-renders.
  const cellRefs = useRef<(HTMLElement | null)[][]>([])

  // Notify consumer when internalData changes (optional external sync).
  // Use useEffect (not render-time access) to observe and sync external data.
  useEffect(() => {
    onDataChange?.(internalData)
  }, [internalData, onDataChange])

  // Programmatic focus: fires after render when focusedCell changes coordinates.
  // - preventScroll avoids fighting the browser's default scroll-on-focus behavior.
  // - scrollIntoView is called separately so we control scroll alignment.
  // - Skipped when editingCell is set — the mounted editor widget auto-focuses itself.
  const prevFocusedRef = useRef<CellCoordinate | null>(null)
  const prevEditingRef = useRef<CellCoordinate | null>(null)

  const applyFocus = useCallback(
    (coord: CellCoordinate) => {
      const el = cellRefs.current[coord.row]?.[coord.col]
      if (el) {
        el.focus({ preventScroll: true })
        el.scrollIntoView({ block: "nearest", inline: "nearest" })
      }
    },
    [cellRefs]
  )

  // Restore focus when navigating to a different cell
  useLayoutEffect(() => {
    const wasFocused = prevFocusedRef.current
    const nowFocused = focusedCell
    prevFocusedRef.current = nowFocused

    const coordChanged =
      nowFocused?.row !== wasFocused?.row || nowFocused?.col !== wasFocused?.col
    if (nowFocused && coordChanged && !editingCell) {
      applyFocus(nowFocused)
    }
  }, [focusedCell, editingCell, applyFocus])

  // Restore focus when exiting edit mode (but staying on same cell)
  useLayoutEffect(() => {
    const wasEditing = prevEditingRef.current
    const nowEditing = editingCell
    prevEditingRef.current = nowEditing

    const exitedEditMode = wasEditing && !nowEditing
    if (exitedEditMode && focusedCell) {
      applyFocus(focusedCell)
    }
  }, [editingCell, focusedCell, applyFocus])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const navKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Tab",
        "Enter",
        "Escape",
      ]
      if (!navKeys.includes(e.key)) return

      if (!focusedCell) {
        // No cell focused — any nav key focuses the first cell
        e.preventDefault()
        e.stopPropagation()
        dispatch({ type: "FOCUS_CELL", coord: { row: 0, col: 0 } })
        return
      }

      // Cell is focused — consume the event so parent tables are unaffected
      e.stopPropagation()

      const numRows = internalData.length
      const numCols = columns.length
      const { row, col } = focusedCell

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          dispatch({
            type: "FOCUS_CELL",
            coord: { row: Math.max(0, row - 1), col },
          })
          break
        case "ArrowDown":
          e.preventDefault()
          dispatch({
            type: "FOCUS_CELL",
            coord: { row: Math.min(numRows - 1, row + 1), col },
          })
          break
        case "ArrowLeft":
          e.preventDefault()
          dispatch({
            type: "FOCUS_CELL",
            coord: { row, col: Math.max(0, col - 1) },
          })
          break
        case "ArrowRight":
          e.preventDefault()
          dispatch({
            type: "FOCUS_CELL",
            coord: { row, col: Math.min(numCols - 1, col + 1) },
          })
          break
        case "Tab":
          e.preventDefault()
          if (e.shiftKey) {
            dispatch({
              type: "FOCUS_CELL",
              coord: { row, col: Math.max(0, col - 1) },
            })
          } else {
            dispatch({
              type: "FOCUS_CELL",
              coord: { row, col: Math.min(numCols - 1, col + 1) },
            })
          }
          break
        case "Enter":
          e.preventDefault()
          dispatch({ type: "EDIT_CELL", coord: focusedCell })
          break
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
    [focusedCell, editingCell, internalData.length, columns.length]
  )

  // Renders only the inner content — <TableCell> wrapper is handled below so
  // DataTable owns all td-level interaction (tabIndex, onClick, ref, outline).
  function renderCellContent(
    column: ColumnDefinition,
    row: TableData,
    rowIndex: number,
    colIndex: number
  ) {
    const value = column.accessor ? column.accessor(row) : row[column.key]
    const isEditing =
      editingCell?.row === rowIndex && editingCell?.col === colIndex

    switch (column.type) {
      case "boolean":
        return <BoolTableCell value={value as boolean} />
      case "text":
        return (
          <TextTableCell
            value={value as string}
            isEditing={isEditing}
            onCellChange={(newValue) => {
              dispatch({
                type: "UPDATE_CELL",
                row: rowIndex,
                columnKey: column.key,
                value: newValue,
              })
            }}
            onExitEdit={() => {
              dispatch({ type: "CLEAR_EDIT" })
            }}
          />
        )
      case "number":
        return (
          <NumberTableCell value={value as number} format={column.format} />
        )
      case "popper":
        return (
          <PopperTableCell
            value={value as string}
            triggerText={column.triggerText}
          />
        )
      default:
        return <>{String(value)}</>
    }
  }

  const handleFocus = useCallback(() => {
    if (!focusedCell) {
      dispatch({ type: "FOCUS_CELL", coord: { row: 0, col: 0 } })
    }
  }, [focusedCell])

  return (
    <TableContext.Provider value={{ state, dispatch, cellRefs, columns }}>
      {/* Wrapper is a native tab stop. When table gains focus, auto-focus cell {0,0} */}
      <div tabIndex={0} onKeyDown={handleKeyDown} onFocus={handleFocus}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={
                    column.type === "number"
                      ? "text-right"
                      : column.type === "boolean"
                        ? "text-center"
                        : ""
                  }
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {internalData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => {
                  const isFocused =
                    focusedCell?.row === rowIndex &&
                    focusedCell?.col === colIndex
                  const isEditing =
                    editingCell?.row === rowIndex &&
                    editingCell?.col === colIndex

                  return (
                    <TableCell
                      key={column.key}
                      ref={(el) => {
                        if (!cellRefs.current[rowIndex])
                          cellRefs.current[rowIndex] = []
                        cellRefs.current[rowIndex][colIndex] = el
                      }}
                      // Roving tabIndex: only the focused cell is in the tab order.
                      // All others are reachable via arrow keys but not Tab traversal.
                      tabIndex={isFocused ? 0 : -1}
                      // Suppress browser's default focus outline — we render our own
                      // via ring-inset so it stays within the cell border.
                      className={cn(
                        "cursor-default select-none focus-visible:outline-none",
                        isFocused &&
                          !isEditing &&
                          "ring-2 ring-inset ring-blue-400",
                        isEditing && "ring-2 ring-inset ring-orange-400"
                      )}
                      onClick={() => {
                        const coord = { row: rowIndex, col: colIndex }
                        const alreadyFocused =
                          focusedCell?.row === rowIndex &&
                          focusedCell?.col === colIndex
                        if (alreadyFocused) {
                          dispatch({ type: "EDIT_CELL", coord })
                        } else {
                          dispatch({ type: "FOCUS_CELL", coord })
                        }
                      }}
                    >
                      {renderCellContent(column, row, rowIndex, colIndex)}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContext.Provider>
  )
}
