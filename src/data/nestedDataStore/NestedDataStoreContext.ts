import { createContext } from "react";
import type { NestedDataStoreValue } from "./NestedDataStore";

export const NestedDataStoreContext = createContext<NestedDataStoreValue | null>(
  null
);
