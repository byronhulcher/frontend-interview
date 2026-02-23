export type ColumnType = "text" | "number" | "boolean" | "popper"

export interface ColumnDefinition<T = unknown> {
  key: string
  header: string
  type: ColumnType
  format?: "currency" | "percentage" | "decimal"
  triggerText?: string
  accessor?: (row: T) => unknown
}

export interface TableData {
  [key: string]: unknown
}

export interface CellCoordinate {
  row: number
  col: number
}
