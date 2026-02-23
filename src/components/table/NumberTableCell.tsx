interface NumberTableCellProps {
  value: number
  format?: "currency" | "percentage" | "decimal"
}

export function NumberTableCell({ value, format }: NumberTableCellProps) {
  const formatValue = () => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value)
      case "percentage":
        // Assume value is 0-100, just add % sign
        return `${value.toFixed(2)}%`
      case "decimal":
        return value.toFixed(2)
      default:
        return value.toLocaleString()
    }
  }

  return <div className="text-right font-mono">{formatValue()}</div>
}
