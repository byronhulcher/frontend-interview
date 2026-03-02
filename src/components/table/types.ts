export type ColumnType = "text" | "number" | "boolean" | "popper";

export interface TableData {
  [key: string]: unknown;
}

type BaseColumn = {
  key: string;
  header: string;
  accessor?: (row: TableData) => unknown;
};

// Discriminated union so each type only exposes the fields that apply to it.
// TypeScript narrows automatically in switch(column.type) blocks.
export type ColumnDefinition =
  | (BaseColumn & { type: "text" })
  | (BaseColumn & {
      type: "number";
      format?: "currency" | "percentage" | "decimal";
    })
  | (BaseColumn & { type: "boolean" })
  | (BaseColumn & { type: "popper"; triggerText?: string });
