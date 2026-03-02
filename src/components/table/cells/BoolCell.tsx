import { cn } from "@/lib/utils";
import { memo } from "react";
import type { CellProps } from "./types";
import { CellShell } from "./CellShell";
import { useEditableCell } from "./hooks/useEditableCell";

interface BoolCellProps extends Partial<CellProps> {
  value: boolean;
  onChange?: (value: boolean) => void;
}

export const BoolCell = memo(BoolCellComponent);

function BoolCellComponent({
  value,
  isSelected = false,
  isEditing = false,
  onSelect,
  onEdit,
  onExitEdit,
  onNavigate,
  onChange,
}: BoolCellProps) {
  const {
    localValue,
    setLocalValue,
    inputRef: selectRef,
    handleKeyDown,
    exitAndCommit,
  } = useEditableCell<boolean, HTMLSelectElement>({
    value,
    isEditing,
    onChange,
    onExitEdit,
    onNavigate,
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value === "true";
    setLocalValue(newValue);
    onChange?.(newValue);
    onExitEdit?.();
  };

  return (
    <CellShell
      isSelected={isSelected}
      isEditing={isEditing}
      onSelect={onSelect}
      onEdit={onEdit}
    >
      {isEditing ? (
        <select
          ref={selectRef}
          value={String(localValue)}
          onChange={handleChange}
          onBlur={exitAndCommit}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 bg-transparent outline-none cursor-pointer"
        >
          <option value="true">✓ True</option>
          <option value="false">✗ False</option>
        </select>
      ) : (
        <div className="flex items-center justify-center">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
              localValue
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            )}
          >
            {localValue ? "✓ True" : "✗ False"}
          </span>
        </div>
      )}
    </CellShell>
  );
}
