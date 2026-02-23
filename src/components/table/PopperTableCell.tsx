import { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface PopperTableCellProps {
  value: string
  triggerText?: string
}

export function PopperTableCell({
  value,
  triggerText = "View",
}: PopperTableCellProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* tabIndex={-1}: the <td> is the tab stop (roving tabIndex).
            The button is only focused programmatically via Enter in stage 5. */}
        <Button variant="outline" size="sm" tabIndex={-1}>
          {triggerText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Details</h4>
          <p className="text-sm text-muted-foreground break-words">{value}</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
