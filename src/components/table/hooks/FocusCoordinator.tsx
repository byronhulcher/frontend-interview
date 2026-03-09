import { createContext, useContext, useRef, useMemo } from "react";

interface FocusCoordinator {
  /** Declare intent to focus this wrapper. Other wrappers will yield. */
  claimFocus: (wrapper: HTMLElement) => void;
  /** Returns true if no competing claim exists, or the claim is for this wrapper. */
  canFocus: (wrapper: HTMLElement) => boolean;
  /** Clear the pending claim after focus has been applied. */
  releaseClaim: () => void;
}

const FocusCoordinatorContext = createContext<FocusCoordinator | null>(null);

export function FocusCoordinatorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingRef = useRef<HTMLElement | null>(null);

  const coordinator = useMemo<FocusCoordinator>(
    () => ({
      claimFocus: (wrapper) => {
        pendingRef.current = wrapper;
      },
      canFocus: (wrapper) =>
        pendingRef.current === null || pendingRef.current === wrapper,
      releaseClaim: () => {
        pendingRef.current = null;
      },
    }),
    [],
  );

  return (
    <FocusCoordinatorContext.Provider value={coordinator}>
      {children}
    </FocusCoordinatorContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFocusCoordinator(): FocusCoordinator | null {
  return useContext(FocusCoordinatorContext);
}
