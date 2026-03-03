import { memo, useCallback } from "react"
import { useTableStableContext } from "./context/TableStableContext"
import { BoolTableCell } from "./BoolTableCell"
import { TextTableCell } from "./TextTableCell"
import { NumberTableCell } from "./NumberTableCell"
import { PopperTableCell } from "./PopperTableCell"
import type { ColumnDefinition, TableData } from "./types"

interface CellRendererProps {
  column: ColumnDefinition
  row: TableData
  internalRowIndex: number
  isEditing: boolean
}

export const CellRenderer = memo(function CellRenderer({
  column,
  row,
  internalRowIndex,
  isEditing,
}: CellRendererProps) {
  const { dispatch } = useTableStableContext()
  const value = column.accessor ? column.accessor(row) : row[column.key]

  const onCellChange = useCallback(
    (newValue: unknown) => {
      dispatch({
        type: "UPDATE_CELL",
        row: internalRowIndex,
        columnKey: column.key,
        value: newValue,
      })
    },
    [dispatch, internalRowIndex, column.key],
  )

  const onExitEdit = useCallback(() => {
    dispatch({ type: "CLEAR_EDIT" })
  }, [dispatch])

  const handleDelete = useCallback(() => {
    dispatch({ type: "DELETE_ROW", row: internalRowIndex })
  }, [dispatch, internalRowIndex])

  switch (column.type) {
    case "boolean":
      return (
        <BoolTableCell
          value={value as boolean}
          isEditing={isEditing}
          onCellChange={onCellChange}
          onExitEdit={onExitEdit}
        />
      )
    case "text":
      return (
        <TextTableCell
          value={value as string}
          isEditing={isEditing}
          onCellChange={onCellChange}
          onExitEdit={onExitEdit}
        />
      )
    case "number":
      return (
        <NumberTableCell
          value={value as number}
          format={column.format}
          isEditing={isEditing}
          onCellChange={onCellChange}
          onExitEdit={onExitEdit}
        />
      )
    case "popper":
      return (
        <PopperTableCell
          value={value as string}
          rowId={row.id as string}
          triggerText={column.triggerText}
          label={row.name as string}
          isEditing={isEditing}
          onExitEdit={onExitEdit}
          onDeleteRow={handleDelete}
        />
      )
    default:
      return <>{String(value)}</>
  }
})
