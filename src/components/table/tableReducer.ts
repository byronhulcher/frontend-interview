import type { TableAction, TableState } from "./TableContext"

export function tableReducer(
  state: TableState,
  action: TableAction
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
        i === action.row ? { ...row, [action.columnKey]: action.value } : row
      )
      return { ...state, internalData: newData }
    }
    default:
      return state
  }
}
