import { useReducer } from "react"

import type { TableData } from "../types"
import type { TableState, TableAction } from "../TableContext"

export function tableReducer(
  state: TableState,
  action: TableAction,
): TableState {
  switch (action.type) {
    case "FOCUS_CELL":
      return {
        ...state,
        focusedCell: action.coord,
        // Navigating away always exits editing
        editingCell: null,
      }
    case "EDIT_CELL":
      return {
        ...state,
        focusedCell: action.coord,
        editingCell: action.coord,
      }
    case "CLEAR_FOCUS":
      return {
        ...state,
        focusedCell: null,
        editingCell: null,
      }
    case "CLEAR_EDIT":
      return {
        ...state,
        editingCell: null,
      }
    case "UPDATE_CELL": {
      const newData = state.internalData.map((row, i) =>
        i === action.row ? { ...row, [action.columnKey]: action.value } : row,
      )
      return { ...state, internalData: newData }
    }
    case "DELETE_ROW": {
      const newData = state.internalData.filter((_, i) => i !== action.row)
      // focusedCell.row is a display index — clamp to new display length
      const clampedRow =
        newData.length === 0
          ? null
          : state.focusedCell
            ? Math.min(state.focusedCell.row, newData.length - 1)
            : null
      const focusedCell =
        clampedRow !== null && state.focusedCell
          ? { row: clampedRow, col: state.focusedCell.col }
          : null
      return {
        ...state,
        internalData: newData,
        focusedCell,
        editingCell: null,
      }
    }
    case "SORT_COLUMN": {
      if (action.direction === null) {
        return { ...state, sortColumn: null, sortDirection: "asc" }
      }
      return {
        ...state,
        sortColumn: action.columnKey,
        sortDirection: action.direction,
      }
    }
    default:
      return state
  }
}

export const useTableReducer = (data: TableData[]) =>
  useReducer(tableReducer, {
    focusedCell: null,
    editingCell: null,
    internalData: data,
    sortColumn: null,
    sortDirection: "asc",
  })
