import { useEffect, useRef } from "react"
import type { Dispatch } from "react"
import type { TableAction } from "../TableContext"
import type { CellCoordinate, TableData } from "../types"

/**
 * After a cell edit causes a re-sort, the focused row may move to a different
 * display index. This hook detects that and dispatches FOCUS_CELL to follow it.
 *
 * Tracks by row ID (stable across edits) rather than object identity, because
 * UPDATE_CELL creates a new row object via spread.
 */
export function useFocusTracking(
  focusedCell: CellCoordinate | null,
  displayData: TableData[],
  dispatch: Dispatch<TableAction>,
) {
  const trackedRowId = useRef<unknown>(null)
  const prevDisplayData = useRef(displayData)

  function followTrackedRow(
    cell: CellCoordinate | null,
    data: TableData[],
    dispatch: Dispatch<TableAction>,
  ) {
    if (!cell || cell.row < 0) return

    const newIndex = data.findIndex((r) => r.id === trackedRowId.current)
    if (newIndex >= 0 && newIndex !== cell.row) {
      dispatch({
        type: "FOCUS_CELL",
        coord: { row: newIndex, col: cell.col },
      })
    }
  }

  function updateTrackedRow(cell: CellCoordinate | null, data: TableData[]) {
    if (cell && cell.row >= 0 && data[cell.row]) {
      trackedRowId.current = data[cell.row].id
    } else {
      trackedRowId.current = null
    }
  }

  useEffect(() => {
    const dataChanged = prevDisplayData.current !== displayData
    prevDisplayData.current = displayData

    // If data changed and we're tracking a row, follow it to its new position
    if (dataChanged && trackedRowId.current != null) {
      followTrackedRow(focusedCell, displayData, dispatch)
    }

    // Sync the tracked row to whatever is currently focused
    updateTrackedRow(focusedCell, displayData)
  }, [focusedCell, displayData, dispatch])
}
