import React from 'react'
import { cn } from '../../utils/cn'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  help?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ label, help, error, className, ...rest }, ref) => {
    return (
      <label className="block">
        {label && (
          <div className="text-xs text-gray-500 mb-1">
            {label}
          </div>
        )}
        <input
          {...rest}
          ref={ref}
          className={cn(
            'w-full h-9 px-3 py-1 rounded-md shadow-sm',
            'transition-all duration-150 ease-in-out',
            error
              ? 'border border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'bg-white text-gray-900 placeholder-gray-400',
            className
          )}
        />
        {error ? (
          <div className="text-red-600 text-xs mt-1">{error}</div>
        ) : help ? (
          <div className="text-gray-500 text-xs mt-1">{help}</div>
        ) : null}
      </label>
    )
  }
)

Input.displayName = 'Input'
