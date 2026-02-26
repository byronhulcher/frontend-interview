import { useContext, useState, useEffect, useCallback, useMemo } from "react"
import type { TableData } from "@/components/table/types"
import { ChangeTrackingContext } from "@/context/ChangeTrackingContext"

export function useChangeTrackerContext() {
  const context = useContext(ChangeTrackingContext)
  if (!context) {
    throw new Error(
      "useChangeTrackerContext must be used within ChangeTrackingProvider",
    )
  }
  return context
}

/**
 * Registers a table (root or nested) with the change-tracking context.
 *
 * Provide id="" for the root table, or a hierarchical path like "row-1/row-5" for nested.
 */
export function useRegisterTable(
  tableId: string,
  currentData: TableData[],
  savedData: TableData[],
) {
  const { registerTable } = useChangeTrackerContext()

  useEffect(() => {
    registerTable(tableId, currentData, savedData)
  }, [tableId, currentData, savedData, registerTable])
}

export function useChangeTracking(initialData: TableData[]) {
  const [currentData, setCurrentData] = useState<TableData[]>(initialData)
  const [savedData, setSavedData] = useState<TableData[]>(initialData)
  const tracker = useChangeTrackerContext()

  // Register the root table (id="") with the centralized tracking system
  useRegisterTable("", currentData, savedData)

  // Build an id → row map from savedData for O(1) lookups
  const dataMap = useMemo(() => {
    const map = new Map<unknown, TableData>()
    savedData.forEach((row) => map.set(row.id, row))
    return map
  }, [savedData])

  // Total unsaved changes comes directly from the centralized tracker
  // (includes root table + all nested tables)
  const unsavedChangesCount = tracker.totalChangesCount

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChangesCount > 0) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [unsavedChangesCount])

  const handleDataChange = useCallback((newData: TableData[]) => {
    setCurrentData(newData)
  }, [])

  const handleSave = useCallback(() => {
    // Update local savedData state to reflect what was saved
    setSavedData(structuredClone(currentData))
    // Clear dirty state from all tables in the tree (root + nested)
    tracker.clearAllDirtyState()
  }, [currentData, tracker])

  return {
    unsavedChangesCount,
    handleDataChange,
    handleSave,
    data: savedData,
    dataMap,
  }
}
