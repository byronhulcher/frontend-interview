import { memo } from "react"
import { useEditableCell } from "./hooks/useEditableCell"

interface BoolTableCellProps {
  value: boolean
  isEditing?: boolean
  onCellChange: (value: boolean) => void
  onExitEdit: () => void
}

export const BoolTableCell = memo(function BoolTableCell({
  value,
  isEditing = false,
  onCellChange,
  onExitEdit,
}: BoolTableCellProps) {
  const { inputRef, handleKeyDown, handleBlur } = useEditableCell<boolean>({
    isEditing,
    onCellChange,
    onExitEdit,
    parseValue: (raw) =>
      raw === "true" ? true : raw === "false" ? false : null,
  })

  if (isEditing) {
    return (
      <div className="flex items-center justify-center">
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          defaultValue={String(value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="px-2 py-1 border border-current rounded focus-visible:outline-none"
        >
          <option value="true">✓ True</option>
          <option value="false">✗ False</option>
        </select>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
          value
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {value ? "✓ True" : "✗ False"}
      </span>
    </div>
  )
})
