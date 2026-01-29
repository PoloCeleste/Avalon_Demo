import React from 'react'
import { cn } from '../../utils/cn'

interface Option {
  value: string | number
  label: string
}
interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Option[]
  error?: string
}

export function Select({ label, options = [], error, className, ...rest }: Props) {
  return (
    <label className="block">
      {label && (
        <div className="text-xs text-gray-500 mb-1">
          {label}
        </div>
      )}
      <div className="relative shadow-sm">
        <select
          {...rest}
          className={cn(
            'w-full h-9 px-3 py-1 rounded-md shadow-sm',
            'transition-all duration-150 ease-in-out',
            error
              ? 'border border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'bg-white text-gray-900 placeholder-gray-400',
            'appearance-none pr-8', // Custom arrow space
            className
          )}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {error && (
        <div className="text-red-600 text-xs mt-1">{error}</div>
      )}
    </label>
  )
}
