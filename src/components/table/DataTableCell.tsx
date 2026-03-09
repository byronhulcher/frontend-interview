import { memo, useCallback } from "react";
import { BoolTableCell } from "./BoolTableCell";
import { TextTableCell } from "./TextTableCell";
import { NumberTableCell } from "./NumberTableCell";
import { PopperTableCell } from "./PopperTableCell";
import { useCellState } from "./hooks/ActiveCellStore";
import type { ActiveCellStore } from "./hooks/ActiveCellStore";
import type { ColumnDefinition, TableData } from "./types";
import type { NavigationDirection } from "./hooks/types";

interface DataTableCellProps {
  column: ColumnDefinition;
  row: TableData;
  rowIndex: number;
  colIndex: number;
  store: ActiveCellStore;
  selectCell: (row: number, col: number) => void;
  editCell: (row: number, col: number) => void;
  onExitEdit: () => void;
  onNavigate: (direction: NavigationDirection) => void;
  onChange: (value: unknown) => void;
  basePath?: string;
}

export const DataTableCell = memo(DataTableCellComponent);

function DataTableCellComponent({
  column,
  row,
  rowIndex,
  colIndex,
  store,
  selectCell,
  editCell: editCellFn,
  onExitEdit,
  onNavigate,
  onChange,
  basePath = "",
}: DataTableCellProps) {
  // Subscribe to the store — only re-renders when THIS cell's state changes.
  const { isSelected, isEditing } = useCellState(store, rowIndex, colIndex);

  // Stable callbacks: selectCell/editCellFn are stable, rowIndex/colIndex are primitives.
  const onSelect = useCallback(
    () => selectCell(rowIndex, colIndex),
    [selectCell, rowIndex, colIndex],
  );
  const onEdit = useCallback(
    () => editCellFn(rowIndex, colIndex),
    [editCellFn, rowIndex, colIndex],
  );

  const value = column.accessor ? column.accessor(row) : row[column.key];

  const cellProps = { isSelected, isEditing, onSelect, onEdit, onExitEdit, onNavigate };

  switch (column.type) {
    case "boolean":
      return (
        <BoolTableCell {...cellProps} value={value as boolean} onChange={onChange} />
      );
    case "text":
      return (
        <TextTableCell {...cellProps} value={value as string} onChange={onChange} />
      );
    case "number":
      return (
        <NumberTableCell
          {...cellProps}
          value={value as number}
          format={column.format}
          onChange={onChange}
        />
      );
    case "popper": {
      const rowId = String(row.id ?? rowIndex);
      const cellPath = basePath
        ? `${basePath}/${rowId}:${column.key}`
        : `${rowId}:${column.key}`;
      return (
        <PopperTableCell
          {...cellProps}
          triggerText={column.triggerText}
          cellPath={cellPath}
        />
      );
    }
  }
}
