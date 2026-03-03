import type { ColumnDefinition, TableData } from "../types"

/** Compare two values with type-aware ordering. Nulls sort last. */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1

  if (typeof a === "number" && typeof b === "number") return a - b
  if (typeof a === "boolean" && typeof b === "boolean")
    return Number(a) - Number(b)

  return String(a).toLowerCase().localeCompare(String(b).toLowerCase())
}

export function sortData(
  data: TableData[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
  columns: ColumnDefinition[],
): TableData[] {
  const column = columns.find((col) => col.key === sortColumn)
  if (!column) return data

  const directionMultiplier = sortDirection === "asc" ? 1 : -1

  return [...data].sort((a, b) => {
    const aVal = column.accessor ? column.accessor(a) : a[sortColumn]
    const bVal = column.accessor ? column.accessor(b) : b[sortColumn]
    return compareValues(aVal, bVal) * directionMultiplier
  })
}
