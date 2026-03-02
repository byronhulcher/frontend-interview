import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { NumberCell } from "./NumberCell";
import type { CellProps } from "./types";

const baseProps: CellProps & {
  value: number;
  format?: "currency" | "percentage" | "decimal";
} = {
  value: 1234.5,
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
          <NumberCell {...props} />
        </tr>
      </tbody>
    </table>,
  );
  return { user, cell: screen.getByRole("cell") };
}

describe("NumberCell", () => {
  describe("display", () => {
    it("shows the formatted value when not editing", () => {
      setup({ ...baseProps, value: 1234.5, format: "currency" });
      expect(screen.getByText("$1,234.50")).toBeInTheDocument();
    });

    it("shows percentage format correctly", () => {
      setup({ ...baseProps, value: 0.85, format: "percentage" });
      expect(screen.getByText("0.85%")).toBeInTheDocument();
    });

    it("shows decimal format correctly", () => {
      setup({ ...baseProps, value: 1234.567, format: "decimal" });
      expect(screen.getByText("1234.57")).toBeInTheDocument();
    });

    it("shows default format correctly", () => {
      setup({ ...baseProps, value: 1234.5 });
      expect(screen.getByText("1,234.5")).toBeInTheDocument();
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

    it("shows a number input in editing mode", () => {
      setup({ ...baseProps, isSelected: true, isEditing: true });
      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });

    it("input is focused when editing starts", () => {
      setup({ ...baseProps, isSelected: true, isEditing: true });
      expect(screen.getByRole("spinbutton")).toHaveFocus();
    });
  });

  describe("click handling", () => {
    it("calls onSelect when clicked while not selected", async () => {
      const onSelect = vi.fn();
      const { user, cell } = setup({ ...baseProps, onSelect });
      await user.click(cell);
      expect(onSelect).toHaveBeenCalledOnce();
    });

    it("calls onEdit when clicked while selected", async () => {
      const onEdit = vi.fn();
      const { user, cell } = setup({ ...baseProps, isSelected: true, onEdit });
      await user.click(cell);
      expect(onEdit).toHaveBeenCalledOnce();
    });
  });

  describe("keyboard handling in editing mode", () => {
    it("calls onExitEdit on Escape", async () => {
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

    it("calls onExitEdit and navigates down on Enter", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
        onExitEdit,
        onNavigate,
      });
      await user.keyboard("{Enter}");
      expect(onExitEdit).toHaveBeenCalledOnce();
      expect(onNavigate).toHaveBeenCalledWith("down");
    });

    it("calls onExitEdit and navigates next on Tab", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
        onExitEdit,
        onNavigate,
      });
      await user.keyboard("{Tab}");
      expect(onExitEdit).toHaveBeenCalledOnce();
      expect(onNavigate).toHaveBeenCalledWith("next");
    });

    it("calls onExitEdit when the input loses focus", async () => {
      const onExitEdit = vi.fn();
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
        onExitEdit,
      });
      await user.tab();
      expect(onExitEdit).toHaveBeenCalled();
    });

    it("calls onChange with the current numeric value when editing exits", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <table>
          <tbody>
            <tr>
              <NumberCell
                {...baseProps}
                isSelected={true}
                isEditing={true}
                onChange={onChange}
              />
            </tr>
          </tbody>
        </table>,
      );
      await user.clear(screen.getByRole("spinbutton"));
      await user.type(screen.getByRole("spinbutton"), "999");
      await user.keyboard("{Enter}");
      expect(onChange).toHaveBeenCalledWith(999);
    });
  });
});
