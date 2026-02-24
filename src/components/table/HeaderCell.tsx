import { type Dispatch } from "react"
import { TableHead } from "@/components/ui/table"
import type { TableAction } from "./TableContext"
import type { ColumnDefinition } from "./types"
import { cn } from "@/lib/utils"

interface HeaderCellProps {
  column: ColumnDefinition
  isFocused: boolean
  isSorted: boolean
  sortDirection: "asc" | "desc"
  dispatch: Dispatch<TableAction>
  cellRef: React.RefCallback<HTMLElement>
}

export function HeaderCell({
  column,
  isFocused,
  isSorted,
  sortDirection,
  dispatch,
  cellRef,
}: HeaderCellProps) {
  const sortIndicator = isSorted ? (sortDirection === "asc" ? "⏶" : "⏷") : ""

  function cycleSort() {
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
  }

  return (
    <TableHead
      ref={cellRef}
      tabIndex={isFocused ? 0 : -1}
      className={cn(
        "cursor-pointer select-none focus-visible:outline-none",
        isFocused && "ring-2 ring-inset ring-blue-400",
        column.type === "number" && "text-right",
        column.type === "boolean" && "text-center",
      )}
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
