import {
  createContext,
  useContext,
  type Dispatch,
  type RefObject,
} from "react";
import type { CellCoordinate, ColumnDefinition, TableData } from "./types";

export interface TableState {
  focusedCell: CellCoordinate | null;
  editingCell: CellCoordinate | null;
  internalData: TableData[];
}

export type TableAction =
  | { type: "FOCUS_CELL"; coord: CellCoordinate }
  | { type: "EDIT_CELL"; coord: CellCoordinate }
  | { type: "CLEAR_FOCUS" }
  | { type: "CLEAR_EDIT" }
  | { type: "UPDATE_CELL"; row: number; columnKey: string; value: unknown };

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
      };
    case "EDIT_CELL":
      return {
        ...state,
        focusedCell: action.coord,
        editingCell: action.coord,
      };
    case "CLEAR_FOCUS":
      return {
        ...state,
        focusedCell: null,
        editingCell: null,
      };
    case "CLEAR_EDIT":
      return {
        ...state,
        editingCell: null,
      };
    case "UPDATE_CELL": {
      const newData = state.internalData.map((row, i) =>
        i === action.row ? { ...row, [action.columnKey]: action.value } : row,
      );
      return { ...state, internalData: newData };
    }
    default:
      return state;
  }
}

export interface TableContextValue {
  state: TableState;
  dispatch: Dispatch<TableAction>;
  cellRefs: RefObject<(HTMLElement | null)[][]>;
  columns: ColumnDefinition[];
}

const TableContext = createContext<TableContextValue | null>(null);

export function useTableContext(): TableContextValue {
  const ctx = useContext(TableContext);
  if (!ctx) {
    throw new Error(
      "useTableContext must be used inside a TableContext.Provider",
    );
  }
  return ctx;
}

export { TableContext };
