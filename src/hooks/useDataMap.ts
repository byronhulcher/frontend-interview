import { useMemo } from "react"
import type { TableData } from "@/components/table/types"

/**
 * Builds an id → row Map from an array of TableData for O(1) lookups.
 * Recomputes only when the input array reference changes.
 */
export function useDataMap(data: TableData[]) {
  return useMemo(() => {
    const map = new Map<unknown, TableData>()
    data.forEach((row) => map.set(row.id, row))
    return map
  }, [data])
}
