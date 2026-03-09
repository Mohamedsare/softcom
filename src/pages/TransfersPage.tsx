import { Card, PageHeader } from '@/components/ui'

export function TransfersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Transferts" description="Transferts de stock entre boutiques" />
      <Card>
        <div className="p-8 text-center text-[var(--text-muted)]">
          Module transferts — à venir.
        </div>
      </Card>
    </div>
  )
}
