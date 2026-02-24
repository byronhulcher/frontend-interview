import { useCallback, useEffect, useMemo, useRef } from "react"
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table"
import { TableCellWrapper } from "./TableCellWrapper"
import { HeaderCell } from "./HeaderCell"
import type { ColumnDefinition, TableData } from "./types"
import { TableContext, useTableContext } from "./TableContext"
import { useTableReducer } from "./hooks/useTableReducer"
import { useFocusTracking } from "./hooks/useFocusTracking"
import { useTableNavigation } from "./hooks/useTableNavigation"
import { sortData } from "./utils/sortData"

interface DataTableProps {
  columns: ColumnDefinition[]
  data: TableData[]
  onDataChange: (data: TableData[]) => void
}

export function DataTable({ columns, data, onDataChange }: DataTableProps) {
  const [state, dispatch] = useTableReducer(data)

  const { internalData, sortColumn, sortDirection } = state

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

  // Map from row object identity → internal index, so CellRenderer avoids O(n) indexOf.
  const internalIndexMap = useMemo(() => {
    const map = new Map<TableData, number>()
    internalData.forEach((row, i) => map.set(row, i))
    return map
  }, [internalData])

  const registerCellRef = useCallback(
    (row: number, col: number, el: HTMLElement | null) => {
      if (!cellRefs.current[row]) cellRefs.current[row] = []
      cellRefs.current[row][col] = el
    },
    [cellRefs],
  )

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      columns,
      displayData,
      internalIndexMap,
      registerCellRef,
      cellRefs,
    }),
    [
      state,
      dispatch,
      columns,
      displayData,
      internalIndexMap,
      registerCellRef,
      cellRefs,
    ],
  )

  return (
    <TableContext.Provider value={contextValue}>
      <DataTableInner onDataChange={onDataChange} />
    </TableContext.Provider>
  )
}

interface DataTableInnerProps {
  onDataChange: (data: TableData[]) => void
}

function DataTableInner({ onDataChange }: DataTableInnerProps) {
  const { state, columns, displayData } = useTableContext()
  const { internalData, focusedCell, sortColumn, sortDirection } = state

  const prevInternalDataRef = useRef(internalData)

  useFocusTracking()

  // Notify consumer when internalData changes (optional external sync).
  // Only call when data actually changes, not on initial mount.
  useEffect(() => {
    if (internalData !== prevInternalDataRef.current) {
      onDataChange(internalData)
    }
    prevInternalDataRef.current = internalData
  }, [internalData, onDataChange])

  const {
    containerRef,
    beforeSentinel,
    afterSentinel,
    handleFocus,
    handleKeyDown,
  } = useTableNavigation()

  const handleCopy = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (!focusedCell || state.editingCell || focusedCell.row === -1) return

      const column = columns[focusedCell.col]
      const row = displayData[focusedCell.row]
      const value = column.accessor ? column.accessor(row) : row[column.key]

      e.clipboardData.setData("text/plain", String(value))
      e.preventDefault()
    },
    [focusedCell, state.editingCell, columns, displayData],
  )

  return (
    <>
      {beforeSentinel}
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
                  />
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {afterSentinel}
    </>
  )
}
