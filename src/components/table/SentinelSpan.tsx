import { forwardRef } from "react"

interface SentinelSpanProps {
  onFocus: (e: React.FocusEvent<HTMLSpanElement>) => void
}

export const SentinelSpan = forwardRef<HTMLSpanElement, SentinelSpanProps>(
  ({ onFocus }, ref) => (
    <span
      ref={ref}
      tabIndex={0}
      onFocus={onFocus}
      aria-hidden="true"
      className="sr-only"
    />
  ),
)
SentinelSpan.displayName = "SentinelSpan"
