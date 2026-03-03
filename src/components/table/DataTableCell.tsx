import { memo } from "react";
import { BoolTableCell } from "./BoolTableCell";
import { TextTableCell } from "./TextTableCell";
import { NumberTableCell } from "./NumberTableCell";
import { PopperTableCell } from "./PopperTableCell";
import type { CellProps, ColumnDefinition, TableData } from "./types";

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
        <BoolTableCell {...cellProps} value={value as boolean} onChange={onChange} />
      );
    case "text":
      return (
        <TextTableCell {...cellProps} value={value as string} onChange={onChange} />
      );
    case "number":
      return (
        <NumberTableCell
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
        <PopperTableCell
          {...cellProps}
          triggerText={column.triggerText}
          cellPath={cellPath}
        />
      );
    }
  }
}
