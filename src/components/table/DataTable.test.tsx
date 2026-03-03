import { render, act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { DataTable } from "./DataTable";
import type { ColumnDefinition } from "./types";
import type { CellProps } from "./types";

// Capture callbacks from the last render of TextTableCell so tests can
// simulate a cell calling back into DataTable.
const captured: {
  onExitEdit?: () => void;
  onChange?: (value: unknown) => void;
} = {};

type MockCellProps = CellProps & Record<string, unknown>;

// Mock cell components to expose navigation props as data attributes.
// Each renders a plain <td> that calls the relevant CellProps callbacks on
// click / double-click, making it easy to drive state from tests.
vi.mock("./TextTableCell", () => ({
  TextTableCell: (props: MockCellProps) => {
    captured.onExitEdit = props.onExitEdit as () => void;
    captured.onChange = props.onChange as (value: unknown) => void;
    return (
      <td
        data-testid="text-cell"
        data-selected={String(props.isSelected ?? false)}
        data-editing={String(props.isEditing ?? false)}
        onClick={props.onSelect}
        onDoubleClick={props.onEdit}
      />
    );
  },
}));

vi.mock("./NumberTableCell", () => ({
  NumberTableCell: (props: MockCellProps) => (
    <td
      data-testid="number-cell"
      data-selected={String(props.isSelected ?? false)}
      data-editing={String(props.isEditing ?? false)}
      onClick={props.onSelect}
      onDoubleClick={props.onEdit}
    />
  ),
}));

vi.mock("./BoolTableCell", () => ({
  BoolTableCell: (props: MockCellProps) => (
    <td
      data-testid="bool-cell"
      data-selected={String(props.isSelected ?? false)}
      data-editing={String(props.isEditing ?? false)}
      onClick={props.onSelect}
      onDoubleClick={props.onEdit}
    />
  ),
}));

vi.mock("./PopperTableCell", () => ({
  PopperTableCell: (props: MockCellProps) => (
    <td
      data-testid="popper-cell"
      data-selected={String(props.isSelected ?? false)}
      data-editing={String(props.isEditing ?? false)}
      onClick={props.onSelect}
      onDoubleClick={props.onEdit}
    />
  ),
}));

// 2 rows × 2 cols: text at col 0, bool at col 1
// Cell order in DOM: [text(0,0), bool(0,1), text(1,0), bool(1,1)]
const columns: ColumnDefinition[] = [
  { key: "name", header: "Name", type: "text" },
  { key: "active", header: "Active", type: "boolean" },
];

const data = [
  { name: "Alice", active: true },
  { name: "Bob", active: false },
];

function setup() {
  const user = userEvent.setup();
  const result = render(<DataTable columns={columns} data={data} />);
  const getCells = () => result.getAllByRole("cell");
  return { user, getCells, ...result };
}

describe("DataTable", () => {
  describe("initial state", () => {
    it("no cell is selected initially", () => {
      const { getCells } = setup();
      for (const cell of getCells()) {
        expect(cell).toHaveAttribute("data-selected", "false");
        expect(cell).toHaveAttribute("data-editing", "false");
      }
    });

    it("renders with empty data without errors", () => {
      render(<DataTable columns={columns} data={[]} />);
      expect(screen.queryAllByRole("cell")).toHaveLength(0);
    });

    it("renders with no data prop without errors", () => {
      render(<DataTable columns={columns} />);
      expect(screen.queryAllByRole("cell")).toHaveLength(0);
    });
  });

  describe("cell selection", () => {
    it("clicking a cell selects it", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[0]);
      expect(cells[0]).toHaveAttribute("data-selected", "true");
      expect(cells[0]).toHaveAttribute("data-editing", "false");
    });

    it("only one cell is selected at a time", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[0]);
      await user.click(cells[1]);
      expect(cells[0]).toHaveAttribute("data-selected", "false");
      expect(cells[1]).toHaveAttribute("data-selected", "true");
    });

    it("double-clicking a cell enters editing mode", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.dblClick(cells[0]);
      expect(cells[0]).toHaveAttribute("data-editing", "true");
    });
  });

  describe("keyboard navigation (selected mode)", () => {
    it("ArrowDown moves selection down one row", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[0]); // (0,0)
      await user.keyboard("{ArrowDown}");
      expect(cells[0]).toHaveAttribute("data-selected", "false");
      expect(cells[2]).toHaveAttribute("data-selected", "true"); // (1,0)
    });

    it("ArrowUp moves selection up one row", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[2]); // (1,0)
      await user.keyboard("{ArrowUp}");
      expect(cells[2]).toHaveAttribute("data-selected", "false");
      expect(cells[0]).toHaveAttribute("data-selected", "true"); // (0,0)
    });

    it("ArrowRight moves selection right one column", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[0]); // (0,0)
      await user.keyboard("{ArrowRight}");
      expect(cells[0]).toHaveAttribute("data-selected", "false");
      expect(cells[1]).toHaveAttribute("data-selected", "true"); // (0,1)
    });

    it("ArrowLeft moves selection left one column", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[1]); // (0,1)
      await user.keyboard("{ArrowLeft}");
      expect(cells[1]).toHaveAttribute("data-selected", "false");
      expect(cells[0]).toHaveAttribute("data-selected", "true"); // (0,0)
    });

    it("ArrowUp does not move past the first row", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[0]); // (0,0)
      await user.keyboard("{ArrowUp}");
      expect(cells[0]).toHaveAttribute("data-selected", "true");
    });

    it("ArrowDown does not move past the last row", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[2]); // (1,0) — last row
      await user.keyboard("{ArrowDown}");
      expect(cells[2]).toHaveAttribute("data-selected", "true");
    });

    it("ArrowLeft does not move past the first column", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[0]); // (0,0)
      await user.keyboard("{ArrowLeft}");
      expect(cells[0]).toHaveAttribute("data-selected", "true");
    });

    it("ArrowRight does not move past the last column", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[1]); // (0,1) — last col
      await user.keyboard("{ArrowRight}");
      expect(cells[1]).toHaveAttribute("data-selected", "true");
    });

    it("Tab moves to the next cell", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[0]); // (0,0)
      await user.keyboard("{Tab}");
      expect(cells[0]).toHaveAttribute("data-selected", "false");
      expect(cells[1]).toHaveAttribute("data-selected", "true"); // (0,1)
    });

    it("Tab wraps to the first column of the next row", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[1]); // (0,1) — last col
      await user.keyboard("{Tab}");
      expect(cells[1]).toHaveAttribute("data-selected", "false");
      expect(cells[2]).toHaveAttribute("data-selected", "true"); // (1,0)
    });

    it("Shift+Tab moves to the previous cell", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[1]); // (0,1)
      await user.keyboard("{Shift>}{Tab}{/Shift}");
      expect(cells[1]).toHaveAttribute("data-selected", "false");
      expect(cells[0]).toHaveAttribute("data-selected", "true"); // (0,0)
    });

    it("Enter switches the selected cell to editing mode", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[0]);
      await user.keyboard("{Enter}");
      expect(cells[0]).toHaveAttribute("data-editing", "true");
    });

    it("Escape deselects all cells", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[0]);
      await user.keyboard("{Escape}");
      expect(cells[0]).toHaveAttribute("data-selected", "false");
    });

    it("arrow keys do nothing when no cell is selected", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      // Focus wrapper without selecting a cell by clicking outside a cell
      await user.keyboard("{ArrowDown}");
      for (const cell of cells) {
        expect(cell).toHaveAttribute("data-selected", "false");
      }
    });
  });

  describe("focus behavior", () => {
    it("focusing the wrapper with no cell selected selects cell (0, 0)", async () => {
      const { getCells } = setup();
      const wrapper = screen.getByRole("table").closest("[tabindex='-1']") as HTMLElement;
      await act(async () => {
        wrapper.focus();
      });
      const cells = getCells();
      expect(cells[0]).toHaveAttribute("data-selected", "true");
      for (const cell of cells.slice(1)) {
        expect(cell).toHaveAttribute("data-selected", "false");
      }
    });

    it("re-focusing the wrapper after exiting edit does not reset selection to (0, 0)", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[2]); // (1, 0)
      await user.keyboard("{Enter}"); // enter editing
      act(() => captured.onExitEdit?.()); // exits edit, wrapper.focus() is called inside
      expect(cells[2]).toHaveAttribute("data-selected", "true");
      expect(cells[0]).toHaveAttribute("data-selected", "false");
    });
  });

  describe("editing mode", () => {
    it("arrow keys do not navigate while a cell is in editing mode", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[0]);
      await user.keyboard("{Enter}"); // enter editing
      await user.keyboard("{ArrowDown}"); // should be a no-op for DataTable
      // Still at (0,0) in editing mode — DataTable handler returns early
      expect(cells[0]).toHaveAttribute("data-editing", "true");
      expect(cells[2]).toHaveAttribute("data-selected", "false");
    });

    it("onExitEdit reverts the cell from editing to selected mode", async () => {
      const { user, getCells } = setup();
      const cells = getCells();
      await user.click(cells[0]);
      await user.keyboard("{Enter}"); // enter editing
      expect(cells[0]).toHaveAttribute("data-editing", "true");

      // Simulate the cell calling back onExitEdit (e.g. user pressed Escape in input)
      act(() => captured.onExitEdit?.());

      expect(cells[0]).toHaveAttribute("data-editing", "false");
      expect(cells[0]).toHaveAttribute("data-selected", "true");
    });

    it("handleCellChange is a no-op when no cell is active", async () => {
      const onCellChange = vi.fn();
      const user = userEvent.setup();
      const { getAllByRole } = render(
        <DataTable columns={columns} data={data} onCellChange={onCellChange} />,
      );
      // Select a cell to capture onChange, then deselect
      await user.click(getAllByRole("cell")[0]);
      await user.keyboard("{Escape}");
      // Now activeCell is null — handleCellChange should return early
      act(() => captured.onChange?.("should-not-change"));
      expect(onCellChange).not.toHaveBeenCalled();
    });

    it("calls onCellChange with row index, column key, and new value when a cell reports a change", async () => {
      const onCellChange = vi.fn();
      const user = userEvent.setup();
      const { getAllByRole } = render(
        <DataTable columns={columns} data={data} onCellChange={onCellChange} />,
      );
      // Select cell (0,0) — "name" column of row 0 — to trigger a render that captures onChange
      await user.click(getAllByRole("cell")[0]);
      // Simulate the text cell calling onChange with an updated value
      act(() => captured.onChange?.("Alice Updated"));
      expect(onCellChange).toHaveBeenCalledWith(0, "name", "Alice Updated");
    });
  });
});
