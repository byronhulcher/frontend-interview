import type React from "react";
import { useCallback } from "react";
import type { NavigationDirection } from "../../hooks/types";

interface UseCellKeyboardOptions {
  onExitEdit?: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
  enterNavigates?: boolean;
}

export function useCellKeyboard({
  onExitEdit,
  onNavigate,
  enterNavigates = false,
}: UseCellKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onExitEdit?.();
          break;
        case "Enter":
          if (enterNavigates) {
            e.preventDefault();
            onExitEdit?.();
            onNavigate?.("down");
          }
          break;
        case "Tab":
          e.preventDefault();
          onExitEdit?.();
          onNavigate?.(e.shiftKey ? "prev" : "next");
          break;
      }
    },
    [onExitEdit, onNavigate, enterNavigates]
  );
  return { handleKeyDown };
}
