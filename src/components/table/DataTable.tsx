import { useEffect, useLayoutEffect, useReducer, useRef } from "react"
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

  useLayoutEffect(() => {
    const prev = prevFocusedRef.current
    const curr = focusedCell
    prevFocusedRef.current = curr

    const coordChanged = curr?.row !== prev?.row || curr?.col !== prev?.col
    if (curr && coordChanged && !editingCell) {
      const el = cellRefs.current[curr.row]?.[curr.col]
      el?.focus({ preventScroll: true })
      el?.scrollIntoView({ block: "nearest", inline: "nearest" })
    }
  }, [focusedCell, editingCell])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
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
  }

  // Renders only the inner content — <TableCell> wrapper is handled below so
  // DataTable owns all td-level interaction (tabIndex, onClick, ref, outline).
  function renderCellContent(column: ColumnDefinition, row: TableData) {
    const value = column.accessor ? column.accessor(row) : row[column.key]

    switch (column.type) {
      case "boolean":
        return <BoolTableCell value={value as boolean} />
      case "text":
        return <TextTableCell value={value as string} />
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

  function handleFocus() {
    if (!focusedCell) {
      dispatch({ type: "FOCUS_CELL", coord: { row: 0, col: 0 } })
    }
  }

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
                      {renderCellContent(column, row)}
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
