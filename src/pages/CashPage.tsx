import { Card, PageHeader } from '@/components/ui'

export function CashPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Caisse" description="Sessions caisse et mouvements" />
      <Card>
        <div className="p-8 text-center text-[var(--text-muted)]">
          Module caisse — à venir.
        </div>
      </Card>
    </div>
  )
}
