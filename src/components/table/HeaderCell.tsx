import { memo, useCallback } from "react"
import { TableHead } from "@/components/ui/table"
import { useTableStableContext } from "./context/TableStableContext"
import type { ColumnDefinition } from "./types"
import { useShake } from "./hooks/useShake"
import { cn } from "@/lib/utils"

interface HeaderCellProps {
  column: ColumnDefinition
  colIndex: number
  isFocused: boolean
  isSorted: boolean
  sortDirection: "asc" | "desc"
  hasEditingCell: boolean
}

export const HeaderCell = memo(function HeaderCell({
  column,
  colIndex,
  isFocused,
  isSorted,
  sortDirection,
  hasEditingCell,
}: HeaderCellProps) {
  const { dispatch, registerCellRef } = useTableStableContext()
  const { isShaking, triggerShake, onAnimationEnd } = useShake()

  const cellRef = useCallback(
    (el: HTMLElement | null) => {
      registerCellRef(-1, colIndex, el)
    },
    [registerCellRef, colIndex],
  )

  const sortIndicator = isSorted ? (sortDirection === "asc" ? "⏶" : "⏷") : ""
  const isSortable = column.sortable !== false

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (hasEditingCell) {
        e.preventDefault()
      }
    },
    [hasEditingCell],
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
})
