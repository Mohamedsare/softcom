import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium min-h-[24px] min-w-[24px] justify-center',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-[var(--text-secondary)] dark:bg-slate-800 dark:text-slate-300',
        accent: 'bg-orange-500/10 text-[var(--accent)]',
        success: 'bg-[var(--success)]/10 text-[var(--success)]',
        danger: 'bg-[var(--danger)]/10 text-[var(--danger)]',
        warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
        outline: 'border border-[var(--border-solid)] text-[var(--text-secondary)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={twMerge(clsx(badgeVariants({ variant }), className))}
      {...props}
    />
  )
)
Badge.displayName = 'Badge'
