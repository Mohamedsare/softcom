import React from 'react'
import { twMerge } from 'tailwind-merge'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => (
    <div className="w-full">
      <input
        type={type}
        ref={ref}
        className={twMerge(
          'flex w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 py-3 text-base text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800',
          error && 'border-[var(--danger)] focus:ring-[var(--danger)]',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
