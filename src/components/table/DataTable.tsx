import React, { useReducer, useRef } from "react"
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
import type { ColumnDefinition, TableData } from "./types"
import { TableContext, tableReducer } from "./TableContext"

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

  const {internalData} = state

  const cellRefs = useRef<(HTMLElement | null)[][]>([])

  const prevDataRef = useRef(data)
  if (prevDataRef.current !== internalData) {
    prevDataRef.current = internalData
    onDataChange?.(internalData)
  }

  const renderCell = (column: ColumnDefinition, row: TableData) => {
    const value = column.accessor
      ? column.accessor(row)
      : row[column.key]

    switch (column.type) {
      case "boolean":
        return <BoolTableCell value={value as boolean} />
      case "text":
        return <TextTableCell value={value as string} />
      case "number":
        return (
          <NumberTableCell
            value={value as number}
            format={column.format}
          />
        )
      case "popper":
        return (
          <PopperTableCell
            value={value as string}
            triggerText={column.triggerText}
          />
        )
      default:
        return <TableCell>{String(value)}</TableCell>
    }
  }

  return (
    <TableContext.Provider value={{ state, dispatch, cellRefs, columns }}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.type === 'number' ? 'text-right' : column.type === 'boolean' ? 'text-center' : ''}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {internalData.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <React.Fragment key={column.key}>
                  {renderCell(column, row)}
                </React.Fragment>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContext.Provider>
  )
}

