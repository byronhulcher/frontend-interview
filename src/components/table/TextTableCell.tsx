interface TextTableCellProps {
  value: string
}

export function TextTableCell({ value }: TextTableCellProps) {
  return (
    <div className="max-w-[200px] truncate" title={value}>
      {value}
    </div>
  )
}
