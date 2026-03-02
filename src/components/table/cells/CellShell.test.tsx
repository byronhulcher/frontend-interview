import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { CellShell } from "./CellShell";
import { useCellKeyboard } from "./hooks/useCellKeyboard";

// ---------------------------------------------------------------------------
// useCellKeyboard — test via a minimal wrapper that renders an input
// ---------------------------------------------------------------------------

function KeyboardHarness({
  onExitEdit = vi.fn(),
  onNavigate = vi.fn(),
  enterNavigates,
}: {
  onExitEdit?: () => void;
  onNavigate?: (...args: unknown[]) => void;
  enterNavigates?: boolean;
}) {
  const { handleKeyDown } = useCellKeyboard({
    onExitEdit,
    onNavigate: onNavigate as Parameters<
      typeof useCellKeyboard
    >[0]["onNavigate"],
    enterNavigates,
  });
  return (
    <table>
      <tbody>
        <tr>
          <td>
            <input
              data-testid="input"
              onKeyDown={handleKeyDown}
              onChange={() => {}}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

describe("useCellKeyboard", () => {
  describe("Escape", () => {
    it("calls onExitEdit when Escape is pressed", async () => {
      const onExitEdit = vi.fn();
      const user = userEvent.setup();
      render(<KeyboardHarness onExitEdit={onExitEdit} />);
      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Escape}");
      expect(onExitEdit).toHaveBeenCalledOnce();
    });

    it("does not call onNavigate when Escape is pressed", async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(<KeyboardHarness onNavigate={onNavigate} />);
      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Escape}");
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Tab", () => {
    it("calls onExitEdit and navigates 'next' on Tab", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(
        <KeyboardHarness onExitEdit={onExitEdit} onNavigate={onNavigate} />,
      );
      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Tab}");
      expect(onExitEdit).toHaveBeenCalledOnce();
      expect(onNavigate).toHaveBeenCalledWith("next");
    });

    it("calls onExitEdit and navigates 'prev' on Shift+Tab", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(
        <KeyboardHarness onExitEdit={onExitEdit} onNavigate={onNavigate} />,
      );
      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Shift>}{Tab}{/Shift}");
      expect(onExitEdit).toHaveBeenCalledOnce();
      expect(onNavigate).toHaveBeenCalledWith("prev");
    });
  });

  describe("Enter with enterNavigates=false (default)", () => {
    it("does not call onExitEdit when Enter is pressed", async () => {
      const onExitEdit = vi.fn();
      const user = userEvent.setup();
      render(<KeyboardHarness onExitEdit={onExitEdit} />);
      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Enter}");
      expect(onExitEdit).not.toHaveBeenCalled();
    });

    it("does not call onNavigate when Enter is pressed", async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(<KeyboardHarness onNavigate={onNavigate} />);
      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Enter}");
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Enter with enterNavigates=true", () => {
    it("calls onExitEdit and navigates 'down' on Enter", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(
        <KeyboardHarness
          onExitEdit={onExitEdit}
          onNavigate={onNavigate}
          enterNavigates
        />,
      );
      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Enter}");
      expect(onExitEdit).toHaveBeenCalledOnce();
      expect(onNavigate).toHaveBeenCalledWith("down");
    });
  });

  describe("unrelated keys", () => {
    it("does nothing for keys that are not handled", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(
        <KeyboardHarness onExitEdit={onExitEdit} onNavigate={onNavigate} />,
      );
      await user.click(screen.getByTestId("input"));
      await user.keyboard("{ArrowDown}");
      expect(onExitEdit).not.toHaveBeenCalled();
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// CellShell
// ---------------------------------------------------------------------------

function setup(props: Partial<React.ComponentProps<typeof CellShell>> = {}) {
  const user = userEvent.setup();
  const defaults = {
    isSelected: false,
    isEditing: false,
    onSelect: vi.fn(),
    onEdit: vi.fn(),
    children: <span>content</span>,
  };
  render(
    <table>
      <tbody>
        <tr>
          <CellShell {...defaults} {...props} />
        </tr>
      </tbody>
    </table>,
  );
  return { user, cell: screen.getByRole("cell") };
}

describe("CellShell", () => {
  describe("className", () => {
    it("always applies cursor-pointer", () => {
      const { cell } = setup();
      expect(cell.className).toMatch(/cursor-pointer/);
    });

    it("has no ring when not selected and not editing", () => {
      const { cell } = setup();
      expect(cell.className).not.toMatch(/ring/);
    });

    it("applies ring-blue-400 when selected and not editing", () => {
      const { cell } = setup({ isSelected: true });
      expect(cell.className).toMatch(/ring-blue-400/);
    });

    it("does not apply ring-blue-400 when selected and editing", () => {
      const { cell } = setup({ isSelected: true, isEditing: true });
      expect(cell.className).not.toMatch(/ring-blue-400/);
    });

    it("applies ring-orange-500 when editing", () => {
      const { cell } = setup({ isSelected: true, isEditing: true });
      expect(cell.className).toMatch(/ring-orange-500/);
    });

    it("applies p-0 when editing", () => {
      const { cell } = setup({ isSelected: true, isEditing: true });
      expect(cell.className).toMatch(/p-0/);
    });

    it("does not apply p-0 when not editing", () => {
      const { cell } = setup({ isSelected: true });
      expect(cell.className).not.toMatch(/p-0/);
    });
  });

  describe("click handling", () => {
    it("calls onSelect when clicked and not selected", async () => {
      const onSelect = vi.fn();
      const { user, cell } = setup({ onSelect });
      await user.click(cell);
      expect(onSelect).toHaveBeenCalledOnce();
    });

    it("calls onEdit when clicked and selected", async () => {
      const onEdit = vi.fn();
      const { user, cell } = setup({ isSelected: true, onEdit });
      await user.click(cell);
      expect(onEdit).toHaveBeenCalledOnce();
    });

    it("does not call onEdit when clicked and not selected", async () => {
      const onEdit = vi.fn();
      const { user, cell } = setup({ onEdit });
      await user.click(cell);
      expect(onEdit).not.toHaveBeenCalled();
    });

    it("does not call onSelect when clicked and selected", async () => {
      const onSelect = vi.fn();
      const { user, cell } = setup({ isSelected: true, onSelect });
      await user.click(cell);
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("children", () => {
    it("renders children inside the cell", () => {
      setup({ children: <span>hello</span> });
      expect(screen.getByText("hello")).toBeInTheDocument();
    });
  });
});
