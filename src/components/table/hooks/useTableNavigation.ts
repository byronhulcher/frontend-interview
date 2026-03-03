import { useCallback, useRef } from "react";
import type React from "react";
import type { NavigationDirection } from "./types";
import { useFocusCoordinator } from "./FocusCoordinator";
import type { ActiveCellStore } from "./ActiveCellStore";

interface UseTableNavigationOptions {
  numRows: number;
  numCols: number;
  store: ActiveCellStore;
}

/**
 * Encapsulates all keyboard navigation, focus management, and active-cell state
 * for a DataTable. Keeping this logic in a dedicated hook lets DataTable stay
 * focused on rendering, and makes the navigation behaviour independently testable.
 *
 * State is held in the provided `ActiveCellStore` rather than `useState` so that
 * individual cells can subscribe via `useSyncExternalStore` and only re-render
 * when their own selection state changes (O(2) per navigation instead of O(R×C)).
 */
export function useTableNavigation({
  numRows,
  numCols,
  store,
}: UseTableNavigationOptions) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const coordinator = useFocusCoordinator();

  const navigate = useCallback(
    (direction: NavigationDirection) => {
      store.setActiveCell((prev) => {
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
    [numRows, numCols, store],
  );

  // Stable cell-state mutators exposed to DataTable's renderCell.
  // store and wrapperRef are both stable references so these never change.
  const selectCell = useCallback(
    (row: number, col: number) => {
      store.setActiveCell({ row, col, mode: "selected" });
      // Claim focus so that cascading exitEdit calls from nested DataTables
      // (triggered by Radix popover unmount) won't compete for focus.
      const wrapper = wrapperRef.current;
      if (wrapper) {
        coordinator?.claimFocus(wrapper);
        wrapper.focus({ preventScroll: true });
        coordinator?.releaseClaim();
      }
    },
    [coordinator, store],
  );

  const editCell = useCallback(
    (row: number, col: number) => {
      store.setActiveCell({ row, col, mode: "editing" });
    },
    [store],
  );

  const exitEdit = useCallback(() => {
    store.setActiveCell((prev) =>
      prev ? { ...prev, mode: "selected" } : null,
    );
    // Only focus if no other DataTable has claimed focus (e.g. during a
    // cascading popover close triggered by a different table's selectCell).
    const wrapper = wrapperRef.current;
    if (wrapper && (!coordinator || coordinator.canFocus(wrapper))) {
      wrapper.focus({ preventScroll: true });
    }
  }, [coordinator, store]);

  // Sentinel spans (sr-only, tabIndex=0) sit before the wrapper so that the
  // browser's native Tab lands on a tiny invisible element instead of the tall
  // wrapper div — preventing Chrome from scrolling the wrapper into view.
  const handleSentinelFocus = useCallback(
    (e: React.FocusEvent<HTMLSpanElement>) => {
      // Ignore if focus came from inside the table (e.g. Shift+Tab from first cell)
      if (
        e.relatedTarget &&
        wrapperRef.current?.contains(e.relatedTarget as Node)
      )
        return;
      wrapperRef.current?.focus({ preventScroll: true });
    },
    [],
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      // Select first cell when focus arrives from outside the table
      if (
        store.getSnapshot() === null &&
        !e.currentTarget.contains(e.relatedTarget)
      ) {
        store.setActiveCell({ row: 0, col: 0, mode: "selected" });
      }
    },
    [store],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Stop React's synthetic event from bubbling to parent DataTable wrappers.
      // React portals propagate events through the React component tree, so without
      // this, an Escape in a nested DataTable would also fire handleKeyDown on every
      // ancestor DataTable, nulling out their activeCells before onExitEdit can restore them.
      e.stopPropagation();

      // Only handle keyboard events that target the wrapper directly. Events from
      // child elements (e.g. editing inputs) bubble here after the cell's own
      // keyboard handler has already processed them and updated the store. Reading
      // the store here would see the already-updated state and double-handle the key.
      if (e.target !== e.currentTarget) return;

      const activeCell = store.getSnapshot();
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
          store.setActiveCell({ ...activeCell, mode: "editing" });
          break;
        case "Escape":
          store.setActiveCell(null);
          break;
      }
    },
    [store, navigate],
  );

  return {
    store,
    wrapperRef,
    navigate,
    selectCell,
    editCell,
    exitEdit,
    handleSentinelFocus,
    handleFocus,
    handleKeyDown,
  };
}
