import React from 'react'
import { cn } from '../../utils/cn'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const map: Record<Tone, { bg: string; color: string; border: string }> = {
  neutral: {
    bg: 'var(--color-surface-2)',
    color: 'var(--color-text)',
    border: 'var(--color-border)',
  },
  primary: {
    bg: 'rgba(25,113,194,.10)',
    color: 'var(--color-primary)',
    border: 'rgba(25,113,194,.25)',
  },
  success: {
    bg: 'rgba(43,138,62,.10)',
    color: 'var(--color-success)',
    border: 'rgba(43,138,62,.25)',
  },
  warning: {
    bg: 'rgba(245,159,0,.12)',
    color: 'var(--color-warning)',
    border: 'rgba(245,159,0,.25)',
  },
  danger: {
    bg: 'rgba(224,49,49,.12)',
    color: 'var(--color-danger)',
    border: 'rgba(224,49,49,.25)',
  },
  info: {
    bg: 'rgba(0,150,199,.10)',
    color: 'var(--color-info)',
    border: 'rgba(0,150,199,.25)',
  },
}

export function Badge({
  tone = 'neutral',
  children,
  style,
  className,
}: {
  tone?: Tone
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) {
  const t = map[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center h-[22px] px-2 text-xs rounded-full font-semibold',
        className
      )}
      style={{
        border: `1px solid ${t.border}`,
        background: t.bg,
        color: t.color,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
