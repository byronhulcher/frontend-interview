import { memo, useMemo } from "react";
import type { CellProps } from "./types";
import { CellShell } from "./CellShell";
import { useEditableCell } from "./hooks/useEditableCell";

interface NumberTableCellProps extends Partial<CellProps> {
  value: number;
  format?: "currency" | "percentage" | "decimal";
  onChange?: (value: number) => void;
}

export const NumberTableCell = memo(NumberTableCellComponent);

function NumberTableCellComponent({
  value,
  format,
  isSelected = false,
  isEditing = false,
  onSelect,
  onEdit,
  onExitEdit,
  onNavigate,
  onChange,
}: NumberTableCellProps) {
  const { localValue, setLocalValue, inputRef, handleKeyDown, exitAndDiscard } =
    useEditableCell({
      value,
      isEditing,
      onChange,
      onExitEdit,
      onNavigate,
    });

  // Memoize the Intl.NumberFormat instance — construction parses locale data and
  // is surprisingly expensive to repeat on every render.
  const formatter = useMemo(() => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
      case "percentage":
      case "decimal":
        return null;
      default:
        return new Intl.NumberFormat();
    }
  }, [format]);

  const formatValue = (n: number) => {
    if (formatter) return formatter.format(n);
    if (format === "percentage") return `${n.toFixed(2)}%`;
    return n.toFixed(2);
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
          onBlur={exitAndDiscard}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 bg-transparent outline-none text-right font-mono"
        />
      ) : (
        <div className="text-right font-mono">{formatValue(localValue)}</div>
      )}
    </CellShell>
  );
}
