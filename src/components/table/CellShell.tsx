import { memo, useRef } from "react";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface CellShellProps {
  isSelected: boolean;
  isEditing: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  children: React.ReactNode;
}

export const CellShell = memo(CellShellComponent);

function CellShellComponent({
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  children,
}: CellShellProps) {
  // Track whether the cell was already selected when the pointer went down.
  // Between pointerdown and click, the onFocus handler may select this cell,
  // causing React to re-render with isSelected=true before onClick fires.
  // Without this guard, clicking an unselected cell would jump straight to edit mode.
  const wasSelectedOnPointerDown = useRef(false);
  // Prevents onSelect from firing twice (once in onFocus, once in onClick).
  const focusHandledRef = useRef(false);

  return (
    <TableCell
      tabIndex={-1}
      className={cn(
        "cursor-pointer relative",
        isSelected && !isEditing && "ring-2 ring-inset ring-blue-400 z-10",
        isEditing && "ring-2 ring-inset ring-orange-500 z-10 p-0",
      )}
      onPointerDown={() => {
        wasSelectedOnPointerDown.current = isSelected;
        focusHandledRef.current = false;
      }}
      onClick={() => {
        if (wasSelectedOnPointerDown.current) {
          onEdit?.();
        } else if (!focusHandledRef.current) {
          // Fallback: when clicking a new cell while another is editing,
          // exitEdit's wrapper.focus() steals focus before this cell's
          // onFocus fires. The click still lands here, so handle selection.
          onSelect?.();
        }
      }}
      onFocus={(e) => {
        if (e.target === e.currentTarget && !isSelected) {
          focusHandledRef.current = true;
          onSelect?.();
        }
      }}
      data-selected={String(isSelected)}
      data-editing={String(isEditing)}
    >
      {children}
    </TableCell>
  );
}
