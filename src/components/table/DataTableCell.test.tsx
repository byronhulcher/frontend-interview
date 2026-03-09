import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { DataTableCell } from "./DataTableCell";
import { BoolTableCell } from "./BoolTableCell";
import { createActiveCellStore } from "./hooks/ActiveCellStore";
import type { ActiveCellStore } from "./hooks/ActiveCellStore";
import type { ColumnDefinition, TableData } from "./types";

// ---------------------------------------------------------------------------
// Mock child cells so we test dispatch logic in isolation, not implementations
// ---------------------------------------------------------------------------

vi.mock("./BoolTableCell", () => ({
  BoolTableCell: vi.fn(
    ({
      value,
      isSelected,
      isEditing,
    }: {
      value: boolean;
      isSelected: boolean;
      isEditing: boolean;
    }) => (
      <td
        data-testid="bool-cell"
        data-value={String(value)}
        data-selected={String(isSelected)}
        data-editing={String(isEditing)}
      />
    ),
  ),
}));

vi.mock("./TextTableCell", () => ({
  TextTableCell: vi.fn(
    ({
      value,
      isSelected,
      isEditing,
    }: {
      value: string;
      isSelected: boolean;
      isEditing: boolean;
    }) => (
      <td
        data-testid="text-cell"
        data-value={value}
        data-selected={String(isSelected)}
        data-editing={String(isEditing)}
      />
    ),
  ),
}));

vi.mock("./NumberTableCell", () => ({
  NumberTableCell: vi.fn(
    ({
      value,
      format,
      isSelected,
      isEditing,
    }: {
      value: number;
      format?: string;
      isSelected: boolean;
      isEditing: boolean;
    }) => (
      <td
        data-testid="number-cell"
        data-value={String(value)}
        data-format={format ?? ""}
        data-selected={String(isSelected)}
        data-editing={String(isEditing)}
      />
    ),
  ),
}));

vi.mock("./PopperTableCell", () => ({
  PopperTableCell: vi.fn(
    ({
      cellPath,
      triggerText,
      isSelected,
      isEditing,
    }: {
      cellPath: string;
      triggerText?: string;
      isSelected: boolean;
      isEditing: boolean;
    }) => (
      <td
        data-testid="popper-cell"
        data-cell-path={cellPath}
        data-trigger={triggerText ?? ""}
        data-selected={String(isSelected)}
        data-editing={String(isEditing)}
      />
    ),
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const row: TableData = { id: "r1", name: "Alice", active: true, score: 42 };

function renderCell(
  column: ColumnDefinition,
  {
    store: storeOverride,
    rowOverride = row,
    rowIndex = 0,
    colIndex = 0,
    basePath = "",
  }: {
    store?: ActiveCellStore;
    rowOverride?: TableData;
    rowIndex?: number;
    colIndex?: number;
    basePath?: string;
  } = {},
) {
  const store = storeOverride ?? createActiveCellStore();
  const onChange = vi.fn();
  const selectCell = vi.fn();
  const editCell = vi.fn();
  const onExitEdit = vi.fn();
  const onNavigate = vi.fn();
  render(
    <table>
      <tbody>
        <tr>
          <DataTableCell
            column={column}
            row={rowOverride}
            rowIndex={rowIndex}
            colIndex={colIndex}
            store={store}
            selectCell={selectCell}
            editCell={editCell}
            onExitEdit={onExitEdit}
            onNavigate={onNavigate}
            onChange={onChange}
            basePath={basePath}
          />
        </tr>
      </tbody>
    </table>,
  );
  return { onChange, selectCell, editCell, store };
}

// ---------------------------------------------------------------------------
// Dispatch — correct cell type rendered
// ---------------------------------------------------------------------------

describe("DataTableCell dispatch", () => {
  it("renders BoolTableCell for a boolean column", () => {
    renderCell({ key: "active", header: "Active", type: "boolean" });
    expect(screen.getByTestId("bool-cell")).toBeInTheDocument();
  });

  it("renders TextTableCell for a text column", () => {
    renderCell({ key: "name", header: "Name", type: "text" });
    expect(screen.getByTestId("text-cell")).toBeInTheDocument();
  });

  it("renders NumberTableCell for a number column", () => {
    renderCell({ key: "score", header: "Score", type: "number" });
    expect(screen.getByTestId("number-cell")).toBeInTheDocument();
  });

  it("renders PopperTableCell for a popper column", () => {
    renderCell({ key: "more", header: "More", type: "popper" });
    expect(screen.getByTestId("popper-cell")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Value extraction
// ---------------------------------------------------------------------------

describe("DataTableCell value extraction", () => {
  it("reads value from row[column.key] by default", () => {
    renderCell({ key: "name", header: "Name", type: "text" });
    expect(screen.getByTestId("text-cell").dataset.value).toBe("Alice");
  });

  it("reads value via column.accessor when provided", () => {
    const column: ColumnDefinition = {
      key: "name",
      header: "Name",
      type: "text",
      accessor: (r) => `${r.name} (computed)`,
    };
    renderCell(column);
    expect(screen.getByTestId("text-cell").dataset.value).toBe(
      "Alice (computed)",
    );
  });

  it("passes boolean value to BoolTableCell", () => {
    renderCell({ key: "active", header: "Active", type: "boolean" });
    expect(screen.getByTestId("bool-cell").dataset.value).toBe("true");
  });

  it("passes number value to NumberTableCell", () => {
    renderCell({ key: "score", header: "Score", type: "number" });
    expect(screen.getByTestId("number-cell").dataset.value).toBe("42");
  });

  it("passes format to NumberTableCell", () => {
    renderCell({
      key: "score",
      header: "Score",
      type: "number",
      format: "currency",
    });
    expect(screen.getByTestId("number-cell").dataset.format).toBe("currency");
  });
});

// ---------------------------------------------------------------------------
// Cell state derivation from store
// ---------------------------------------------------------------------------

describe("DataTableCell cellProps from store", () => {
  it("derives isSelected=true when store matches this cell", () => {
    const store = createActiveCellStore();
    store.setActiveCell({ row: 0, col: 0, mode: "selected" });
    renderCell(
      { key: "name", header: "Name", type: "text" },
      { store, rowIndex: 0, colIndex: 0 },
    );
    expect(screen.getByTestId("text-cell").dataset.selected).toBe("true");
  });

  it("derives isSelected=false when store does not match this cell", () => {
    const store = createActiveCellStore();
    store.setActiveCell({ row: 1, col: 1, mode: "selected" });
    renderCell(
      { key: "name", header: "Name", type: "text" },
      { store, rowIndex: 0, colIndex: 0 },
    );
    expect(screen.getByTestId("text-cell").dataset.selected).toBe("false");
  });

  it("derives isEditing=true when store has editing mode for this cell", () => {
    const store = createActiveCellStore();
    store.setActiveCell({ row: 0, col: 0, mode: "editing" });
    renderCell(
      { key: "name", header: "Name", type: "text" },
      { store, rowIndex: 0, colIndex: 0 },
    );
    expect(screen.getByTestId("text-cell").dataset.editing).toBe("true");
  });

  it("passes onChange through to the rendered cell", () => {
    const { onChange } = renderCell({
      key: "active",
      header: "Active",
      type: "boolean",
    });
    const lastCall = vi.mocked(BoolTableCell).mock.calls.at(-1)![0];
    if (lastCall.onChange) {
      lastCall.onChange(false);
    }
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

// ---------------------------------------------------------------------------
// Popper: cellPath computation
// ---------------------------------------------------------------------------

describe("DataTableCell popper cellPath", () => {
  it("builds cellPath as '{rowId}:{key}' when basePath is empty", () => {
    renderCell(
      { key: "more", header: "More", type: "popper" },
      { rowOverride: { id: "r1" }, rowIndex: 0, basePath: "" },
    );
    expect(screen.getByTestId("popper-cell").dataset.cellPath).toBe("r1:more");
  });

  it("builds cellPath as '{basePath}/{rowId}:{key}' when basePath is provided", () => {
    renderCell(
      { key: "more", header: "More", type: "popper" },
      { rowOverride: { id: "r1" }, rowIndex: 0, basePath: "root/nested" },
    );
    expect(screen.getByTestId("popper-cell").dataset.cellPath).toBe(
      "root/nested/r1:more",
    );
  });

  it("uses rowIndex as rowId when row.id is absent", () => {
    renderCell(
      { key: "more", header: "More", type: "popper" },
      { rowOverride: { name: "No ID" }, rowIndex: 7, basePath: "" },
    );
    expect(screen.getByTestId("popper-cell").dataset.cellPath).toBe("7:more");
  });

  it("passes triggerText to PopperTableCell", () => {
    renderCell({
      key: "more",
      header: "More",
      type: "popper",
      triggerText: "Details",
    });
    expect(screen.getByTestId("popper-cell").dataset.trigger).toBe("Details");
  });

  it("passes empty triggerText when column.triggerText is undefined", () => {
    renderCell({ key: "more", header: "More", type: "popper" });
    expect(screen.getByTestId("popper-cell").dataset.trigger).toBe("");
  });
});
