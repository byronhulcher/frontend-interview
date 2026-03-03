import { useCallback, useSyncExternalStore } from "react";
import type { ActiveCell } from "./types";

type Listener = () => void;
type CellStateTag = "none" | "selected" | "editing";

export class ActiveCellStore {
  private cell: ActiveCell = null;
  private listeners = new Set<Listener>();

  getSnapshot = (): ActiveCell => this.cell;

  setActiveCell = (
    cellOrUpdater: ActiveCell | ((prev: ActiveCell) => ActiveCell),
  ): void => {
    this.cell =
      typeof cellOrUpdater === "function"
        ? cellOrUpdater(this.cell)
        : cellOrUpdater;
    this.listeners.forEach((l) => l());
  };

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

export function createActiveCellStore(): ActiveCellStore {
  return new ActiveCellStore();
}

/**
 * Subscribes a cell to the store and returns its derived selection state.
 * Uses a primitive string selector so `useSyncExternalStore` only triggers
 * a re-render when this specific cell's state actually changes.
 */
export function useCellState(
  store: ActiveCellStore,
  rowIndex: number,
  colIndex: number,
): { isSelected: boolean; isEditing: boolean } {
  const selector = useCallback((): CellStateTag => {
    const ac = store.getSnapshot();
    if (ac && ac.row === rowIndex && ac.col === colIndex) {
      return ac.mode; // "selected" | "editing"
    }
    return "none";
  }, [store, rowIndex, colIndex]);

  const state = useSyncExternalStore(store.subscribe, selector);

  return { isSelected: state !== "none", isEditing: state === "editing" };
}
