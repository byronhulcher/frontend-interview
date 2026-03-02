import type { NavigationDirection } from "../hooks/types";

export type CellProps = {
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onExitEdit: () => void;
  onNavigate: (direction: NavigationDirection) => void;
};
