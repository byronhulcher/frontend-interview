import { createContext, useContext, type Dispatch } from "react"
import type { CellCoordinate, ColumnDefinition, TableData } from "./types"

export interface TableState {
  focusedCell: CellCoordinate | null
  editingCell: CellCoordinate | null
  internalData: TableData[]
  sortColumn: string | null
  sortDirection: "asc" | "desc"
}

export type TableAction =
  | { type: "FOCUS_CELL"; coord: CellCoordinate }
  | { type: "EDIT_CELL"; coord: CellCoordinate }
  | { type: "CLEAR_FOCUS" }
  | { type: "CLEAR_EDIT" }
  | { type: "UPDATE_CELL"; row: number; columnKey: string; value: unknown }
  | { type: "DELETE_ROW"; row: number }
  | { type: "SORT_COLUMN"; columnKey: string }

export interface TableContextValue {
  state: TableState
  dispatch: Dispatch<TableAction>
  columns: ColumnDefinition[]
  displayData: TableData[]
}

const TableContext = createContext<TableContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useTableContext(): TableContextValue {
  const ctx = useContext(TableContext)
  if (!ctx) {
    throw new Error(
      "useTableContext must be used inside a TableContext.Provider"
    )
  }
  return ctx
}

export { TableContext }
