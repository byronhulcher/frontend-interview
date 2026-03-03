import { useEffect, useRef, useState, memo } from "react";
import { TableCell } from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CellProps } from "./types";
import type { ColumnDefinition, TableData } from "../types";
import { useCellKeyboard } from "./hooks/useCellKeyboard";
import { DataTable } from "../DataTable";
import { useNestedDataStore } from "../../../data/nestedDataStore/useNestedDataStore";
import { companies } from "@/data/generateData";

// Columns for every nested DataTable — fixed schema that supports arbitrary depth.
const nestedColumns: ColumnDefinition[] = [
  { key: "company", header: "Company", type: "text" },
  { key: "revenue", header: "Revenue", type: "number", format: "currency" },
  { key: "more", header: "More", type: "popper", triggerText: "More" },
];

function generateData(): TableData[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `row-${i + 1}`,
    company: companies[Math.floor(Math.random() * companies.length)],
    revenue: Math.floor(Math.random() * 99 + 1) * 1_000_000,
  }));
}

interface PopperCellProps extends Partial<CellProps> {
  triggerText?: string;
  cellPath?: string;
}

export const PopperCell = memo(PopperCellComponent);

function PopperCellComponent({
  triggerText = "View",
  isSelected = false,
  isEditing = false,
  onSelect,
  onEdit,
  onExitEdit,
  onNavigate,
  cellPath,
}: PopperCellProps) {
  const [open, setOpen] = useState(false);
  const [nestedData, setNestedData] = useState<TableData[] | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { handleKeyDown } = useCellKeyboard({ onExitEdit, onNavigate });
  const { getData, setData } = useNestedDataStore();

  // Move focus to the trigger button when entering editing mode so the user
  // can press Enter/Space to open the popover without a second click.
  useEffect(() => {
    if (isEditing && !open) {
      // preventScroll stops Chrome from scrolling the button into view
      buttonRef.current?.focus({ preventScroll: true });
    }
  }, [isEditing, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && nestedData === null) {
      // Lazy init — simulates an async AJAX call made on first open.
      const stored = cellPath ? getData(cellPath) : null;
      const rows = stored ?? generateData();
      if (!stored && cellPath) setData(cellPath, rows);
      setNestedData(rows);
    }
    setOpen(nextOpen);
    // Closing the popover for any reason (Escape, outside click, programmatic
    // focus loss) returns the cell to selected mode.
    if (!nextOpen) {
      onExitEdit?.();
    }
  };

  const handleNestedCellChange = (
    rowIndex: number,
    key: string,
    val: unknown,
  ) => {
    setNestedData((prev) => {
      if (!prev) return prev;
      const updated = prev.map((row, i) =>
        i === rowIndex ? { ...row, [key]: val } : row,
      );
      if (cellPath) setData(cellPath, updated);
      return updated;
    });
  };

  return (
    <TableCell
      className={cn(
        "relative",
        // Show editing ring whenever the button is active OR popover is open.
        isSelected &&
          !isEditing &&
          !open &&
          "ring-2 ring-inset ring-blue-400 z-10",
        (isEditing || open) && "ring-2 ring-inset ring-orange-500 z-10",
      )}
      // Capture phase: intercept clicks before they reach the button so the
      // first click selects the cell and the second enters editing mode.
      onClickCapture={(e) => {
        if (!isEditing) {
          e.stopPropagation();
          e.preventDefault();
          if (isSelected) {
            onEdit?.();
          } else {
            onSelect?.();
          }
        }
      }}
    >
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            size="sm"
            // Remove from the natural tab order until the cell is in editing
            // mode so Tab navigates between cells, not into buttons.
            tabIndex={isEditing ? 0 : -1}
            onKeyDown={handleKeyDown}
          >
            {triggerText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0">
          {nestedData === null ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <DataTable
              columns={nestedColumns}
              data={nestedData}
              basePath={cellPath}
              onCellChange={handleNestedCellChange}
            />
          )}
        </PopoverContent>
      </Popover>
    </TableCell>
  );
}
