import { useEffect, useRef } from "react"
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

interface DataTableProps {
  columns: ColumnDefinition[]
  data: TableData[]
  onDataChange?: (data: TableData[]) => void
}

export function DataTable({ columns, data, onDataChange }: DataTableProps) {
  const [state, dispatch] = useTableReducer(data)

  const { internalData, focusedCell, editingCell } = state

  // 2D array of td refs indexed by [rowIndex][colIndex].
  // Stored as a ref so assignments never cause re-renders.
  const cellRefs = useRef<(HTMLElement | null)[][]>([])

  // Notify consumer when internalData changes (optional external sync).
  // Use useEffect (not render-time access) to observe and sync external data.
  useEffect(() => {
    onDataChange?.(internalData)
  }, [internalData, onDataChange])

  useTableFocus({ focusedCell, editingCell, cellRefs })

  const { handleKeyDown, handleFocus } = useTableKeyboard({
    focusedCell,
    editingCell,
    internalData,
    columns,
    dispatch,
  })

  return (
    <TableContext.Provider value={{ state, dispatch, columns }}>
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
            {internalData.map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <TableCellWrapper
                    key={column.key}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    cellRef={(el) => {
                      if (!cellRefs.current[rowIndex])
                        cellRefs.current[rowIndex] = []
                      cellRefs.current[rowIndex][colIndex] = el
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
