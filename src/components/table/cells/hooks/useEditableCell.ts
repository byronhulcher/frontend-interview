import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useCellKeyboard } from "./useCellKeyboard";
import type { NavigationDirection } from "../../hooks/types";

interface UseEditableCellOptions<T> {
  value: T;
  isEditing: boolean;
  onChange?: (value: T) => void;
  onExitEdit?: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
}

export function useEditableCell<T, E extends HTMLElement = HTMLInputElement>({
  value,
  isEditing,
  onChange,
  onExitEdit,
  onNavigate,
}: UseEditableCellOptions<T>) {
  const [editingValue, setEditingValue] = useState(value);
  const inputRef = useRef<E>(null);
  const wasEditingRef = useRef(false);

  const setLocalValue = useCallback((newValue: T) => {
    setEditingValue(newValue);
  }, []);

  const exitAndCommit = useCallback(() => {
    onChange?.(isEditing ? editingValue : value);
    onExitEdit?.();
  }, [isEditing, editingValue, value, onChange, onExitEdit]);

  const exitAndDiscard = useCallback(() => {
    onExitEdit?.();
  }, [onExitEdit]);

  const { handleKeyDown } = useCellKeyboard({
    onExitEdit: exitAndCommit,
    onNavigate,
    enterNavigates: true,
  });

  useEffect(() => {
    // Reset to the current prop value only on the false→true transition
    // so stale discarded edits don't reappear, without overwriting
    // in-progress edits when the prop value changes externally.
    if (isEditing && !wasEditingRef.current) {
      setEditingValue(value);
    }
    wasEditingRef.current = isEditing;

    if (isEditing) {
      // preventScroll stops Chrome from scrolling the input into view
      inputRef.current?.focus({ preventScroll: true });
      // Only select text for input elements, not select elements
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing, value]);

  // Return prop value when not editing, editing value when editing
  const localValue = useMemo(
    () => (isEditing ? editingValue : value),
    [isEditing, editingValue, value],
  );

  return { localValue, setLocalValue, inputRef, handleKeyDown, exitAndCommit, exitAndDiscard };
}
