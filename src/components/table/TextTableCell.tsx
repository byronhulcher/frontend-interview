import { useLayoutEffect, useRef } from "react"

interface TextTableCellProps {
  value: string
  isEditing?: boolean
  onCellChange?: (value: string) => void
  onExitEdit?: () => void
}

export function TextTableCell({
  value,
  isEditing = false,
  onCellChange,
  onExitEdit,
}: TextTableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus the input when entering edit mode
  useLayoutEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      // Select all text for convenience
      inputRef.current?.select()
    }
  }, [isEditing])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Stop propagation for navigation keys so DataTable doesn't navigate
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
    ) {
      e.stopPropagation()
    }

    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      // Save changes and exit editing
      onCellChange?.(inputRef.current?.value ?? value)
      onExitEdit?.()
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      // Discard changes and exit editing
      onExitEdit?.()
    }
  }

  function handleBlur() {
    // When focus leaves the input, discard changes and exit editing
    onExitEdit?.()
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full px-2 py-1 border border-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      />
    )
  }

  return (
    <div className="max-w-[200px] truncate" title={value}>
      {value}
    </div>
  )
}
