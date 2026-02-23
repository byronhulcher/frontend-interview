import { useLayoutEffect, useRef, useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface PopperTableCellProps {
  value: string
  triggerText?: string
  isEditing?: boolean
  onExitEdit?: () => void
}

export function PopperTableCell({
  value,
  triggerText = "View",
  isEditing = false,
  onExitEdit,
}: PopperTableCellProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Whenever we are in edit mode with the popover closed, ensure
  // the button has native focus so the user can press Enter to open it.
  useLayoutEffect(() => {
    if (isEditing && !open) {
      // focusVisible: true ensures :focus-visible styles apply even though
      // focus is being set programmatically.
      buttonRef.current?.focus({ focusVisible: true })
    }
  }, [isEditing, open])

  function handleButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter") {
      // Stop propagation so DataTable doesn't also handle Enter.
      // The browser will still fire a click on the button which Radix intercepts.
      e.stopPropagation()
    } else if (e.key === "Escape") {
      // Popover is closed and button is focused — exit edit mode entirely.
      e.preventDefault()
      e.stopPropagation()
      onExitEdit?.()
    } else if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
    ) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* tabIndex={-1}: the <td> is the tab stop (roving tabIndex).
            The button is focused programmatically when entering edit mode. */}
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
        onPointerDownOutside={() => {
          // User clicked outside the popover — exit edit mode entirely.
          // Radix will handle closing the popover via onOpenChange.
          onExitEdit?.()
        }}
        onKeyDown={(e) => {
          // Prevent navigation keys from reaching useTableKeyboard while
          // focus is trapped in the portal, and prevent browser scroll.
          if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(
              e.key
            )
          ) {
            e.preventDefault()
            e.stopPropagation()
          } else if (e.key === "Enter") {
            // Only stop propagation — don't preventDefault so Enter still
            // activates focused buttons (e.g. the Close button).
            e.stopPropagation()
          }
        }}
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
        </div>
      </PopoverContent>
    </Popover>
  )
}
