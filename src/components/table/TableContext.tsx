/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type Dispatch, type RefObject } from "react"
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
  | { type: "SORT_COLUMN"; columnKey: string; direction: "asc" | "desc" | null }

export interface TableContextValue {
  state: TableState
  dispatch: Dispatch<TableAction>
  columns: ColumnDefinition[]
  displayData: TableData[]
  internalIndexMap: Map<TableData, number>
  registerCellRef: (row: number, col: number, el: HTMLElement | null) => void
  cellRefs: RefObject<(HTMLElement | null)[][]>
}

const TableContext = createContext<TableContextValue | null>(null)

export function useTableContext(): TableContextValue {
  const ctx = useContext(TableContext)
  if (!ctx) {
    throw new Error(
      "useTableContext must be used inside a TableContext.Provider",
    )
  }
  return ctx
}

export { TableContext }
