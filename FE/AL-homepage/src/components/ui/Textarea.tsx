// src/components/ui/Textarea.tsx
import * as React from 'react'
// ✨ 1. TextareaAutosize와 함께 props 타입도 import 합니다.
import TextareaAutosize, { type TextareaAutosizeProps } from 'react-textarea-autosize'
import { cn } from '../../utils/cn'

// ✨ 2. 우리 컴포넌트의 props를 라이브러리의 props 타입으로 정의합니다.
export type TextareaProps = TextareaAutosizeProps

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextareaAutosize
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }