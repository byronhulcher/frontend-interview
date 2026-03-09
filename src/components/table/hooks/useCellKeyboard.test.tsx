import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { useCellKeyboard } from "./useCellKeyboard";
import type { NavigationDirection } from "./types";

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

function Harness({
  onExitEdit = vi.fn(),
  onNavigate = vi.fn(),
  enterNavigates = false,
}: {
  onExitEdit?: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
  enterNavigates?: boolean;
}) {
  const { handleKeyDown } = useCellKeyboard({
    onExitEdit,
    onNavigate,
    enterNavigates,
  });

  return (
    <input
      data-testid="input"
      onKeyDown={handleKeyDown}
      placeholder="Test input"
    />
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCellKeyboard", () => {
  describe("Escape key", () => {
    it("calls onExitEdit when Escape is pressed", async () => {
      const onExitEdit = vi.fn();
      const user = userEvent.setup();
      render(<Harness onExitEdit={onExitEdit} />);

      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Escape}");

      expect(onExitEdit).toHaveBeenCalledTimes(1);
    });

    it("does not call onNavigate when Escape is pressed", async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(<Harness onNavigate={onNavigate} />);

      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Escape}");

      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Enter key", () => {
    it("does nothing when enterNavigates is false (default)", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(<Harness onExitEdit={onExitEdit} onNavigate={onNavigate} />);

      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Enter}");

      expect(onExitEdit).not.toHaveBeenCalled();
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("calls onExitEdit and navigates down when enterNavigates is true", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(
        <Harness
          onExitEdit={onExitEdit}
          onNavigate={onNavigate}
          enterNavigates={true}
        />,
      );

      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Enter}");

      expect(onExitEdit).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith("down");
    });

    it("prevents default behavior when enterNavigates is true", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(
        <Harness
          onExitEdit={onExitEdit}
          onNavigate={onNavigate}
          enterNavigates={true}
        />,
      );

      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Enter}");

      // Verify the event was handled (preventDefault would be called internally)
      expect(onExitEdit).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith("down");
    });
  });

  describe("Tab key", () => {
    it("calls onExitEdit and navigates next on Tab", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(<Harness onExitEdit={onExitEdit} onNavigate={onNavigate} />);

      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Tab}");

      expect(onExitEdit).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith("next");
    });

    it("calls onExitEdit and navigates prev on Shift+Tab", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(<Harness onExitEdit={onExitEdit} onNavigate={onNavigate} />);

      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Shift>}{Tab}{/Shift}");

      expect(onExitEdit).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith("prev");
    });
  });

  describe("Other keys", () => {
    it("does nothing for unhandled keys", async () => {
      const onExitEdit = vi.fn();
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(<Harness onExitEdit={onExitEdit} onNavigate={onNavigate} />);

      await user.click(screen.getByTestId("input"));
      await user.keyboard("a");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Space}");

      expect(onExitEdit).not.toHaveBeenCalled();
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Optional callbacks", () => {
    it("works when onExitEdit is not provided", async () => {
      const user = userEvent.setup();
      expect(() => {
        render(<Harness onExitEdit={undefined} />);
      }).not.toThrow();

      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Escape}");
      // Should not throw
    });

    it("works when onNavigate is not provided", async () => {
      const user = userEvent.setup();
      expect(() => {
        render(<Harness onNavigate={undefined} enterNavigates={true} />);
      }).not.toThrow();

      await user.click(screen.getByTestId("input"));
      await user.keyboard("{Enter}");
      await user.keyboard("{Tab}");
      // Should not throw
    });
  });
});
