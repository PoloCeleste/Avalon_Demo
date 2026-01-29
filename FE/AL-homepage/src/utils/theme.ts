// src/utils/theme.ts
export function getCSSVariable(variable: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
}

export function setCSSVariable(variable: string, value: string): void {
  if (typeof window === 'undefined') return
  document.documentElement.style.setProperty(variable, value)
}

// 테마 토큰 헬퍼
export const theme = {
  color: {
    bg: 'var(--color-bg)',
    surface: 'var(--color-surface)',
    textPrimary: 'var(--color-text-primary)',
    textSecondary: 'var(--color-text-secondary)',
    brand: 'var(--color-brand)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    border: 'var(--color-border-primary)',
  },

  space: {
    xs: 'var(--space-1)', // 4px
    sm: 'var(--space-2)', // 8px
    md: 'var(--space-4)', // 16px
    lg: 'var(--space-6)', // 24px
    xl: 'var(--space-8)', // 32px
    '2xl': 'var(--space-12)', // 48px
  },

  text: {
    xs: 'var(--text-xs)',
    sm: 'var(--text-sm)',
    base: 'var(--text-base)',
    lg: 'var(--text-lg)',
    xl: 'var(--text-xl)',
    '2xl': 'var(--text-2xl)',
    '3xl': 'var(--text-3xl)',
  },

  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
  },

  shadow: {
    sm: 'var(--shadow-sm)',
    base: 'var(--shadow)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
  },
} as const

// 타입 안전한 스타일 빌더
export function createThemeStyle(styles: Record<string, string>): React.CSSProperties {
  return styles as React.CSSProperties
}
