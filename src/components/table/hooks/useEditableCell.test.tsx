import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { vi } from "vitest";
import { useEditableCell } from "./useEditableCell";

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------
// Renders an input wired to useEditableCell and a "commit" button that calls
// exitAndCommit directly so we can test it without going through the keyboard.

function Harness({
  initialValue,
  isEditing = false,
  onChange = vi.fn(),
  onExitEdit = vi.fn(),
  onNavigate = vi.fn(),
}: {
  initialValue: string;
  isEditing?: boolean;
  onChange?: (v: string) => void;
  onExitEdit?: () => void;
  onNavigate?: (...args: unknown[]) => void;
}) {
  const { localValue, setLocalValue, inputRef, handleKeyDown, exitAndCommit } =
    useEditableCell({
      value: initialValue,
      isEditing,
      onChange,
      onExitEdit,
      onNavigate: onNavigate as Parameters<
        typeof useEditableCell
      >[0]["onNavigate"],
    });
  return (
    <>
      <input
        data-testid="input"
        ref={inputRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button data-testid="commit" onClick={exitAndCommit} />
    </>
  );
}

// Wraps Harness to let tests re-render with a new value prop.
function ControlledHarness({ isEditing = false }: { isEditing?: boolean }) {
  const [value, setValue] = useState("initial");
  return (
    <>
      <Harness initialValue={value} isEditing={isEditing} />
      <button data-testid="update-value" onClick={() => setValue("updated")} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Local value
// ---------------------------------------------------------------------------

describe("useEditableCell local value", () => {
  it("initialises localValue from value", () => {
    render(<Harness initialValue="hello" />);
    expect(screen.getByTestId("input")).toHaveValue("hello");
  });

  it("syncs localValue from value when not editing", async () => {
    const user = userEvent.setup();
    render(<ControlledHarness isEditing={false} />);
    await user.click(screen.getByTestId("update-value"));
    expect(screen.getByTestId("input")).toHaveValue("updated");
  });

  it("does NOT sync localValue from value while editing", async () => {
    const user = userEvent.setup();
    render(<ControlledHarness isEditing={true} />);
    await user.click(screen.getByTestId("update-value"));
    expect(screen.getByTestId("input")).toHaveValue("initial");
  });
});

// ---------------------------------------------------------------------------
// exitAndCommit
// ---------------------------------------------------------------------------

describe("useEditableCell exitAndCommit", () => {
  it("calls onChange with the current localValue", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initialValue="hello" onChange={onChange} isEditing />);
    await user.clear(screen.getByTestId("input"));
    await user.type(screen.getByTestId("input"), "world");
    await user.click(screen.getByTestId("commit"));
    expect(onChange).toHaveBeenCalledWith("world");
  });

  it("calls onExitEdit after onChange", async () => {
    const order: string[] = [];
    const onChange = vi.fn(() => order.push("onChange"));
    const onExitEdit = vi.fn(() => order.push("onExitEdit"));
    const user = userEvent.setup();
    render(
      <Harness
        initialValue="hello"
        onChange={onChange}
        onExitEdit={onExitEdit}
        isEditing
      />,
    );
    await user.click(screen.getByTestId("commit"));
    expect(order).toEqual(["onChange", "onExitEdit"]);
  });
});

// ---------------------------------------------------------------------------
// Focus on editing
// ---------------------------------------------------------------------------

describe("useEditableCell focus", () => {
  it("focuses the input when isEditing becomes true", () => {
    const { rerender } = render(
      <Harness initialValue="hello" isEditing={false} />,
    );
    expect(document.activeElement).not.toBe(screen.getByTestId("input"));
    rerender(<Harness initialValue="hello" isEditing={true} />);
    expect(document.activeElement).toBe(screen.getByTestId("input"));
  });
});

// ---------------------------------------------------------------------------
// Keyboard — delegates to useCellKeyboard with enterNavigates=true
// ---------------------------------------------------------------------------

describe("useEditableCell keyboard", () => {
  it("Escape calls exitAndCommit (onChange + onExitEdit)", async () => {
    const onChange = vi.fn();
    const onExitEdit = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness
        initialValue="hi"
        onChange={onChange}
        onExitEdit={onExitEdit}
        isEditing
      />,
    );
    await user.click(screen.getByTestId("input"));
    await user.keyboard("{Escape}");
    expect(onChange).toHaveBeenCalledOnce();
    expect(onExitEdit).toHaveBeenCalledOnce();
  });

  it("Tab calls exitAndCommit and navigates 'next'", async () => {
    const onExitEdit = vi.fn();
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness
        initialValue="hi"
        onExitEdit={onExitEdit}
        onNavigate={onNavigate}
        isEditing
      />,
    );
    await user.click(screen.getByTestId("input"));
    await user.keyboard("{Tab}");
    expect(onExitEdit).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledWith("next");
  });

  it("Shift+Tab calls exitAndCommit and navigates 'prev'", async () => {
    const onExitEdit = vi.fn();
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness
        initialValue="hi"
        onExitEdit={onExitEdit}
        onNavigate={onNavigate}
        isEditing
      />,
    );
    await user.click(screen.getByTestId("input"));
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(onExitEdit).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledWith("prev");
  });

  it("Enter calls exitAndCommit and navigates 'down'", async () => {
    const onExitEdit = vi.fn();
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness
        initialValue="hi"
        onExitEdit={onExitEdit}
        onNavigate={onNavigate}
        isEditing
      />,
    );
    await user.click(screen.getByTestId("input"));
    await user.keyboard("{Enter}");
    expect(onExitEdit).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledWith("down");
  });
});
