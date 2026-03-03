import { render, act, cleanup } from "@testing-library/react";
import { vi, beforeEach, afterEach } from "vitest";
import { useRef, type ReactNode } from "react";
import { useFocusWithin } from "./useFocusWithin";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** A component that registers itself in the focus registry via useFocusWithin. */
function TrackedDiv({
  testId,
  onClose,
  children,
}: {
  testId: string;
  onClose?: () => void;
  children?: ReactNode;
}) {
  const { isFocusedWithin, ref, Wrapper } = useFocusWithin({ onClose });
  return (
    <div
      ref={ref}
      tabIndex={-1}
      data-testid={testId}
      data-focused-within={isFocusedWithin}
    >
      <Wrapper>{children}</Wrapper>
    </div>
  );
}

/**
 * A parent that tracks focus and wraps children in its Wrapper,
 * establishing a logical subtree for portal-like scenarios.
 */
function TrackedParent({
  testId,
  onClose,
  children,
}: {
  testId: string;
  onClose?: () => void;
  children?: ReactNode;
}) {
  const { isFocusedWithin, ref, Wrapper } = useFocusWithin({ onClose });
  return (
    <>
      <div
        ref={ref}
        tabIndex={-1}
        data-testid={testId}
        data-focused-within={isFocusedWithin}
      />
      {/* Children rendered outside the parent's DOM but inside its Wrapper (simulates portal) */}
      <Wrapper>{children}</Wrapper>
    </>
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Registry lifecycle
// ---------------------------------------------------------------------------

describe("registry lifecycle", () => {
  it("adds global listeners on first registration", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    render(<TrackedDiv testId="a" />);
    expect(addSpy).toHaveBeenCalledWith("focusin", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("focusout", expect.any(Function));
    addSpy.mockRestore();
  });

  it("removes global listeners when all tracked components unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<TrackedDiv testId="a" />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("focusin", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("focusout", expect.any(Function));
    removeSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// isFocusedWithin tracking
// ---------------------------------------------------------------------------

describe("isFocusedWithin tracking", () => {
  it("returns true when the tracked element itself has focus", () => {
    const { getByTestId } = render(<TrackedDiv testId="a" />);
    const el = getByTestId("a");

    act(() => {
      el.focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    expect(el.dataset.focusedWithin).toBe("true");
  });

  it("returns true when a DOM child of the tracked element has focus", () => {
    const { getByTestId } = render(
      <TrackedDiv testId="parent">
        <input data-testid="child-input" />
      </TrackedDiv>,
    );
    const input = getByTestId("child-input");

    act(() => {
      input.focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    expect(getByTestId("parent").dataset.focusedWithin).toBe("true");
  });

  it("returns false when focus moves to an unrelated element", () => {
    const { getByTestId } = render(
      <>
        <TrackedDiv testId="a" />
        <TrackedDiv testId="b" />
      </>,
    );
    const elA = getByTestId("a");
    const elB = getByTestId("b");

    // Focus A first
    act(() => {
      elA.focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });
    expect(elA.dataset.focusedWithin).toBe("true");

    // Move focus to B
    act(() => {
      elB.focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    expect(elA.dataset.focusedWithin).toBe("false");
    expect(elB.dataset.focusedWithin).toBe("true");
  });
});

// ---------------------------------------------------------------------------
// Logical subtree via Wrapper
// ---------------------------------------------------------------------------

describe("logical subtree via Wrapper", () => {
  it("parent isFocusedWithin is true when a Wrapper-child has focus", () => {
    const { getByTestId } = render(
      <TrackedParent testId="parent">
        <TrackedDiv testId="child" />
      </TrackedParent>,
    );

    // Focus the child (which is outside the parent's DOM but inside its Wrapper)
    const child = getByTestId("child");
    act(() => {
      child.focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    expect(getByTestId("parent").dataset.focusedWithin).toBe("true");
    expect(child.dataset.focusedWithin).toBe("true");
  });

  it("parent isFocusedWithin transitions to false when focus leaves all children", () => {
    const { getByTestId } = render(
      <>
        <TrackedParent testId="parent">
          <TrackedDiv testId="child" />
        </TrackedParent>
        <TrackedDiv testId="outside" />
      </>,
    );

    // Focus the child
    act(() => {
      getByTestId("child").focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });
    expect(getByTestId("parent").dataset.focusedWithin).toBe("true");

    // Move focus outside
    act(() => {
      getByTestId("outside").focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });
    expect(getByTestId("parent").dataset.focusedWithin).toBe("false");
  });
});

// ---------------------------------------------------------------------------
// onClose callback
// ---------------------------------------------------------------------------

describe("onClose callback", () => {
  it("fires when focus moves from subtree to another registered element", () => {
    const onClose = vi.fn();
    const { getByTestId } = render(
      <>
        <TrackedDiv testId="a" onClose={onClose} />
        <TrackedDiv testId="b" />
      </>,
    );

    // Focus A
    act(() => {
      getByTestId("a").focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();

    // Move to B
    act(() => {
      getByTestId("b").focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does NOT fire when focus moves to an unregistered element", () => {
    const onClose = vi.fn();
    const { getByTestId } = render(
      <>
        <TrackedDiv testId="a" onClose={onClose} />
        <div tabIndex={-1} data-testid="unregistered" />
      </>,
    );

    // Focus A
    act(() => {
      getByTestId("a").focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    // Move focus to an unregistered element
    act(() => {
      getByTestId("unregistered").focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does NOT fire for focus moves within the same logical subtree", () => {
    const onClose = vi.fn();
    const { getByTestId } = render(
      <TrackedParent testId="parent" onClose={onClose}>
        <TrackedDiv testId="child-a" />
        <TrackedDiv testId="child-b" />
      </TrackedParent>,
    );

    // Focus child-a
    act(() => {
      getByTestId("child-a").focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    // Move to child-b (still within parent's logical subtree)
    act(() => {
      getByTestId("child-b").focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("uses the latest onClose callback without re-registration", () => {
    const onClose1 = vi.fn();
    const onClose2 = vi.fn();
    const { getByTestId, rerender } = render(
      <>
        <TrackedDiv testId="a" onClose={onClose1} />
        <TrackedDiv testId="b" />
      </>,
    );

    // Focus A
    act(() => {
      getByTestId("a").focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    // Update onClose
    rerender(
      <>
        <TrackedDiv testId="a" onClose={onClose2} />
        <TrackedDiv testId="b" />
      </>,
    );

    // Move to B — should call onClose2, not onClose1
    act(() => {
      getByTestId("b").focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    expect(onClose1).not.toHaveBeenCalled();
    expect(onClose2).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Blur deferral
// ---------------------------------------------------------------------------

describe("blur deferral", () => {
  it("defers blur processing via setTimeout to handle portal crossings", () => {
    const onClose = vi.fn();
    const { getByTestId } = render(
      <>
        <TrackedDiv testId="a" onClose={onClose} />
        <TrackedDiv testId="b" />
      </>,
    );

    // Focus A
    act(() => {
      getByTestId("a").focus();
      document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    // Dispatch focusout without a matching focusin (simulates portal crossing
    // where activeElement briefly shows <body>)
    act(() => {
      document.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });

    // onClose should NOT have fired yet (deferred)
    expect(onClose).not.toHaveBeenCalled();

    // After the timer fires, it processes the blur
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Focus landed on body (no registered element) → onClose should NOT fire
    // because the focusMovedToKnownElement guard prevents it
    expect(onClose).not.toHaveBeenCalled();
  });
});
