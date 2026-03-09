// Navigation types for keyboard-driven cell interaction
export type CellMode = "selected" | "editing";

export type ActiveCell = {
  row: number;
  col: number;
  mode: CellMode;
} | null;

export type NavigationDirection =
  | "up"
  | "down"
  | "left"
  | "right"
  | "next"
  | "prev";
