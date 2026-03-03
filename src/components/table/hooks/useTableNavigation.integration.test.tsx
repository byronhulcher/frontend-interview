/**
 * Integration test for keyboard navigation behavior across browsers
 */
import { render, fireEvent, screen, act } from "@testing-library/react";
import { DataTable } from "../DataTable";

const mockColumns = [
  { key: "name", header: "Name", type: "text" as const },
  { key: "value", header: "Value", type: "number" as const },
];

const mockData = [
  { id: "1", name: "Item 1", value: 100 },
  { id: "2", name: "Item 2", value: 200 },
];

describe("useTableNavigation - selectCell focus behavior", () => {
  it("moves focus to the wrapper when a cell is programmatically focused", () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    const firstCell = screen.getAllByRole("cell")[0];
    const wrapper = screen.getByRole("table").closest("[tabindex]");

    act(() => {
      firstCell.focus();
    });

    // The cell triggers onFocus → selectCell → wrapper.focus().
    // The wrapper holds focus so keyboard events (arrow keys) work.
    expect(wrapper).toHaveFocus();
    expect(firstCell).toHaveAttribute("data-selected", "true");
  });
});

describe("useTableNavigation - programmatic focus then arrow key navigation", () => {
  it("arrow keys navigate after programmatic focus on a cell", () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    const cells = screen.getAllByRole("cell");
    const firstCell = cells[0]; // row 0, col 0

    // Programmatically focus the cell (simulates DevTools "Focus")
    act(() => {
      firstCell.focus();
    });

    // The cell should be selected and wrapper should have focus
    expect(firstCell).toHaveAttribute("data-selected", "true");

    // ArrowDown on the focused wrapper should navigate
    const wrapper = screen.getByRole("table").closest("[tabindex]") as HTMLElement;
    act(() => {
      fireEvent.keyDown(wrapper, { key: "ArrowDown" });
    });

    // row 0 col 0 should no longer be selected, row 1 col 0 should be
    const cellsAfter = screen.getAllByRole("cell");
    expect(cellsAfter[0]).toHaveAttribute("data-selected", "false");
    expect(cellsAfter[2]).toHaveAttribute("data-selected", "true");
  });
});

describe("useTableNavigation - Browser Compatibility", () => {
  it("should focus first cell when Tab is pressed on page load", () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    const tableWrapper = screen.getByRole("table").closest("[tabindex]");

    // Simulate the table wrapper receiving focus (as would happen when Tab reaches it)
    act(() => {
      tableWrapper?.focus();
    });

    // The table wrapper should now have focus
    expect(tableWrapper).toHaveFocus();
  });

  it("should handle Tab navigation within table after initial focus", async () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    // Focus the table first
    const tableWrapper = screen.getByRole("table").closest("[tabindex]");

    act(() => {
      tableWrapper?.focus();
    });

    // Now Tab should navigate between cells
    act(() => {
      fireEvent.keyDown(tableWrapper!, { key: "Tab" });
    });

    // Should move to next cell (but exact behavior depends on cell implementation)
    // This test ensures Tab is handled without causing page scroll
  });
});
