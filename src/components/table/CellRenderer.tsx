import { useCallback } from "react"
import { useTableContext } from "./TableContext"
import { BoolTableCell } from "./BoolTableCell"
import { TextTableCell } from "./TextTableCell"
import { NumberTableCell } from "./NumberTableCell"
import { PopperTableCell } from "./PopperTableCell"

interface CellRendererProps {
  rowIndex: number
  colIndex: number
}

export function CellRenderer({ rowIndex, colIndex }: CellRendererProps) {
  const {
    columns,
    displayData,
    internalIndexMap,
    state: { editingCell },
    dispatch,
  } = useTableContext()

  const column = columns[colIndex]
  const row = displayData[rowIndex]

  const internalRowIndex = internalIndexMap.get(row) ?? -1

  const value = column.accessor ? column.accessor(row) : row[column.key]
  const isEditing =
    editingCell?.row === rowIndex && editingCell?.col === colIndex

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
          triggerText={column.triggerText}
          isEditing={isEditing}
          onExitEdit={onExitEdit}
          onDeleteRow={handleDelete}
        />
      )
    default:
      return <>{String(value)}</>
  }
}
