import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ─── Registry ────────────────────────────────────────────────────────────────

interface Entry {
  getElement: () => Element | null;
  setFocused: (v: boolean) => void;
  onClose: () => void;
  parentId: string | null;
  childIds: Set<string>;
  wasFocused: boolean;
}

const registry = new Map<string, Entry>();
let focusinHandler: ((e: Event) => void) | null = null;
let focusoutHandler: (() => void) | null = null;
let blurTimeout: ReturnType<typeof setTimeout> | null = null;

function isInLogicalSubtree(id: string, el: Element): boolean {
  const entry = registry.get(id);
  if (!entry) return false;
  if (entry.getElement()?.contains(el)) return true;
  for (const childId of entry.childIds) {
    if (isInLogicalSubtree(childId, el)) return true;
  }
  return false;
}

function notifyFocusChange() {
  const active = document.activeElement;
  const hasFocus = active != null && active !== document.body;

  // Build focus path: all entries whose logical subtree contains the active element
  const focusPath = new Set<string>();
  if (hasFocus) {
    for (const [id] of registry) {
      if (isInLogicalSubtree(id, active!)) focusPath.add(id);
    }
  }

  // Only fire onClose when focus has moved to a KNOWN registered element.
  // If focus lands on an untracked element (e.g. Radix's PopoverContent
  // container, a close button, or elements outside the table), we skip onClose
  // and let Radix's own onFocusOutside handle those cases.  Without this guard,
  // Radix's setTimeout fallback (which focuses the scope container when nothing
  // else is focused) would immediately close the popper on open.
  const focusMovedToKnownElement = focusPath.size > 0;

  for (const [id, entry] of registry) {
    const inPath = focusPath.has(id);
    const wasFocused = entry.wasFocused;
    entry.wasFocused = inPath;
    entry.setFocused(inPath);
    if (!inPath && wasFocused && focusMovedToKnownElement) {
      entry.onClose();
    }
  }
}

function addListeners() {
  focusinHandler = () => notifyFocusChange();
  focusoutHandler = () => {
    if (blurTimeout) clearTimeout(blurTimeout);
    // Defer so focusin on the next element fires first — critical for portal
    // crossings where relatedTarget is null and activeElement briefly shows <body>.
    blurTimeout = setTimeout(notifyFocusChange, 0);
  };
  document.addEventListener("focusin", focusinHandler);
  document.addEventListener("focusout", focusoutHandler);
}

function removeListeners() {
  if (focusinHandler) {
    document.removeEventListener("focusin", focusinHandler);
    focusinHandler = null;
  }
  if (focusoutHandler) {
    document.removeEventListener("focusout", focusoutHandler);
    focusoutHandler = null;
  }
  if (blurTimeout) {
    clearTimeout(blurTimeout);
    blurTimeout = null;
  }
}

function register(
  id: string,
  entry: Omit<Entry, "childIds" | "wasFocused">,
): () => void {
  const full: Entry = { ...entry, childIds: new Set(), wasFocused: false };
  registry.set(id, full);
  if (entry.parentId) registry.get(entry.parentId)?.childIds.add(id);
  // Adopt entries that registered before us with us as their parent.
  // useLayoutEffect runs children-first, so a child may register before
  // its parent exists in the registry.
  for (const [otherId, otherEntry] of registry) {
    if (otherId !== id && otherEntry.parentId === id) {
      full.childIds.add(otherId);
    }
  }
  if (!focusinHandler) addListeners();
  return () => {
    registry.delete(id);
    if (entry.parentId) registry.get(entry.parentId)?.childIds.delete(id);
    if (registry.size === 0) removeListeners();
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

// Propagates the nearest ancestor wrapper's ID through the React tree.
// React Context works across portals (React tree ≠ DOM tree), so this correctly
// links popper children to their logical parent cell even across Radix portals.
const FocusWithinContext = createContext<string | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────

let nextId = 0;

export interface UseFocusWithinReturn {
  isFocusedWithin: boolean;
  /**
   * Attach to the DOM element you want to track for direct focus detection.
   * When any element you track (or any registered logical child) has focus,
   * isFocusedWithin will be true.
   */
  ref: (el: HTMLElement | null) => void;
  /**
   * Wrap any content that should be in this cell's logical subtree.
   * Renders no DOM element — pure React Context provider.
   * Required for portal children (e.g. popper inner tables) to register
   * as logical descendants and propagate isFocusedWithin correctly.
   */
  Wrapper: React.FC<{ children: ReactNode }>;
}

export function useFocusWithin(options?: {
  /**
   * Called when focus moves outside this cell's logical subtree.
   * Use to close a popper: `onClose: () => setOpen(false)`.
   * Does not need to be stable — stored in a ref internally.
   */
  onClose?: () => void;
}): UseFocusWithinReturn {
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const parentId = useContext(FocusWithinContext);
  const id = useRef(`fw-${nextId++}`).current;
  const elementRef = useRef<HTMLElement | null>(null);

  // Keep onClose in a ref so the registry always calls the latest version
  // without needing to re-register when the callback changes.
  const onCloseRef = useRef(options?.onClose);
  useEffect(() => {
    onCloseRef.current = options?.onClose;
  });

  // useLayoutEffect fires synchronously after DOM mutations, before paint.
  // This ensures inner cells are registered before Radix's onOpenAutoFocus
  // fires (which runs in a useEffect and focuses the first inner element).
  // Without this, the logical subtree looks empty when the first focusin fires,
  // causing onClose to trigger immediately and close the popper.
  useLayoutEffect(() => {
    return register(id, {
      getElement: () => elementRef.current,
      setFocused: setIsFocusedWithin,
      onClose: () => onCloseRef.current?.(),
      parentId,
    });
  }, [id, parentId]);

  // Stable callback ref — attaches to the DOM element to track for direct focus.
  const ref = useCallback((el: HTMLElement | null) => {
    elementRef.current = el;
  }, []);

  // Stable Wrapper component — renders as pure React Context, no DOM element.
  const Wrapper = useMemo(
    () =>
      function FocusWithinWrapper({ children }: { children: ReactNode }) {
        return (
          <FocusWithinContext.Provider value={id}>
            {children}
          </FocusWithinContext.Provider>
        );
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { isFocusedWithin, ref, Wrapper };
}
