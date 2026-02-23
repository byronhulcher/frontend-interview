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

  const column = columns[colIndex]
  const isFocused =
    focusedCell?.row === rowIndex && focusedCell?.col === colIndex
  const isEditing =
    editingCell?.row === rowIndex && editingCell?.col === colIndex

  return (
    <TableCell
      ref={cellRef}
      // Roving tabIndex: only the focused cell is in the tab order.
      // All others are reachable via arrow keys but not Tab traversal.
      tabIndex={isFocused ? 0 : -1}
      // Suppress browser's default focus outline — we render our own
      // via ring-inset so it stays within the cell border.
      className={cn(
        "cursor-default select-none focus-visible:outline-none",
        isFocused && !isEditing && "ring-2 ring-inset ring-blue-400",
        isEditing && "ring-2 ring-inset ring-orange-400"
      )}
      onClick={() => {
        const coord = { row: rowIndex, col: colIndex }
        const alreadyFocused =
          focusedCell?.row === rowIndex && focusedCell?.col === colIndex
        if (alreadyFocused && column.editable !== false) {
          dispatch({ type: "EDIT_CELL", coord })
        } else {
          dispatch({ type: "FOCUS_CELL", coord })
        }
      }}
    >
      <CellRenderer rowIndex={rowIndex} colIndex={colIndex} />
    </TableCell>
  )
}
