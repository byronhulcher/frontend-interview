import { useState, useEffect, useCallback, useMemo } from "react"
import type { TableData } from "@/components/table/types"

export function useUnsavedChanges(initialData: TableData[]) {
  const [currentData, setCurrentData] = useState<TableData[]>(initialData)
  const [savedData, setSavedData] = useState<TableData[]>(initialData)

  // Build an id → row map from savedData for O(1) lookups
  const dataMap = useMemo(() => {
    const map = new Map<unknown, TableData>()
    savedData.forEach((row) => map.set(row.id, row))
    return map
  }, [savedData])

  // Compute count of unsaved changes (changed field values)
  const changedFieldsCount = useMemo(() => {
    let count = 0
    currentData.forEach((row) => {
      const savedRow = dataMap.get(row.id)
      if (savedRow) {
        Object.keys(row).forEach((key) => {
          if (JSON.stringify(row[key]) !== JSON.stringify(savedRow[key])) {
            count++
          }
        })
      }
    })
    return count
  }, [currentData, dataMap])

  // Compute count of deleted rows
  const deletedRowsCount = useMemo(() => {
    return Math.max(0, savedData.length - currentData.length)
  }, [currentData.length, savedData.length])

  // Total unsaved changes includes both field changes and deleted rows
  const unsavedChangesCount = changedFieldsCount + deletedRowsCount

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
    // After save, update savedData to match current — clears dirty state
    setSavedData(structuredClone(currentData))
  }, [currentData])

  return {
    unsavedChangesCount,
    handleDataChange,
    handleSave,
    data: savedData,
    dataMap,
  }
}
