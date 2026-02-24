import { useCallback, useEffect, useMemo, useRef } from "react"
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table"
import { TableCellWrapper } from "./TableCellWrapper"
import { HeaderCell } from "./HeaderCell"
import type { ColumnDefinition, TableData } from "./types"
import { TableContext } from "./TableContext"
import { useTableReducer } from "./hooks/useTableReducer"
import { useTableFocus } from "./hooks/useTableFocus"
import { useTableKeyboard } from "./hooks/useTableKeyboard"
import { useFocusTracking } from "./hooks/useFocusTracking"
import { useTableSentinels } from "./hooks/useTableSentinels"
import { sortData } from "./utils/sortData"

interface DataTableProps {
  columns: ColumnDefinition[]
  data: TableData[]
  onDataChange: (data: TableData[]) => void
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
    [internalData, sortColumn, sortDirection, columns],
  )

  // 2D array of refs indexed by [displayIndex][colIndex] (row -1 = headers).
  const cellRefs = useRef<(HTMLElement | null)[][]>([])
  const prevInternalDataRef = useRef(internalData)

  useFocusTracking(focusedCell, displayData, dispatch)

  // Notify consumer when internalData changes (optional external sync).
  // Only call when data actually changes, not on initial mount.
  useEffect(() => {
    if (internalData !== prevInternalDataRef.current) {
      onDataChange?.(internalData)
    }
    prevInternalDataRef.current = internalData
  }, [internalData, onDataChange])

  const {
    containerRef,
    beforeSentinelRef,
    afterSentinelRef,
    sentinelFocusing,
    handleBeforeSentinelFocus,
    handleAfterSentinelFocus,
  } = useTableSentinels({
    displayDataLength: displayData.length,
    numColumns: columns.length,
    cellRefs,
    dispatch,
  })

  const { handleFocus } = useTableFocus({
    focusedCell,
    editingCell,
    cellRefs,
    dispatch,
    sentinelFocusing,
  })

  const { handleKeyDown } = useTableKeyboard({
    focusedCell,
    editingCell,
    numRows: displayData.length,
    columns,
    dispatch,
    containerRef,
    beforeSentinelRef,
    afterSentinelRef,
  })

  // Map from row object identity → internal index, so CellRenderer avoids O(n) indexOf.
  const internalIndexMap = useMemo(() => {
    const map = new Map<TableData, number>()
    internalData.forEach((row, i) => map.set(row, i))
    return map
  }, [internalData])

  const handleCopy = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (!focusedCell || editingCell || focusedCell.row === -1) return

      const column = columns[focusedCell.col]
      const row = displayData[focusedCell.row]
      const value = column.accessor ? column.accessor(row) : row[column.key]

      e.clipboardData.setData("text/plain", String(value))
      e.preventDefault()
    },
    [focusedCell, editingCell, columns, displayData],
  )

  const contextValue = useMemo(
    () => ({ state, dispatch, columns, displayData, internalIndexMap }),
    [state, dispatch, columns, displayData, internalIndexMap],
  )

  return (
    <TableContext.Provider value={contextValue}>
      <span
        ref={beforeSentinelRef}
        tabIndex={0}
        onFocus={handleBeforeSentinelFocus}
        aria-hidden="true"
        className="sr-only"
      />
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onCopy={handleCopy}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, colIndex) => (
                <HeaderCell
                  key={column.key}
                  column={column}
                  isFocused={
                    focusedCell?.row === -1 && focusedCell?.col === colIndex
                  }
                  isSorted={sortColumn === column.key}
                  sortDirection={sortDirection}
                  dispatch={dispatch}
                  cellRef={(el) => {
                    if (!cellRefs.current[-1]) cellRefs.current[-1] = []
                    cellRefs.current[-1][colIndex] = el
                  }}
                />
              ))}
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
      <span
        ref={afterSentinelRef}
        tabIndex={0}
        onFocus={handleAfterSentinelFocus}
        aria-hidden="true"
        className="sr-only"
      />
    </TableContext.Provider>
  )
}
