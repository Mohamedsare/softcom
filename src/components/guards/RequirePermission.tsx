import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import type { PermissionKey } from '@/constants/permissions'

interface RequirePermissionProps {
  permission: PermissionKey
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
