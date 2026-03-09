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

  // Track previous isEditing with state (not a ref) so we can detect the
  // false→true transition during render without triggering react-hooks/refs.
  // setState during render is React's supported pattern for derived state.
  const [prevIsEditing, setPrevIsEditing] = useState(false);
  if (isEditing && !prevIsEditing) {
    setEditingValue(value);
  }
  if (isEditing !== prevIsEditing) {
    setPrevIsEditing(isEditing);
  }

  const setLocalValue = useCallback((newValue: T) => {
    setEditingValue(newValue);
  }, []);

  // Use a ref so exitAndCommit stays stable during typing — editingValue
  // changes on every keystroke but we only read it at commit time.
  const editingValueRef = useRef(editingValue);
  useEffect(() => {
    editingValueRef.current = editingValue;
  });

  const exitAndCommit = useCallback(() => {
    onChange?.(isEditing ? editingValueRef.current : value);
    onExitEdit?.();
  }, [isEditing, value, onChange, onExitEdit]);

  const exitAndDiscard = useCallback(() => {
    onExitEdit?.();
  }, [onExitEdit]);

  const { handleKeyDown } = useCellKeyboard({
    onExitEdit: exitAndCommit,
    onNavigate,
    enterNavigates: true,
  });

  useEffect(() => {
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
