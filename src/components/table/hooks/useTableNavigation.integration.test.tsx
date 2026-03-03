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
  it("sentinel focus redirects to wrapper and selects first cell", () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    // The sentinel span sits before the wrapper and catches Tab from the browser.
    const sentinel = document.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(sentinel).toBeTruthy();

    act(() => {
      sentinel.focus();
    });

    // Focus should have been redirected to the wrapper (tabIndex=-1)
    const wrapper = screen.getByRole("table").closest("[tabindex='-1']");
    expect(wrapper).toHaveFocus();

    // First cell should be selected
    const firstCell = screen.getAllByRole("cell")[0];
    expect(firstCell).toHaveAttribute("data-selected", "true");
  });

  it("should handle Tab navigation within table after sentinel focus", async () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    // Focus via sentinel (simulates real Tab from page)
    const sentinel = document.querySelector("[aria-hidden='true']") as HTMLElement;
    act(() => {
      sentinel.focus();
    });

    const wrapper = screen.getByRole("table").closest("[tabindex='-1']") as HTMLElement;

    // Now Tab should navigate between cells
    act(() => {
      fireEvent.keyDown(wrapper, { key: "Tab" });
    });

    // Should move to next cell — first cell deselected, second selected
    const cells = screen.getAllByRole("cell");
    expect(cells[0]).toHaveAttribute("data-selected", "false");
    expect(cells[1]).toHaveAttribute("data-selected", "true");
  });
});
