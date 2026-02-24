import { useCallback } from "react"
import { TableCell } from "@/components/ui/table"
import { useTableContext } from "./TableContext"
import { CellRenderer } from "./CellRenderer"
import { useShake } from "./hooks/useShake"
import { cn } from "@/lib/utils"

interface TableCellWrapperProps {
  rowIndex: number
  colIndex: number
}

export function TableCellWrapper({
  rowIndex,
  colIndex,
}: TableCellWrapperProps) {
  const { state, dispatch, columns, registerCellRef } = useTableContext()
  const { focusedCell, editingCell } = state
  const { isShaking, triggerShake, onAnimationEnd } = useShake()
  const column = columns[colIndex]
  const isFocused =
    focusedCell?.row === rowIndex && focusedCell?.col === colIndex
  const isEditing =
    editingCell?.row === rowIndex && editingCell?.col === colIndex
  const isEditable = column.editable !== false

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && isFocused && !isEditing && !isEditable) {
        triggerShake()
      }
    },
    [isFocused, isEditing, isEditable, triggerShake],
  )

  const cellRef = useCallback(
    (el: HTMLElement | null) => {
      registerCellRef(rowIndex, colIndex, el)
    },
    [registerCellRef, rowIndex, colIndex],
  )

  const handleClick = useCallback(() => {
    const coord = { row: rowIndex, col: colIndex }
    if (isFocused && isEditable) {
      dispatch({ type: "EDIT_CELL", coord })
    } else if (isFocused && !isEditable) {
      triggerShake()
    } else {
      dispatch({ type: "FOCUS_CELL", coord })
    }
  }, [rowIndex, colIndex, isFocused, isEditable, dispatch, triggerShake])

  return (
    <TableCell
      ref={cellRef}
      tabIndex={isFocused ? 0 : -1}
      className={cn(
        "cursor-default select-none focus-visible:outline-none",
        isShaking && "animate-shake",
        isFocused && !isEditing && "ring-2 ring-inset ring-blue-400",
        isEditing && "ring-2 ring-inset ring-orange-400",
      )}
      onAnimationEnd={onAnimationEnd}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      <CellRenderer rowIndex={rowIndex} colIndex={colIndex} />
    </TableCell>
  )
}
