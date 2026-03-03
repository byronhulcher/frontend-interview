import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { DataTableCell } from "./DataTableCell";
import { BoolTableCell } from "./BoolTableCell";
import type { CellProps, ColumnDefinition, TableData } from "./types";

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

const defaultCellProps: CellProps = {
  isSelected: false,
  isEditing: false,
  onSelect: vi.fn(),
  onEdit: vi.fn(),
  onExitEdit: vi.fn(),
  onNavigate: vi.fn(),
};

const row: TableData = { id: "r1", name: "Alice", active: true, score: 42 };

function renderCell(
  column: ColumnDefinition,
  overrides: Partial<CellProps> = {},
  rowOverride: TableData = row,
  rowIndex = 0,
  basePath = "",
) {
  const onChange = vi.fn();
  render(
    <table>
      <tbody>
        <tr>
          <DataTableCell
            {...defaultCellProps}
            {...overrides}
            column={column}
            row={rowOverride}
            rowIndex={rowIndex}
            onChange={onChange}
            basePath={basePath}
          />
        </tr>
      </tbody>
    </table>,
  );
  return { onChange };
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
// CellProps forwarding
// ---------------------------------------------------------------------------

describe("DataTableCell cellProps forwarding", () => {
  it("forwards isSelected=true", () => {
    renderCell(
      { key: "name", header: "Name", type: "text" },
      { isSelected: true },
    );
    expect(screen.getByTestId("text-cell").dataset.selected).toBe("true");
  });

  it("forwards isSelected=false", () => {
    renderCell(
      { key: "name", header: "Name", type: "text" },
      { isSelected: false },
    );
    expect(screen.getByTestId("text-cell").dataset.selected).toBe("false");
  });

  it("forwards isEditing=true", () => {
    renderCell(
      { key: "name", header: "Name", type: "text" },
      { isSelected: true, isEditing: true },
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
      {},
      { id: "r1" },
      0,
      "",
    );
    expect(screen.getByTestId("popper-cell").dataset.cellPath).toBe("r1:more");
  });

  it("builds cellPath as '{basePath}/{rowId}:{key}' when basePath is provided", () => {
    renderCell(
      { key: "more", header: "More", type: "popper" },
      {},
      { id: "r1" },
      0,
      "root/nested",
    );
    expect(screen.getByTestId("popper-cell").dataset.cellPath).toBe(
      "root/nested/r1:more",
    );
  });

  it("uses rowIndex as rowId when row.id is absent", () => {
    renderCell(
      { key: "more", header: "More", type: "popper" },
      {},
      { name: "No ID" },
      7,
      "",
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
