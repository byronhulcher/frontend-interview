/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react"
import type { ColumnDefinition, TableData } from "../types"
import type { CellCoordinate } from "../types"

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
  | { type: "SORT_COLUMN"; columnKey: string; direction: "asc" | "desc" | null }

// Reactive context — changes on any user action (focus, edit, sort, data mutation).
// Only subscribe to this when you need to react to those changes.
export interface TableReactiveContextValue {
  state: TableState
  columns: ColumnDefinition[]
  displayData: TableData[]
  internalIndexMap: Map<TableData, number>
}

const TableReactiveContext = createContext<TableReactiveContextValue | null>(
  null,
)

export function useTableReactiveContext(): TableReactiveContextValue {
  const ctx = useContext(TableReactiveContext)
  if (!ctx) {
    throw new Error(
      "useTableReactiveContext must be used inside a TableReactiveContext.Provider",
    )
  }
  return ctx
}

export { TableReactiveContext }
