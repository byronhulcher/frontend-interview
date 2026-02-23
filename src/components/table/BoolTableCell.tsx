interface BoolTableCellProps {
  value: boolean
}

export function BoolTableCell({ value }: BoolTableCellProps) {
  return (
    <div className="flex items-center justify-center">
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
          value
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {value ? "✓ True" : "✗ False"}
      </span>
    </div>
  )
}
