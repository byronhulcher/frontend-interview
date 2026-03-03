import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import {
  ActiveCellStore,
  createActiveCellStore,
  useCellState,
} from "./ActiveCellStore";

// ---------------------------------------------------------------------------
// ActiveCellStore (plain class)
// ---------------------------------------------------------------------------

describe("ActiveCellStore", () => {
  it("getSnapshot returns null initially", () => {
    const store = createActiveCellStore();
    expect(store.getSnapshot()).toBeNull();
  });

  it("setActiveCell updates the snapshot", () => {
    const store = createActiveCellStore();
    store.setActiveCell({ row: 1, col: 2, mode: "selected" });
    expect(store.getSnapshot()).toEqual({ row: 1, col: 2, mode: "selected" });
  });

  it("setActiveCell accepts a functional updater", () => {
    const store = createActiveCellStore();
    store.setActiveCell({ row: 0, col: 0, mode: "selected" });
    store.setActiveCell((prev) =>
      prev ? { ...prev, mode: "editing" } : null,
    );
    expect(store.getSnapshot()).toEqual({ row: 0, col: 0, mode: "editing" });
  });

  it("notifies subscribers on setActiveCell", () => {
    const store = createActiveCellStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setActiveCell({ row: 0, col: 0, mode: "selected" });
    expect(listener).toHaveBeenCalledOnce();
  });

  it("unsubscribe removes the listener", () => {
    const store = createActiveCellStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.setActiveCell({ row: 0, col: 0, mode: "selected" });
    expect(listener).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useCellState hook
// ---------------------------------------------------------------------------

describe("useCellState", () => {
  it("returns isSelected=false, isEditing=false when no cell is active", () => {
    const store = createActiveCellStore();
    const { result } = renderHook(() => useCellState(store, 0, 0));
    expect(result.current).toEqual({ isSelected: false, isEditing: false });
  });

  it("returns isSelected=true when this cell is selected", () => {
    const store = createActiveCellStore();
    store.setActiveCell({ row: 1, col: 2, mode: "selected" });
    const { result } = renderHook(() => useCellState(store, 1, 2));
    expect(result.current).toEqual({ isSelected: true, isEditing: false });
  });

  it("returns isEditing=true when this cell is editing", () => {
    const store = createActiveCellStore();
    store.setActiveCell({ row: 1, col: 2, mode: "editing" });
    const { result } = renderHook(() => useCellState(store, 1, 2));
    expect(result.current).toEqual({ isSelected: true, isEditing: true });
  });

  it("returns false for a different cell", () => {
    const store = createActiveCellStore();
    store.setActiveCell({ row: 0, col: 0, mode: "selected" });
    const { result } = renderHook(() => useCellState(store, 1, 1));
    expect(result.current).toEqual({ isSelected: false, isEditing: false });
  });

  it("reacts to store changes", () => {
    const store = createActiveCellStore();
    const { result } = renderHook(() => useCellState(store, 0, 0));
    expect(result.current.isSelected).toBe(false);

    act(() => store.setActiveCell({ row: 0, col: 0, mode: "selected" }));
    expect(result.current.isSelected).toBe(true);

    act(() => store.setActiveCell({ row: 0, col: 0, mode: "editing" }));
    expect(result.current.isEditing).toBe(true);

    act(() => store.setActiveCell(null));
    expect(result.current.isSelected).toBe(false);
  });

  it("does not report changes when a different cell's state changes", () => {
    const store = createActiveCellStore();
    const renderCount = { current: 0 };
    renderHook(() => {
      renderCount.current++;
      return useCellState(store, 1, 1);
    });
    const initialRenders = renderCount.current;

    // Selecting a different cell should not cause cell (1,1) to re-render
    act(() => store.setActiveCell({ row: 0, col: 0, mode: "selected" }));
    expect(renderCount.current).toBe(initialRenders);
  });
});
