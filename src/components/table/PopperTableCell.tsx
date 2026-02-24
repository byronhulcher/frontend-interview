import { useLayoutEffect, useRef, useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { NAV_KEYS } from "./consts"

interface PopperTableCellProps {
  value: string
  triggerText?: string
  isEditing?: boolean
  onExitEdit: () => void
  onDeleteRow: () => void
}

export function PopperTableCell({
  value,
  triggerText = "View",
  isEditing = false,
  onExitEdit,
  onDeleteRow,
}: PopperTableCellProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    if (isEditing && !open) {
      // focusVisible: true ensures :focus-visible styles apply even though
      // focus is being set programmatically.
      buttonRef.current?.focus({ focusVisible: true } as FocusOptions & {
        focusVisible: boolean
      })
    }
  }, [isEditing, open])

  function handleButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter") {
      e.stopPropagation()
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      onExitEdit()
    } else if (NAV_KEYS.includes(e.key) || e.key === "Tab") {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  function handlePopoverKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (NAV_KEYS.includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()
    } else if (e.key === "Tab" || e.key === "Enter") {
      e.stopPropagation()
    } else if (e.key === "Escape") {
      // Let Escape propagate to useTableKeyboard so edit mode is exited.
      // Radix will close the popover regardless.
      e.preventDefault()
    }
  }

  function handleDeleteClick() {
    if (window.confirm("Are you sure?")) {
      setOpen(false)
      onExitEdit()
      setTimeout(() => {
        onDeleteRow()
      }, 0)
    }
  }

  return (
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
        className="w-80"
        onPointerDownOutside={() => onExitEdit()}
        onKeyDown={handlePopoverKeyDown}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Details</h4>
            <Button
              variant="ghost"
              size="sm"
              autoFocus
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
          <p className="text-sm text-muted-foreground break-words">{value}</p>
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={handleDeleteClick}
          >
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
