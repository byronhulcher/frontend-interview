import { useEffect, useMemo, useRef } from "react"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableCellWrapper } from "./TableCellWrapper"
import type { ColumnDefinition, TableData } from "./types"
import { TableContext } from "./TableContext"
import { useTableReducer } from "./hooks/useTableReducer"
import { useTableFocus } from "./hooks/useTableFocus"
import { useTableKeyboard } from "./hooks/useTableKeyboard"
import { sortData } from "./utils/sortData"

interface DataTableProps {
  columns: ColumnDefinition[]
  data: TableData[]
  onDataChange?: (data: TableData[]) => void
}

export function DataTable({ columns, data, onDataChange }: DataTableProps) {
  const [state, dispatch] = useTableReducer(data)

  const { internalData, focusedCell, editingCell, sortColumn, sortDirection } =
    state

  // Compute sorted display data. Display is sorted, but internalData sent
  // to onDataChange is kept in original order (sorting is UI-only).
  const displayData = useMemo(
    () =>
      sortColumn
        ? sortData(internalData, sortColumn, sortDirection, columns)
        : internalData,
    [internalData, sortColumn, sortDirection, columns]
  )

  // 2D array of refs indexed by [displayIndex][colIndex] (row -1 = headers).
  const cellRefs = useRef<(HTMLElement | null)[][]>([])
  const focusedRowIdRef = useRef<unknown>(null)
  const prevDisplayDataRef = useRef(displayData)

  // After a cell edit changes sort order, follow the focused row to its new position.
  // We track by row ID (stable across edits) rather than object identity, because
  // UPDATE_CELL creates a new row object via spread.
  useEffect(() => {
    const dataChanged = prevDisplayDataRef.current !== displayData
    prevDisplayDataRef.current = displayData

    if (
      dataChanged &&
      focusedRowIdRef.current != null &&
      focusedCell &&
      focusedCell.row >= 0
    ) {
      const newIndex = displayData.findIndex(
        (r) => r.id === focusedRowIdRef.current
      )
      if (newIndex >= 0 && newIndex !== focusedCell.row) {
        dispatch({
          type: "FOCUS_CELL",
          coord: { row: newIndex, col: focusedCell.col },
        })
        return
      }
    }

    // Update tracking to match current focus position
    if (focusedCell && focusedCell.row >= 0 && displayData[focusedCell.row]) {
      focusedRowIdRef.current = displayData[focusedCell.row].id
    } else {
      focusedRowIdRef.current = null
    }
  }, [focusedCell, displayData, dispatch])

  // Notify consumer when internalData changes (optional external sync).
  useEffect(() => {
    onDataChange?.(internalData)
  }, [internalData, onDataChange])

  useTableFocus({ focusedCell, editingCell, cellRefs })

  const { handleKeyDown, handleFocus } = useTableKeyboard({
    focusedCell,
    editingCell,
    numRows: displayData.length,
    columns,
    dispatch,
  })

  const handleCopy = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!focusedCell || editingCell || focusedCell.row === -1) return

    const column = columns[focusedCell.col]
    const row = displayData[focusedCell.row]
    const value = column.accessor ? column.accessor(row) : row[column.key]

    e.clipboardData.setData("text/plain", String(value))
    e.preventDefault()
  }

  return (
    <TableContext.Provider value={{ state, dispatch, columns, displayData }}>
      {/* Wrapper is a native tab stop. When table gains focus, auto-focus cell {0,0} */}
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onCopy={handleCopy}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, colIndex) => {
                const isSorted = sortColumn === column.key
                const sortIndicator =
                  isSorted && sortDirection === "asc"
                    ? "⏶"
                    : isSorted && sortDirection === "desc"
                      ? "⏷"
                      : ""
                const isHeaderFocused =
                  focusedCell?.row === -1 && focusedCell?.col === colIndex

                return (
                  <TableHead
                    key={column.key}
                    ref={(el) => {
                      if (!cellRefs.current[-1]) cellRefs.current[-1] = []
                      cellRefs.current[-1][colIndex] = el
                    }}
                    tabIndex={isHeaderFocused ? 0 : -1}
                    className={`cursor-pointer select-none focus-visible:outline-none ${
                      isHeaderFocused && "ring-2 ring-inset ring-blue-400"
                    } ${
                      column.type === "number"
                        ? "text-right"
                        : column.type === "boolean"
                          ? "text-center"
                          : ""
                    }`}
                    onClick={() =>
                      dispatch({ type: "SORT_COLUMN", columnKey: column.key })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        e.stopPropagation()
                        dispatch({ type: "SORT_COLUMN", columnKey: column.key })
                      }
                    }}
                  >
                    {column.header} {sortIndicator}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, displayIndex) => (
              <TableRow key={row.id as string | number}>
                {columns.map((column, colIndex) => (
                  <TableCellWrapper
                    key={column.key}
                    rowIndex={displayIndex}
                    colIndex={colIndex}
                    cellRef={(el) => {
                      if (!cellRefs.current[displayIndex])
                        cellRefs.current[displayIndex] = []
                      cellRefs.current[displayIndex][colIndex] = el
                    }}
                  />
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContext.Provider>
  )
}
