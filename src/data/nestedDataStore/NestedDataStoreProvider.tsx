import { useCallback, useRef } from "react";
import type React from "react";
import { NestedDataStoreContext } from "./NestedDataStoreContext";
import type { TableData } from "../../components/table/types";

export function NestedDataStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = useRef<Map<string, TableData[]>>(new Map());

  // Stable callbacks: backed by a ref so they never cause re-renders in consumers.
  const getData = useCallback((path: string): TableData[] | null => {
    return store.current.get(path) ?? null;
  }, []);

  const setData = useCallback((path: string, rows: TableData[]) => {
    store.current.set(path, rows);
  }, []);

  return (
    <NestedDataStoreContext.Provider value={{ getData, setData }}>
      {children}
    </NestedDataStoreContext.Provider>
  );
}
