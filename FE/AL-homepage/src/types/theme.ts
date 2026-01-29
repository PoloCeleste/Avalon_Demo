// src/types/theme.ts
export type ColorScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

export type ThemeColor = 'primary' | 'success' | 'warning' | 'danger' | 'gray'

export type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'

export type FontWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold'

export type SpaceSize =
  | 'px'
  | 0
  | 0.5
  | 1
  | 1.5
  | 2
  | 2.5
  | 3
  | 3.5
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 12
  | 16
  | 20
  | 24

export type RadiusSize = 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'

export interface ThemeConfig {
  colors: {
    [K in ThemeColor]: {
      [S in ColorScale]?: string
    }
  } & {
    white: string
    black: string
  }

  spacing: Record<SpaceSize, string>
  borderRadius: Record<RadiusSize, string>
  fontSize: Record<TextSize, string>
  fontWeight: Record<FontWeight, number>
}
