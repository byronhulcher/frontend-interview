import { useCallback, useMemo, useRef, useState } from "react";
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
import { createActiveCellStore } from "./hooks/ActiveCellStore";
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

  // Stable store instance — created once per DataTableContent mount.
  const store = useRef(createActiveCellStore()).current;

  const {
    wrapperRef,
    navigate,
    selectCell,
    editCell,
    exitEdit,
    handleSentinelFocus,
    handleFocus,
    handleKeyDown,
  } = useTableNavigation({ numRows, numCols, store });

  // Update local state + store on every cell edit. onCellChange is an optional
  // notification callback for parents that need to know about edits.
  // Reads activeCell from the store synchronously — no closure dependency.
  const handleCellChange = useCallback(
    (v: unknown) => {
      const activeCell = store.getSnapshot();
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
    [store, columns, onCellChange, basePath, storeSet],
  );

  // Memoize row rendering. All dependencies are now stable across navigation
  // events — activeCell is no longer in the dep array, and inline closures have
  // been replaced with stable callbacks + primitive row/col indices.
  const rows = useMemo(
    () =>
      data.map((row, rowIndex) => (
        <TableRow key={String(row.id ?? rowIndex)}>
          {columns.map((column, colIndex) => (
            <DataTableCell
              key={column.key}
              column={column}
              row={row}
              rowIndex={rowIndex}
              colIndex={colIndex}
              store={store}
              selectCell={selectCell}
              editCell={editCell}
              onExitEdit={exitEdit}
              onNavigate={navigate}
              onChange={handleCellChange}
              basePath={basePath}
            />
          ))}
        </TableRow>
      )),
    [
      data,
      columns,
      store,
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
    <>
      <span
        tabIndex={0}
        onFocus={handleSentinelFocus}
        aria-hidden="true"
        className="sr-only"
      />
      <div
        ref={wrapperRef}
        tabIndex={-1}
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
    </>
  );
}
