import React from 'react'
import { twMerge } from 'tailwind-merge'

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, actions, className, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge(
        'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-bold text-[var(--text-primary)] sm:text-lg md:text-xl lg:text-2xl break-words">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-[11px] sm:text-xs md:text-sm text-[var(--text-muted)] break-words line-clamp-2">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </div>
  )
)
PageHeader.displayName = 'PageHeader'
