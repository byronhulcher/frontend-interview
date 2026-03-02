import { memo } from "react";
import type { CellProps } from "./types";
import { CellShell } from "./CellShell";
import { useEditableCell } from "./hooks/useEditableCell";

interface NumberCellProps extends Partial<CellProps> {
  value: number;
  format?: "currency" | "percentage" | "decimal";
  onChange?: (value: number) => void;
}

export const NumberCell = memo(NumberCellComponent);

function NumberCellComponent({
  value,
  format,
  isSelected = false,
  isEditing = false,
  onSelect,
  onEdit,
  onExitEdit,
  onNavigate,
  onChange,
}: NumberCellProps) {
  const { localValue, setLocalValue, inputRef, handleKeyDown, exitAndCommit } =
    useEditableCell({
      value,
      isEditing,
      onChange,
      onExitEdit,
      onNavigate,
    });

  const formatValue = (n: number) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(n);
      case "percentage":
        return `${n.toFixed(2)}%`;
      case "decimal":
        return n.toFixed(2);
      default:
        return n.toLocaleString();
    }
  };

  return (
    <CellShell
      isSelected={isSelected}
      isEditing={isEditing}
      onSelect={onSelect}
      onEdit={onEdit}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(Number(e.target.value))}
          onBlur={exitAndCommit}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 bg-transparent outline-none text-right font-mono"
        />
      ) : (
        <div className="text-right font-mono">{formatValue(localValue)}</div>
      )}
    </CellShell>
  );
}
