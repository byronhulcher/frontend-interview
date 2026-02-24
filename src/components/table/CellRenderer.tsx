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
  const { state, dispatch, columns, displayData } = useTableContext()
  const { editingCell, internalData } = state

  const column = columns[colIndex]
  const row = displayData[rowIndex]

  // Convert display index to internalData index for mutations
  const internalIndex = internalData.indexOf(row)

  const value = column.accessor ? column.accessor(row) : row[column.key]
  const isEditing =
    editingCell?.row === rowIndex && editingCell?.col === colIndex

  const onCellChange = (newValue: unknown) => {
    dispatch({
      type: "UPDATE_CELL",
      row: internalIndex,
      columnKey: column.key,
      value: newValue,
    })
  }

  const onExitEdit = () => {
    dispatch({ type: "CLEAR_EDIT" })
  }

  const handleDelete = () => {
    dispatch({ type: "DELETE_ROW", row: internalIndex })
  }

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
