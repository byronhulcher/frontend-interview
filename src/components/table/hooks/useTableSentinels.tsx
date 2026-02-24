import { useCallback, useRef, type RefObject } from "react"
import { useTableContext } from "../TableContext"
import { SentinelSpan } from "../SentinelSpan"

interface UseTableSentinelsOptions {
  containerRef: RefObject<HTMLDivElement | null>
}

/**
 * Focus sentinels placed before/after the table.
 * Routes incoming tab focus to the first or last cell.
 */
export function useTableSentinels({ containerRef }: UseTableSentinelsOptions) {
  const { dispatch, columns, displayData, cellRefs } = useTableContext()

  const beforeSentinelRef = useRef<HTMLSpanElement>(null)
  const afterSentinelRef = useRef<HTMLSpanElement>(null)
  const sentinelFocusing = useRef(false)

  const handleBeforeSentinelFocus = useCallback(
    (e: React.FocusEvent<HTMLSpanElement>) => {
      const relatedTarget = e.nativeEvent.relatedTarget as Node | null
      if (relatedTarget && containerRef.current?.contains(relatedTarget)) return

      sentinelFocusing.current = true
      dispatch({ type: "FOCUS_CELL", coord: { row: -1, col: 0 } })
      const firstCell = cellRefs.current[-1]?.[0]
      if (firstCell) firstCell.focus({ preventScroll: true })
      requestAnimationFrame(() => {
        sentinelFocusing.current = false
      })
    },
    [dispatch, cellRefs, sentinelFocusing, containerRef],
  )

  const handleAfterSentinelFocus = useCallback(
    (e: React.FocusEvent<HTMLSpanElement>) => {
      const relatedTarget = e.nativeEvent.relatedTarget as Node | null
      if (relatedTarget && containerRef.current?.contains(relatedTarget)) return

      const numColumns = columns.length
      const displayDataLength = displayData.length

      sentinelFocusing.current = true
      if (displayDataLength > 0) {
        dispatch({
          type: "FOCUS_CELL",
          coord: { row: displayDataLength - 1, col: numColumns - 1 },
        })
        const lastCell =
          cellRefs.current[displayDataLength - 1]?.[numColumns - 1]
        if (lastCell) lastCell.focus({ preventScroll: true })
      }
      requestAnimationFrame(() => {
        sentinelFocusing.current = false
      })
    },
    [columns, displayData, dispatch, cellRefs, sentinelFocusing, containerRef],
  )

  const beforeSentinel = (
    <SentinelSpan ref={beforeSentinelRef} onFocus={handleBeforeSentinelFocus} />
  )
  const afterSentinel = (
    <SentinelSpan ref={afterSentinelRef} onFocus={handleAfterSentinelFocus} />
  )

  return {
    beforeSentinel,
    afterSentinel,
    beforeSentinelRef,
    afterSentinelRef,
    sentinelFocusing,
  }
}
