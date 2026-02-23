import { useLayoutEffect, useRef } from "react"

interface UseEditableCellOptions<T> {
  isEditing: boolean
  onCellChange?: (value: T) => void
  onExitEdit?: () => void
  parseValue: (raw: string) => T | null
}

export function useEditableCell<T>({
  isEditing,
  onCellChange,
  onExitEdit,
  parseValue,
}: UseEditableCellOptions<T>) {
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  useLayoutEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if ("select" in inputRef.current) {
        inputRef.current.select()
      }
    }
  }, [isEditing])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
    ) {
      e.stopPropagation()
    }

    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      commitValue()
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      onExitEdit?.()
    }
  }

  function commitValue() {
    const raw = inputRef.current?.value ?? ""
    const parsed = parseValue(raw)
    if (parsed !== null) {
      onCellChange?.(parsed)
    }
    onExitEdit?.()
  }

  function handleBlur() {
    onExitEdit?.()
  }

  return { inputRef, handleKeyDown, handleBlur }
}
