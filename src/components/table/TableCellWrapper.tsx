import { memo, useCallback } from "react"
import { TableCell } from "@/components/ui/table"
import { useTableStableContext } from "./context/TableStableContext"
import { CellRenderer } from "./CellRenderer"
import { useShake } from "./hooks/useShake"
import { cn } from "@/lib/utils"
import type { ColumnDefinition, TableData } from "./types"
import { useFocusWithin } from "@/hooks/useFocusWithin"

interface TableCellWrapperProps {
  rowIndex: number
  colIndex: number
  column: ColumnDefinition
  row: TableData
  internalRowIndex: number
  isFocused: boolean
  isEditing: boolean
}

export const TableCellWrapper = memo(function TableCellWrapper({
  rowIndex,
  colIndex,
  column,
  row,
  internalRowIndex,
  isFocused,
  isEditing,
}: TableCellWrapperProps) {
  const { tableId, dispatch, registerCellRef, dataMap } = useTableStableContext()
  const { isShaking, triggerShake, onAnimationEnd } = useShake()
  const isEditable = column.editable !== false

  // Compute isDirty by comparing current value to original value (O(1) Map lookup)
  const originalRow = dataMap.get(row.id)
  let isDirty = false
  if (originalRow) {
    const currentValue = column.accessor
      ? column.accessor(row)
      : row[column.key]
    const originalValue = column.accessor
      ? column.accessor(originalRow)
      : originalRow[column.key]
    isDirty = currentValue !== originalValue
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && isFocused && !isEditing && !isEditable) {
        triggerShake()
      }
    },
    [isFocused, isEditing, isEditable, triggerShake],
  )

  const { isFocusedWithin, ref: focusRef, Wrapper } = useFocusWithin()

  const cellRef = useCallback(
    (el: HTMLElement | null) => {
      registerCellRef(rowIndex, colIndex, el)
      focusRef(el)
    },
    [registerCellRef, rowIndex, colIndex, focusRef],
  )

  const handleFocus = useCallback((e: React.FocusEvent) => {
    if (e.target !== e.currentTarget) return
    if (!isFocused) {
      console.log(`[TableCellWrapper:${tableId}] FOCUS_CELL dispatch`, { rowIndex, colIndex, activeElement: document.activeElement })
      dispatch({ type: "FOCUS_CELL", coord: { row: rowIndex, col: colIndex } })
    }
  }, [isFocused, dispatch, rowIndex, colIndex])

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
    <Wrapper>
      <TableCell
        ref={cellRef}
        tabIndex={isFocused ? 0 : -1}
        className={cn(
          "cursor-default select-none focus-visible:outline-none",
          isShaking && "animate-shake",
          isDirty && !isEditing && "bg-yellow-50 dark:bg-yellow-950/20",
          isFocusedWithin && !isEditing && "ring-2 ring-inset ring-blue-400",
          isEditing && "ring-2 ring-inset ring-orange-400",
        )}
        onAnimationEnd={onAnimationEnd}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      >
        <CellRenderer
          column={column}
          row={row}
          internalRowIndex={internalRowIndex}
          isEditing={isEditing}
        />
      </TableCell>
    </Wrapper>
  )
})
