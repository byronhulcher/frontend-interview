import type { ColumnDefinition, TableData } from "../types"

export function sortData(
  data: TableData[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
  columns: ColumnDefinition[]
): TableData[] {
  const column = columns.find((col) => col.key === sortColumn)
  if (!column) return data

  const sorted = [...data].sort((a, b) => {
    // Use accessor if provided, otherwise use direct key access
    const aVal = column.accessor ? column.accessor(a) : a[sortColumn]
    const bVal = column.accessor ? column.accessor(b) : b[sortColumn]

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1

    // Numeric comparison
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal
    }

    // Boolean comparison (false < true)
    if (typeof aVal === "boolean" && typeof bVal === "boolean") {
      const aNum = aVal ? 1 : 0
      const bNum = bVal ? 1 : 0
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum
    }

    // String comparison (case-insensitive)
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    const comparison = aStr.localeCompare(bStr)
    return sortDirection === "asc" ? comparison : -comparison
  })

  return sorted
}
