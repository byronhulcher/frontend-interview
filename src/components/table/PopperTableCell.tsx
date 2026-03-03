import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ARROW_KEYS } from "./consts"
import type { EditableCellProps, TableData } from "./types"
import { DataTable } from "./DataTable"
import { columns, generateData } from "@/data/generateData"
import {
  useRegisterTable,
  useChangeTrackerContext,
} from "@/hooks/useChangeTracking"
import {
  NestingPathProvider,
  useNestingPath,
} from "@/context/ChangeTrackingContext"
import { useFocusWithin } from "@/hooks/useFocusWithin"

interface PopperTableCellProps extends Omit<
  EditableCellProps<string>,
  "onCellChange"
> {
  rowId: string
  triggerText?: string
  label?: string
  onDeleteRow: () => void
}

export const PopperTableCell = memo(function PopperTableCell({
  triggerText = "View",
  rowId,
  label,
  isEditing = false,
  onExitEdit,
  onDeleteRow,
}: PopperTableCellProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const innerTableRef = useRef<HTMLDivElement>(null)

  // Build a deterministic key from the nesting path + this row's ID.
  const parentPath = useNestingPath()
  const tableId = parentPath ? `${parentPath}/${rowId}` : rowId
  const { getSnapshot } = useChangeTrackerContext()

  // Restore from context if previously registered
  const snapshot = getSnapshot(tableId)

  // Generate data exactly once (when the component first mounts).
  // After that, the snapshot's savedData is the authoritative baseline.
  const [generatedData] = useState<TableData[]>(
    () => snapshot?.savedData ?? generateData(5),
  )

  // The effective baseline: prefer the snapshot (updated after save) over
  // the initially generated data. This avoids needing a setState-in-effect.
  const baselineData = snapshot?.savedData ?? generatedData

  const [innerData, setInnerData] = useState<TableData[]>(() =>
    structuredClone(snapshot?.currentData ?? baselineData),
  )

  const innerDataMap = useMemo(
    () => new Map(baselineData.map((row) => [row.id, row])),
    [baselineData],
  )

  // Register table so the change-tracking context can compute dirty counts.
  useRegisterTable(tableId, innerData, baselineData)

  useLayoutEffect(() => {
    if (isEditing && !open) {
      buttonRef.current?.focus({ focusVisible: true } as FocusOptions & {
        focusVisible: boolean
      })
    }
  }, [isEditing, open, rowId])

  const closePopper = useCallback(() => {
    setOpen(false)
    onExitEdit()
  }, [onExitEdit])

  const { Wrapper, ref: focusRef } = useFocusWithin({
    onClose: () => {
      if (open) closePopper()
    },
  })

  function handleButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter") {
      e.stopPropagation()
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      onExitEdit()
    } else if (ARROW_KEYS.includes(e.key) || e.key === "Tab") {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  function handleOpenAutoFocus(e: Event) {
    // Redirect initial focus from the Close button to the DataTable container.
    e.preventDefault()
    innerTableRef.current?.querySelector<HTMLElement>("[tabindex='0']")?.focus()
  }

  function handlePopoverKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Tab" || e.key === "Enter") {
      // Stop Tab/Enter from bubbling up to the outer table's keyboard handler.
      // React Portal events bubble through the React tree (not the DOM tree),
      // so without this the outer DataTable would receive and process them.
      e.stopPropagation()
    } else if (e.key === "Escape") {
      e.preventDefault()
      // Move focus to the trigger button (inside the outer table container)
      // before closing so useTableFocus's focusIsRelevant check passes.
      buttonRef.current?.focus()
      closePopper()
    }
  }

  return (
    <Wrapper>
    <div ref={focusRef}>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          size="sm"
          tabIndex={-1}
          className={isEditing ? undefined : "pointer-events-none"}
          onKeyDown={handleButtonKeyDown}
        >
          {triggerText}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(90vw,1000px)] max-h-[80vh] overflow-y-auto p-0"
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={onExitEdit}
        onFocusOutside={onExitEdit}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onKeyDown={handlePopoverKeyDown}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-medium leading-none">
            {label ? `Details for ${label}` : "Details"}
          </h4>
          <Button variant="ghost" size="sm" onClick={() => {
            buttonRef.current?.focus()
            closePopper()
          }}>
            Close
          </Button>
        </div>
        <div ref={innerTableRef} className="rounded-b-md overflow-hidden">
          {innerData.length > 0 ? (
            <NestingPathProvider segment={rowId}>
              <DataTable
                tableId={tableId}
                columns={columns}
                data={innerData}
                dataMap={innerDataMap}
                onDataChange={setInnerData}
              />
            </NestingPathProvider>
          ) : (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          )}
        </div>
        <div className="px-4 py-3 border-t">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              if (window.confirm("Are you sure?")) {
                closePopper()
                setTimeout(() => onDeleteRow(), 0)
              }
            }}
          >
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
    </div>
    </Wrapper>
  )
})
