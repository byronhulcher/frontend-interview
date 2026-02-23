import { createContext, useContext, type Dispatch, type RefObject } from "react"
import type { CellCoordinate, ColumnDefinition, TableData } from "./types"

export interface TableState {
  focusedCell: CellCoordinate | null
  editingCell: CellCoordinate | null
  internalData: TableData[]
}

export type TableAction =
  | { type: "FOCUS_CELL"; coord: CellCoordinate }
  | { type: "EDIT_CELL"; coord: CellCoordinate }
  | { type: "CLEAR_FOCUS" }
  | { type: "CLEAR_EDIT" }
  | { type: "UPDATE_CELL"; row: number; columnKey: string; value: unknown }

export interface TableContextValue {
  state: TableState
  dispatch: Dispatch<TableAction>
  cellRefs: RefObject<(HTMLElement | null)[][]>
  columns: ColumnDefinition[]
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
