import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CellProps } from "./types";
import { CellShell } from "./CellShell";
import { useCellKeyboard } from "./hooks/useCellKeyboard";

interface BoolTableCellProps extends Partial<CellProps> {
  value: boolean;
  onChange?: (value: boolean) => void;
}

export function BoolTableCell({
  value,
  isSelected = false,
  isEditing = false,
  onSelect,
  onEdit,
  onExitEdit,
  onNavigate,
  onChange,
}: BoolTableCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const selectRef = useRef<HTMLSelectElement>(null);
  const { handleKeyDown } = useCellKeyboard({ onExitEdit, onNavigate });

  useEffect(() => {
    if (isEditing) {
      selectRef.current?.focus();
    }
  }, [isEditing]);

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
          onBlur={() => onExitEdit?.()}
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
