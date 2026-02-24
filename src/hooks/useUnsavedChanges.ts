import { useState, useEffect, useCallback } from "react"

export function useUnsavedChanges() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleDataChange = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  const handleSave = useCallback(() => {
    setHasUnsavedChanges(false)
  }, [])

  return { hasUnsavedChanges, handleDataChange, handleSave }
}
