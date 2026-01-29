import React from 'react'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'subtle' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  const sizeClasses = {
    sm: 'h-8 px-2 text-sm', // height: 32px, padding: 0 10px, fontSize: 13px
    md: 'h-9 px-3 text-sm', // height: 36px, padding: 0 12px, fontSize: 14px
    lg: 'h-10 px-3.5 text-base', // height: 40px, padding: 0 14px, fontSize: 15px
  }

  const variantClasses = {
    primary: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
    outline: 'bg-transparent text-gray-700 border-gray-300 hover:bg-gray-100',
    ghost: 'bg-transparent text-gray-700 border-transparent hover:bg-gray-100',
    danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
    subtle: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
    destructive: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
  }

  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2 font-semibold rounded-md cursor-pointer',
    'transition-colors duration-150 ease-in-out',
    block ? 'w-full' : '',
    sizeClasses[size],
    variantClasses[variant],
    disabled || loading ? 'opacity-60 cursor-not-allowed' : '',
    className
  )

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={baseClasses}
    >
      {loading && (
        <span
          className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"
          aria-hidden
        />
      )}
      {children}
    </button>
  )
}
