/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type Dispatch, type RefObject } from "react"
import type { TableData } from "../types"
import type { TableAction } from "./TableReactiveContext"

// Stable context — values with a stable identity that never change after mount:
//   - dispatch: stable from useReducer
//   - registerCellRef: stable ([] deps useCallback)
//   - cellRefs: stable ref object
//   - dataMap: stable reference passed from the parent
//
// Subscribing to this context will never trigger a re-render, making it safe
// to read from memoized per-cell components without defeating memo.
export interface TableStableContextValue {
  dispatch: Dispatch<TableAction>
  registerCellRef: (row: number, col: number, el: HTMLElement | null) => void
  cellRefs: RefObject<(HTMLElement | null)[][]>
  dataMap: Map<unknown, TableData>
}

const TableStableContext = createContext<TableStableContextValue | null>(null)

export function useTableStableContext(): TableStableContextValue {
  const ctx = useContext(TableStableContext)
  if (!ctx) {
    throw new Error(
      "useTableStableContext must be used inside a TableStableContext.Provider",
    )
  }
  return ctx
}

export { TableStableContext }
