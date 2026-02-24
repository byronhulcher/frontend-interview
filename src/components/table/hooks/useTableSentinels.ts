import { useCallback, useRef } from "react"
import type { TableAction } from "../TableContext"

interface UseTableSentinelsOptions {
  displayDataLength: number
  numColumns: number
  cellRefs: React.RefObject<(HTMLElement | null)[][]>
  dispatch: React.Dispatch<TableAction>
}

/**
 * Manages focus sentinels placed before and after the table container.
 *
 * - Before sentinel: when focused from outside, enters the table at the first
 *   header cell (row -1, col 0).
 * - After sentinel: when focused from outside, enters the table at the last
 *   data cell.
 *
 * Creates and returns refs for the container, sentinels, and sentinel focus tracking.
 */
export function useTableSentinels({
  displayDataLength,
  numColumns,
  cellRefs,
  dispatch,
}: UseTableSentinelsOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const beforeSentinelRef = useRef<HTMLSpanElement>(null)
  const afterSentinelRef = useRef<HTMLSpanElement>(null)
  const sentinelFocusing = useRef(false)

  const isFromInside = (e: React.FocusEvent) => {
    const relatedTarget = e.nativeEvent.relatedTarget as Node | null
    return relatedTarget && containerRef.current?.contains(relatedTarget)
  }

  const handleBeforeSentinelFocus = useCallback(
    (e: React.FocusEvent<HTMLSpanElement>) => {
      if (isFromInside(e)) return

      sentinelFocusing.current = true
      dispatch({ type: "FOCUS_CELL", coord: { row: -1, col: 0 } })
      const firstCell = cellRefs.current[-1]?.[0]
      if (firstCell) {
        firstCell.focus({ preventScroll: true })
      }
      requestAnimationFrame(() => {
        sentinelFocusing.current = false
      })
    },
    [dispatch, cellRefs],
  )

  const handleAfterSentinelFocus = useCallback(
    (e: React.FocusEvent<HTMLSpanElement>) => {
      if (isFromInside(e)) return

      sentinelFocusing.current = true
      if (displayDataLength > 0) {
        dispatch({
          type: "FOCUS_CELL",
          coord: { row: displayDataLength - 1, col: numColumns - 1 },
        })
        const lastCell =
          cellRefs.current[displayDataLength - 1]?.[numColumns - 1]
        if (lastCell) {
          lastCell.focus({ preventScroll: true })
        }
      }
      requestAnimationFrame(() => {
        sentinelFocusing.current = false
      })
    },
    [displayDataLength, numColumns, cellRefs, dispatch],
  )

  return {
    containerRef,
    beforeSentinelRef,
    afterSentinelRef,
    sentinelFocusing,
    handleBeforeSentinelFocus,
    handleAfterSentinelFocus,
  }
}
