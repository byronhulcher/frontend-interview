import type { TableData } from "../../components/table/types";

export interface NestedDataStoreValue {
  getData: (path: string) => TableData[] | null;
  setData: (path: string, rows: TableData[]) => void;
}

export const noopStore: NestedDataStoreValue = {
  getData: () => null,
  setData: () => {},
};
