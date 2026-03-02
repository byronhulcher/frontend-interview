import { memo } from "react";
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
  return (
    <TableCell
      className={cn(
        "cursor-pointer",
        isSelected && !isEditing && "ring-2 ring-blue-400 relative z-10",
        isEditing && "ring-2 ring-orange-500 relative z-10 p-0",
      )}
      onClick={() => (isSelected ? onEdit?.() : onSelect?.())}
      data-selected={String(isSelected)}
      data-editing={String(isEditing)}
    >
      {children}
    </TableCell>
  );
}
