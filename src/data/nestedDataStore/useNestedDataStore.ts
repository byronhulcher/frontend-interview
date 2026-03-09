import { useContext } from "react";
import { NestedDataStoreContext } from "./NestedDataStoreContext";
import { noopStore } from "./NestedDataStore";
import type { NestedDataStoreValue } from "./NestedDataStore";

/** Returns the nearest NestedDataStore, or a no-op store when used outside a provider. */
export function useNestedDataStore(): NestedDataStoreValue {
  return useContext(NestedDataStoreContext) ?? noopStore;
}
