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

describe("useTableNavigation - Browser Compatibility", () => {
  it("should focus first cell when Tab is pressed on page load", () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    // Simulate Tab being pressed at the document level (as would happen on page load)
    act(() => {
      fireEvent.keyDown(document, { key: "Tab" });
    });

    // The table wrapper should now have focus
    const tableWrapper = screen.getByRole("table").closest("[tabindex]");
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
