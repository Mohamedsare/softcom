import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import type { PermissionKey } from '@/constants/permissions'

interface RequirePermissionProps {
  /** Une permission ou un tableau (accès si au moins une présente) */
  permission: PermissionKey | PermissionKey[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
  const { hasPermission } = usePermissions()
  const allowed = Array.isArray(permission)
    ? permission.some((p) => hasPermission(p))
    : hasPermission(permission)

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
