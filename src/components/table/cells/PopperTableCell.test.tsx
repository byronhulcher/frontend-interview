import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { PopperTableCell } from "./PopperTableCell";
import type { CellProps } from "./types";

const baseProps: CellProps & { triggerText?: string } = {
  triggerText: "View",
  isSelected: false,
  isEditing: false,
  onSelect: vi.fn(),
  onEdit: vi.fn(),
  onExitEdit: vi.fn(),
  onNavigate: vi.fn(),
};

function setup(props = baseProps) {
  const user = userEvent.setup();
  render(
    <table>
      <tbody>
        <tr>
          <PopperTableCell {...props} />
        </tr>
      </tbody>
    </table>,
  );
  return { user, cell: screen.getByRole("cell") };
}

describe("PopperTableCell", () => {
  describe("display", () => {
    it("shows the trigger button", () => {
      setup();
      expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
    });

    it("applies a blue-400 ring when selected", () => {
      const { cell } = setup({ ...baseProps, isSelected: true });
      expect(cell.className).toMatch(/ring-blue-400/);
    });

    it("applies an orange-500 ring when editing", () => {
      const { cell } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
      });
      expect(cell.className).toMatch(/ring-orange-500/);
      expect(cell.className).not.toMatch(/ring-blue-600/);
    });
  });

  describe("click handling", () => {
    it("calls onSelect when clicked while not selected", async () => {
      const onSelect = vi.fn();
      const { user, cell } = setup({ ...baseProps, onSelect });
      await user.click(cell);
      expect(onSelect).toHaveBeenCalledOnce();
    });

    it("calls onEdit when clicked while selected but not editing", async () => {
      const onEdit = vi.fn();
      const { user, cell } = setup({ ...baseProps, isSelected: true, onEdit });
      await user.click(cell);
      expect(onEdit).toHaveBeenCalledOnce();
    });

    it("does not call onSelect or onEdit when in editing mode (clicks pass to button)", async () => {
      const onSelect = vi.fn();
      const onEdit = vi.fn();
      const { user, cell } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
        onSelect,
        onEdit,
      });
      await user.click(cell);
      expect(onSelect).not.toHaveBeenCalled();
      expect(onEdit).not.toHaveBeenCalled();
    });
  });

  describe("editing mode", () => {
    it("focuses the button when editing starts", () => {
      setup({ ...baseProps, isSelected: true, isEditing: true });
      expect(screen.getByRole("button", { name: "View" })).toHaveFocus();
    });

    it("opens the popover when Enter is pressed on the focused button", async () => {
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
      });
      await user.keyboard("{Enter}");
      // The nested DataTable is rendered when the popover opens
      expect(
        screen.getByRole("columnheader", { name: "Company" }),
      ).toBeInTheDocument();
    });

    it("calls onExitEdit when Escape is pressed on the button", async () => {
      const onExitEdit = vi.fn();
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
        onExitEdit,
      });
      await user.keyboard("{Escape}");
      expect(onExitEdit).toHaveBeenCalledOnce();
    });
  });

  describe("nested DataTable", () => {
    // The nested table has columns "Company" and "Revenue" — the outer test wrapper has
    // no columnheaders, so these queries uniquely identify the nested DataTable's content.
    function getNestedTable() {
      return screen
        .getByRole("columnheader", { name: "Company" })
        .closest("table")!;
    }

    it("does not render table content until the popover is first opened", async () => {
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
      });
      expect(
        screen.queryByRole("columnheader", { name: "Company" }),
      ).not.toBeInTheDocument();
      await user.keyboard("{Enter}");
      expect(
        screen.getByRole("columnheader", { name: "Company" }),
      ).toBeInTheDocument();
    });

    it("renders a DataTable with defined columns when the popover opens", async () => {
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
      });
      await user.keyboard("{Enter}");
      expect(
        screen.getByRole("columnheader", { name: "Company" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Revenue" }),
      ).toBeInTheDocument();
    });

    it("shows 5 data rows in the nested table", async () => {
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
      });
      await user.keyboard("{Enter}");
      // 1 header row + 5 generated data rows
      expect(within(getNestedTable()).getAllByRole("row")).toHaveLength(6);
    });

    it("generates data from the cell value and keeps it stable across opens", async () => {
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
      });
      await user.keyboard("{Enter}");
      const firstTexts = within(getNestedTable())
        .getAllByRole("cell")
        .map((c) => c.textContent);
      await user.keyboard("{Escape}"); // close — portal unmounts
      await user.keyboard("{Enter}"); // reopen — portal remounts from persisted state
      // Re-query after remount; data comes from PopperTableCell's state, not regenerated
      const secondTexts = within(getNestedTable())
        .getAllByRole("cell")
        .map((c) => c.textContent);
      expect(secondTexts).toEqual(firstTexts);
    });

    it("preserves cell edits after the popover is closed and reopened", async () => {
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
      });
      await user.keyboard("{Enter}"); // open → Radix auto-focuses DataTable wrapper → cell (0,0) auto-selected
      // (0,0) is already selected via handleFocus; one click enters editing
      await user.click(within(getNestedTable()).getAllByRole("cell")[0]);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      await user.clear(screen.getByRole("textbox"));
      await user.type(screen.getByRole("textbox"), "persisted");
      await user.keyboard("{Escape}"); // closes popover; edit flows up via onCellChange → stored in state
      await user.keyboard("{Enter}"); // reopen — DataTable remounts with the persisted data
      // Re-query after remount; edited value is in PopperTableCell state
      expect(
        within(getNestedTable()).getAllByRole("cell")[0],
      ).toHaveTextContent("persisted");
    });

    it("closes the popover on Escape when focus is inside the nested table", async () => {
      const onExitEdit = vi.fn();
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
        onExitEdit,
      });
      await user.keyboard("{Enter}"); // open → focus moves into nested DataTable wrapper
      await user.click(within(getNestedTable()).getAllByRole("cell")[0]); // focus inside a cell
      onExitEdit.mockClear();
      await user.keyboard("{Escape}");
      expect(onExitEdit).toHaveBeenCalled();
    });
  });

  describe("popover", () => {
    it("calls onExitEdit when the popover closes", async () => {
      const onExitEdit = vi.fn();
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
        onExitEdit,
      });
      await user.keyboard("{Enter}"); // open popover
      await user.keyboard("{Escape}"); // close popover
      expect(onExitEdit).toHaveBeenCalled();
    });

    it("keeps an orange-500 ring on the cell while the popover is open", async () => {
      const { user, cell } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
      });
      await user.keyboard("{Enter}"); // open popover
      expect(cell.className).toMatch(/ring-orange-500/);
      expect(cell.className).not.toMatch(/ring-blue-600/);
    });
  });
});
