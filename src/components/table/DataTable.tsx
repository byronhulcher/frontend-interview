import { useCallback, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTableNavigation } from "./hooks/useTableNavigation";
import {
  FocusCoordinatorProvider,
  useFocusCoordinator,
} from "./hooks/FocusCoordinator";
import { useNestedDataStore } from "../../data/nestedDataStore/useNestedDataStore";
import type { ColumnDefinition, TableData } from "./types";
import { DataTableCell } from "./DataTableCell";

interface DataTableProps {
  columns: ColumnDefinition[];
  data?: TableData[];
  basePath?: string;
  onCellChange?: (rowIndex: number, key: string, value: unknown) => void;
}

/**
 * Thin wrapper that ensures a FocusCoordinatorProvider exists.
 * The root DataTable creates the provider; nested DataTables (inside
 * popover portals) reuse the parent's coordinator via React context.
 */
export function DataTable(props: DataTableProps) {
  const coordinator = useFocusCoordinator();
  if (coordinator) {
    // Already inside a provider (nested DataTable) — render directly.
    return <DataTableContent {...props} />;
  }
  // Root DataTable — provide the coordinator for the whole tree.
  return (
    <FocusCoordinatorProvider>
      <DataTableContent {...props} />
    </FocusCoordinatorProvider>
  );
}

function DataTableContent({
  columns,
  data: seedData = [],
  basePath = "",
  onCellChange,
}: DataTableProps) {
  const { getData: storeGet, setData: storeSet } = useNestedDataStore();

  // Initialise from the store if data already exists (e.g. nested table that
  // was previously open), otherwise fall back to the seed prop and persist it.
  const [data, setData] = useState<TableData[]>(() => {
    const stored = storeGet(basePath);
    if (stored) return stored;
    if (seedData.length > 0) storeSet(basePath, seedData);
    return seedData;
  });

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

  // Update local state + store on every cell edit. onCellChange is an optional
  // notification callback for parents that need to know about edits.
  const handleCellChange = useCallback(
    (v: unknown) => {
      if (!activeCell) return;
      const { row, col } = activeCell;
      const key = columns[col].key;
      setData((prev) => {
        const updated = prev.map((r, i) =>
          i === row ? { ...r, [key]: v } : r,
        );
        storeSet(basePath, updated);
        return updated;
      });
      onCellChange?.(row, key, v);
    },
    [activeCell, columns, onCellChange, basePath, storeSet],
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
    [
      data,
      columns,
      activeCell,
      selectCell,
      editCell,
      exitEdit,
      navigate,
      handleCellChange,
      basePath,
    ],
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
