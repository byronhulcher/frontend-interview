import { useEditableCell } from "./hooks/useEditableCell"

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
}
