import { useEditableCell } from "./hooks/useEditableCell"

interface NumberTableCellProps {
  value: number
  format?: "currency" | "percentage" | "decimal"
  isEditing?: boolean
  onCellChange: (value: number) => void
  onExitEdit: () => void
}

export function NumberTableCell({
  value,
  format,
  isEditing = false,
  onCellChange,
  onExitEdit,
}: NumberTableCellProps) {
  const { inputRef, handleKeyDown, handleBlur } = useEditableCell<number>({
    isEditing,
    onCellChange,
    onExitEdit,
    parseValue: (raw) => {
      const parsed = parseFloat(raw)
      return isNaN(parsed) ? null : parsed
    },
  })

  const formatValue = () => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value)
      case "percentage":
        return `${value.toFixed(2)}%`
      case "decimal":
        return value.toFixed(2)
      default:
        return value.toLocaleString()
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="number"
        size={1}
        defaultValue={value}
        step="any"
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full min-w-0 px-2 py-1 text-right font-mono border border-current focus-visible:outline-none"
      />
    )
  }

  return <div className="text-right font-mono">{formatValue()}</div>
}
