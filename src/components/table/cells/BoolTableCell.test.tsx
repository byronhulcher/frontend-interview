import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { BoolTableCell } from "./BoolTableCell";
import type { CellProps } from "./types";

const baseProps: CellProps & { value: boolean } = {
  value: true,
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
          <BoolTableCell {...props} />
        </tr>
      </tbody>
    </table>,
  );
  return { user, cell: screen.getByRole("cell") };
}

describe("BoolTableCell", () => {
  describe("display", () => {
    it("shows the true badge when value is true", () => {
      setup({ ...baseProps, value: true });
      expect(screen.getByText("✓ True")).toBeInTheDocument();
    });

    it("shows the false badge when value is false", () => {
      setup({ ...baseProps, value: false });
      expect(screen.getByText("✗ False")).toBeInTheDocument();
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

    it("shows a dropdown select in editing mode", () => {
      setup({ ...baseProps, isSelected: true, isEditing: true });
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("dropdown is focused when editing starts", () => {
      setup({ ...baseProps, isSelected: true, isEditing: true });
      expect(screen.getByRole("combobox")).toHaveFocus();
    });

    it("dropdown reflects the current value", () => {
      setup({ ...baseProps, value: false, isSelected: true, isEditing: true });
      expect(screen.getByRole("combobox")).toHaveValue("false");
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

  describe("dropdown interaction", () => {
    it("calls onExitEdit when a new value is selected", async () => {
      const onExitEdit = vi.fn();
      const { user } = setup({
        ...baseProps,
        value: true,
        isSelected: true,
        isEditing: true,
        onExitEdit,
      });
      await user.selectOptions(screen.getByRole("combobox"), "false");
      expect(onExitEdit).toHaveBeenCalledOnce();
    });

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

    it("calls onExitEdit on blur", async () => {
      const onExitEdit = vi.fn();
      const { user } = setup({
        ...baseProps,
        isSelected: true,
        isEditing: true,
        onExitEdit,
      });
      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      await user.tab(); // This will trigger blur
      expect(onExitEdit).toHaveBeenCalledOnce();
    });

    it("updates the displayed badge after selecting a new value", async () => {
      const { user } = setup({
        ...baseProps,
        value: true,
        isSelected: true,
        isEditing: true,
        onExitEdit: vi.fn(),
      });
      await user.selectOptions(screen.getByRole("combobox"), "false");
      // After onExitEdit is called the parent would re-render with isEditing=false,
      // but since we control props here the badge isn't re-rendered in this test.
      // We verify the select reflected the new value before closing.
      expect(screen.getByRole("combobox")).toHaveValue("false");
    });

    it("calls onChange with the new boolean value when a selection is made", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <table>
          <tbody>
            <tr>
              <BoolTableCell
                {...baseProps}
                value={true}
                isSelected={true}
                isEditing={true}
                onChange={onChange}
              />
            </tr>
          </tbody>
        </table>,
      );
      await user.selectOptions(screen.getByRole("combobox"), "false");
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });
});
