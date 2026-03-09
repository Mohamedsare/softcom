import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCompany } from '@/context/CompanyContext'
import type { PermissionKey } from '@/constants/permissions'

/**
 * Resolves user permissions for the current company from roles.
 * In a full implementation, this would query user_company_roles + role_permissions
 * or use an RPC. For now we assume permissions are loaded with the app (e.g. from a me/permissions endpoint).
 */
export function usePermissions(): { hasPermission: (key: PermissionKey) => boolean; isSuperAdmin: boolean } {
  const { profile } = useAuth()
  const { currentCompanyId } = useCompany()

  return useMemo(() => {
    const isSuperAdmin = profile?.is_super_admin ?? false
    const hasPermission = (_key: PermissionKey): boolean => {
      if (isSuperAdmin) return true
      if (!currentCompanyId) return false
      // TODO: load role permissions for current user + company and check key
      // For now allow all for any authenticated user with a company (demo)
      return true
    }
    return { hasPermission, isSuperAdmin }
  }, [profile?.is_super_admin, currentCompanyId])
}
