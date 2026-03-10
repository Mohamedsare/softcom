import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { useCompany } from '@/context/CompanyContext'
import { getMyPermissionKeys } from '@/features/users/api/usersApi'
import type { PermissionKey } from '@/constants/permissions'

/**
 * Droits de l'utilisateur pour l'entreprise courante (selon son rôle).
 * Super_admin a toutes les permissions. Sinon on utilise get_my_permission_keys (RPC).
 */
export function usePermissions(): { hasPermission: (key: PermissionKey) => boolean; isSuperAdmin: boolean } {
  const { profile } = useAuth()
  const { currentCompanyId } = useCompany()

  const { data: permissionKeys = [] } = useQuery({
    queryKey: ['my-permission-keys', currentCompanyId],
    queryFn: () => getMyPermissionKeys(currentCompanyId!),
    enabled: !!currentCompanyId && !(profile?.is_super_admin),
  })

  return useMemo(() => {
    const isSuperAdmin = profile?.is_super_admin ?? false
    const keySet = new Set(permissionKeys)
    const hasPermission = (key: PermissionKey): boolean => {
      if (isSuperAdmin) return true
      if (!currentCompanyId) return false
      return keySet.has(key)
    }
    return { hasPermission, isSuperAdmin }
  }, [profile?.is_super_admin, currentCompanyId, permissionKeys])
}
