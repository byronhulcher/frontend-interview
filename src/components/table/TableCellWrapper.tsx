import { useCallback, useState } from "react"
import { TableCell } from "@/components/ui/table"
import { useTableContext } from "./TableContext"
import { CellRenderer } from "./CellRenderer"
import { cn } from "@/lib/utils"

interface TableCellWrapperProps {
  rowIndex: number
  colIndex: number
  cellRef: React.RefCallback<HTMLElement>
}

export function TableCellWrapper({
  rowIndex,
  colIndex,
  cellRef,
}: TableCellWrapperProps) {
  const { state, dispatch, columns } = useTableContext()
  const { focusedCell, editingCell } = state
  const [isShaking, setIsShaking] = useState(false)

  const column = columns[colIndex]
  const isFocused =
    focusedCell?.row === rowIndex && focusedCell?.col === colIndex
  const isEditing =
    editingCell?.row === rowIndex && editingCell?.col === colIndex

  const triggerShake = useCallback(() => {
    setIsShaking(false)
    // Force a re-render with the class removed first, then re-add it
    // so the animation replays even on repeated attempts.
    requestAnimationFrame(() => setIsShaking(true))
  }, [])

  return (
    <TableCell
      ref={cellRef}
      tabIndex={isFocused ? 0 : -1}
      className={cn(
        "cursor-default select-none focus-visible:outline-none",
        isShaking && "animate-shake",
        isFocused && !isEditing && "ring-2 ring-inset ring-blue-400",
        isEditing && "ring-2 ring-inset ring-orange-400"
      )}
      onAnimationEnd={() => setIsShaking(false)}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          isFocused &&
          !isEditing &&
          column.editable === false
        ) {
          triggerShake()
        }
      }}
      onClick={() => {
        const coord = { row: rowIndex, col: colIndex }
        const alreadyFocused =
          focusedCell?.row === rowIndex && focusedCell?.col === colIndex
        if (alreadyFocused && column.editable !== false) {
          dispatch({ type: "EDIT_CELL", coord })
        } else if (alreadyFocused && column.editable === false) {
          triggerShake()
        } else {
          dispatch({ type: "FOCUS_CELL", coord })
        }
      }}
    >
      <CellRenderer rowIndex={rowIndex} colIndex={colIndex} />
    </TableCell>
  )
}
