import { useState, useCallback, useRef, useEffect } from "react";
import type React from "react";
import type { ActiveCell, NavigationDirection } from "./types";

interface UseTableNavigationOptions {
  numRows: number;
  numCols: number;
}

/**
 * Encapsulates all keyboard navigation, focus management, and active-cell state
 * for a DataTable. Keeping this logic in a dedicated hook lets DataTable stay
 * focused on rendering, and makes the navigation behaviour independently testable.
 */
export function useTableNavigation({
  numRows,
  numCols,
}: UseTableNavigationOptions) {
  const [activeCell, setActiveCell] = useState<ActiveCell>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback(
    (direction: NavigationDirection) => {
      setActiveCell((prev) => {
        if (!prev) return null;
        const { row, col } = prev;
        switch (direction) {
          case "up":
            return row > 0 ? { row: row - 1, col, mode: "selected" } : prev;
          case "down":
            return row < numRows - 1
              ? { row: row + 1, col, mode: "selected" }
              : prev;
          case "left":
            return col > 0 ? { row, col: col - 1, mode: "selected" } : prev;
          case "right":
            return col < numCols - 1
              ? { row, col: col + 1, mode: "selected" }
              : prev;
          case "next":
            if (col < numCols - 1)
              return { row, col: col + 1, mode: "selected" };
            if (row < numRows - 1)
              return { row: row + 1, col: 0, mode: "selected" };
            return prev;
          case "prev":
            if (col > 0) return { row, col: col - 1, mode: "selected" };
            if (row > 0)
              return { row: row - 1, col: numCols - 1, mode: "selected" };
            return prev;
        }
      });
    },
    [numRows, numCols],
  );

  // Stable cell-state mutators exposed to DataTable's renderCell.
  // setActiveCell and wrapperRef are both stable references so these never change.
  const selectCell = useCallback((row: number, col: number) => {
    setActiveCell({ row, col, mode: "selected" });
    // Return keyboard focus to the wrapper so arrow keys work immediately after a click.
    // preventScroll stops Chrome from scrolling the table into view
    wrapperRef.current?.focus({ preventScroll: true });
  }, []);

  const editCell = useCallback((row: number, col: number) => {
    setActiveCell({ row, col, mode: "editing" });
  }, []);

  const exitEdit = useCallback(() => {
    setActiveCell((prev) => (prev ? { ...prev, mode: "selected" } : null));
    // preventScroll stops Chrome from scrolling the table into view
    wrapperRef.current?.focus({ preventScroll: true });
  }, []);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      // Select first cell when focus arrives from outside the table
      if (activeCell === null && !e.currentTarget.contains(e.relatedTarget)) {
        setActiveCell({ row: 0, col: 0, mode: "selected" });
      }
    },
    [activeCell],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Stop React's synthetic event from bubbling to parent DataTable wrappers.
      // React portals propagate events through the React component tree, so without
      // this, an Escape in a nested DataTable would also fire handleKeyDown on every
      // ancestor DataTable, nulling out their activeCells before onExitEdit can restore them.
      e.stopPropagation();
      // In editing mode the focused input handles keyboard events; let them through.
      if (!activeCell || activeCell.mode === "editing") return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          navigate("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          navigate("down");
          break;
        case "ArrowLeft":
          e.preventDefault();
          navigate("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          navigate("right");
          break;
        case "Tab":
          e.preventDefault();
          navigate(e.shiftKey ? "prev" : "next");
          break;
        case "Enter":
          e.preventDefault();
          setActiveCell((prev) => (prev ? { ...prev, mode: "editing" } : null));
          break;
        case "Escape":
          setActiveCell(null);
          break;
      }
    },
    [activeCell, navigate],
  );

  return {
    activeCell,
    wrapperRef,
    navigate,
    selectCell,
    editCell,
    exitEdit,
    handleFocus,
    handleKeyDown,
  };
}
