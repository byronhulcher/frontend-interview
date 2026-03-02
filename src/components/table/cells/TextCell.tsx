import { memo } from "react";
import type { CellProps } from "./types";
import { CellShell } from "./CellShell";
import { useEditableCell } from "./hooks/useEditableCell";

interface TextCellProps extends Partial<CellProps> {
  value: string;
  onChange?: (value: string) => void;
}

export const TextCell = memo(TextCellComponent);

function TextCellComponent({
  value,
  isSelected = false,
  isEditing = false,
  onSelect,
  onEdit,
  onExitEdit,
  onNavigate,
  onChange,
}: TextCellProps) {
  const { localValue, setLocalValue, inputRef, handleKeyDown, exitAndCommit } =
    useEditableCell({
      value,
      isEditing,
      onChange,
      onExitEdit,
      onNavigate,
    });

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
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={exitAndCommit}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 bg-transparent outline-none"
        />
      ) : (
        <div className="max-w-[200px] truncate" title={localValue}>
          {localValue}
        </div>
      )}
    </CellShell>
  );
}
