import { Outlet } from 'react-router-dom'
import { RequireSuperAdmin } from '@/components/guards/RequireSuperAdmin'

export function AdminLayout() {
  return (
    <RequireSuperAdmin>
      <Outlet />
    </RequireSuperAdmin>
  )
}
