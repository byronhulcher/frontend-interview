import { useCallback } from "react"
import { TableHead } from "@/components/ui/table"
import { useTableContext } from "./TableContext"
import type { ColumnDefinition } from "./types"
import { useShake } from "./hooks/useShake"
import { cn } from "@/lib/utils"

interface HeaderCellProps {
  column: ColumnDefinition
  isFocused: boolean
  isSorted: boolean
  sortDirection: "asc" | "desc"
}

export function HeaderCell({
  column,
  isFocused,
  isSorted,
  sortDirection,
}: HeaderCellProps) {
  const { state, dispatch, columns, registerCellRef } = useTableContext()
  const { isShaking, triggerShake, onAnimationEnd } = useShake()
  const colIndex = columns.findIndex((c) => c.key === column.key)

  const cellRef = useCallback(
    (el: HTMLElement | null) => {
      registerCellRef(-1, colIndex, el)
    },
    [registerCellRef, colIndex],
  )

  const sortIndicator = isSorted ? (sortDirection === "asc" ? "⏶" : "⏷") : ""
  const isSortable = column.sortable !== false

  // Prevent mousedown from stealing focus away from the editing input.
  // This keeps the cell in edit mode so onClick can check and confirm.
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (state.editingCell) {
        e.preventDefault()
      }
    },
    [state.editingCell],
  )

  const cycleSort = useCallback(() => {
    if (!isSortable) {
      triggerShake()
      return
    }

    if (!isSorted) {
      dispatch({ type: "SORT_COLUMN", columnKey: column.key, direction: "asc" })
    } else if (sortDirection === "asc") {
      dispatch({
        type: "SORT_COLUMN",
        columnKey: column.key,
        direction: "desc",
      })
    } else {
      dispatch({ type: "SORT_COLUMN", columnKey: column.key, direction: null })
    }

    dispatch({ type: "FOCUS_CELL", coord: { row: -1, col: colIndex } })
  }, [
    isSortable,
    isSorted,
    column.key,
    sortDirection,
    dispatch,
    colIndex,
    triggerShake,
  ])

  return (
    <TableHead
      ref={cellRef}
      tabIndex={isFocused ? 0 : -1}
      className={cn(
        "cursor-pointer select-none focus-visible:outline-none",
        isFocused && "ring-2 ring-inset ring-blue-400",
        column.type === "number" && "text-right",
        column.type === "boolean" && "text-center",
        isShaking && "animate-shake",
      )}
      onAnimationEnd={onAnimationEnd}
      onMouseDown={handleMouseDown}
      onClick={cycleSort}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          e.stopPropagation()
          cycleSort()
        }
      }}
    >
      {column.header} {sortIndicator}
    </TableHead>
  )
}
