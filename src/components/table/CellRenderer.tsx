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
  const { state, dispatch, columns } = useTableContext()
  const { editingCell, internalData } = state

  const column = columns[colIndex]
  const row = internalData[rowIndex]

  const value = column.accessor ? column.accessor(row) : row[column.key]
  const isEditing =
    editingCell?.row === rowIndex && editingCell?.col === colIndex

  const onCellChange = (newValue: unknown) => {
    dispatch({
      type: "UPDATE_CELL",
      row: rowIndex,
      columnKey: column.key,
      value: newValue,
    })
  }

  const onExitEdit = () => {
    dispatch({ type: "CLEAR_EDIT" })
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
          onDeleteRow={() => dispatch({ type: "DELETE_ROW", row: rowIndex })}
        />
      )
    default:
      return <>{String(value)}</>
  }
}
