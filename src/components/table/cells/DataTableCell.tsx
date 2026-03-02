import { memo } from "react";
import { BoolCell } from "./BoolCell";
import { TextCell } from "./TextCell";
import { NumberCell } from "./NumberCell";
import { PopperCell } from "./PopperCell";
import type { CellProps } from "./types";
import type { ColumnDefinition, TableData } from "../types";

interface DataTableCellProps extends CellProps {
  column: ColumnDefinition;
  row: TableData;
  rowIndex: number;
  onChange: (value: unknown) => void;
  basePath?: string;
}

export const DataTableCell = memo(DataTableCellComponent);

function DataTableCellComponent({
  column,
  row,
  rowIndex,
  onChange,
  basePath = "",
  ...cellProps
}: DataTableCellProps) {
  const value = column.accessor ? column.accessor(row) : row[column.key];

  switch (column.type) {
    case "boolean":
      return (
        <BoolCell {...cellProps} value={value as boolean} onChange={onChange} />
      );
    case "text":
      return (
        <TextCell {...cellProps} value={value as string} onChange={onChange} />
      );
    case "number":
      return (
        <NumberCell
          {...cellProps}
          value={value as number}
          format={column.format}
          onChange={onChange}
        />
      );
    case "popper": {
      const rowId = String(row.id ?? rowIndex);
      const cellPath = basePath
        ? `${basePath}/${rowId}:${column.key}`
        : `${rowId}:${column.key}`;
      return (
        <PopperCell
          {...cellProps}
          triggerText={column.triggerText}
          cellPath={cellPath}
        />
      );
    }
  }
}
