import * as React from 'react'
import { cn } from '../../utils/cn' // cn 유틸리티가 필요합니다.

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    // 값이 0 미만이거나 100 초과가 되지 않도록 보정
    const safeValue = Math.max(0, Math.min(100, value || 0))

    return (
      <div
        ref={ref}
        className={cn('relative h-4 w-full overflow-hidden rounded-full bg-gray-200', className)}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-blue-600 transition-all"
          style={{ transform: `translateX(-${100 - safeValue}%)` }}
        />
      </div>
    )
  },
)
Progress.displayName = 'Progress'

export { Progress }
