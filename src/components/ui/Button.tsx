import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] min-w-[44px] touch-manipulation',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
        secondary:
          'border border-[var(--border-solid)] bg-transparent text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-slate-800',
        ghost:
          'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800',
        danger:
          'bg-[var(--danger)] text-white hover:opacity-90',
      },
      size: {
        sm: 'h-10 px-3 text-sm min-h-[44px]',
        md: 'h-12 px-4 text-sm',
        lg: 'h-14 px-6 text-base',
        icon: 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={twMerge(clsx(buttonVariants({ variant, size, className })))}
      {...props}
    />
  )
)
Button.displayName = 'Button'
