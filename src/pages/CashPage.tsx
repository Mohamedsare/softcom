import { Card, PageHeader } from '@/components/ui'
import { RequirePermission } from '@/components/guards/RequirePermission'
import { PERMISSIONS } from '@/constants/permissions'

export function CashPage() {
  return (
    <RequirePermission
      permission={PERMISSIONS.cash_open_close}
      fallback={<p className="p-4 text-[var(--text-muted)]">Vous n'avez pas accès à la caisse.</p>}
    >
      <div className="space-y-6">
        <PageHeader title="Caisse" description="Sessions caisse et mouvements" />
        <Card>
          <div className="p-8 text-center text-[var(--text-muted)]">
            Module caisse — à venir.
          </div>
        </Card>
      </div>
    </RequirePermission>
  )
}
