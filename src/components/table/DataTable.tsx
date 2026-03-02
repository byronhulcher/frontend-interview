import { useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTableNavigation } from "./hooks/useTableNavigation";
import type { ColumnDefinition, TableData } from "./types";
import { DataTableCell } from "./cells/DataTableCell";

interface DataTableProps {
  columns: ColumnDefinition[];
  data: TableData[];
  basePath?: string;
  onCellChange?: (rowIndex: number, key: string, value: unknown) => void;
}

export function DataTable({
  columns,
  data,
  basePath = "",
  onCellChange,
}: DataTableProps) {
  const numRows = data.length;
  const numCols = columns.length;

  const {
    activeCell,
    wrapperRef,
    navigate,
    selectCell,
    editCell,
    exitEdit,
    handleFocus,
    handleKeyDown,
  } = useTableNavigation({ numRows, numCols });

  // Shared by all cells in this DataTable. Reads activeCell at call-time so it
  // always reports the currently active row/col, regardless of which cell's
  // render captured it last (avoids stale-closure row-index issues in tests).
  const handleCellChange = useCallback(
    (v: unknown) => {
      if (activeCell) {
        onCellChange?.(activeCell.row, columns[activeCell.col].key, v);
      }
    },
    [activeCell, columns, onCellChange],
  );

  // Memoize row rendering to avoid re-rendering unchanged rows
  const rows = useMemo(
    () =>
      data.map((row, rowIndex) => (
        <TableRow key={String(row.id ?? rowIndex)}>
          {columns.map((column, colIndex) => {
            const isSelected =
              activeCell?.row === rowIndex && activeCell?.col === colIndex;
            const isEditing = isSelected
              ? activeCell?.mode === "editing"
              : false;
            return (
              <DataTableCell
                key={column.key}
                column={column}
                row={row}
                rowIndex={rowIndex}
                isSelected={isSelected ?? false}
                isEditing={isEditing ?? false}
                onSelect={() => selectCell(rowIndex, colIndex)}
                onEdit={() => editCell(rowIndex, colIndex)}
                onExitEdit={exitEdit}
                onNavigate={navigate}
                onChange={handleCellChange}
                basePath={basePath}
              />
            );
          })}
        </TableRow>
      )),
    [data, columns, activeCell, selectCell, editCell, exitEdit, navigate, handleCellChange, basePath]
  );

  // tabIndex={0} lets the wrapper receive focus so keyboard events are captured.
  // outline-none removes the browser's default focus ring (cells show their own rings).
  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      className="outline-none"
    >
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{rows}</TableBody>
      </Table>
    </div>
  );
}
