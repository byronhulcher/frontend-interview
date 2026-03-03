import { memo } from "react"
import { useEditableCell } from "./hooks/useEditableCell"
import type { EditableCellProps } from "./types"

export const TextTableCell = memo(function TextTableCell({
  value,
  isEditing = false,
  onCellChange,
  onExitEdit,
}: EditableCellProps<string>) {
  const { inputRef, handleKeyDown, handleBlur } = useEditableCell<string>({
    isEditing,
    onCellChange,
    onExitEdit,
    parseValue: (raw) => raw,
  })

  if (isEditing) {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        size={1}
        defaultValue={value}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full min-w-0 px-2 py-1 border border-current focus-visible:outline-none"
      />
    )
  }

  return (
    <div className="max-w-[200px] truncate" title={value}>
      {value}
    </div>
  )
})
