import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCompany } from '@/context/CompanyContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, PageHeader } from '@/components/ui'
import { ROUTES } from '@/routes'
import { Plus, Store, Pencil, ShoppingCart } from 'lucide-react'
import { getStoresByCompany } from '@/features/stores/api/storesService'
import type { StoreEdit } from '@/features/stores/components/EditStoreDialog'
import { CreateStoreForm } from '@/features/stores/components/CreateStoreForm'
import { EditStoreDialog } from '@/features/stores/components/EditStoreDialog'
import { toast } from 'sonner'

export function StoresPage() {
  const queryClient = useQueryClient()
  const { stores, currentCompanyId, companies, refreshStores, refreshCompanies } = useCompany()
  const [showCreate, setShowCreate] = useState(false)
  const [editingStore, setEditingStore] = useState<StoreEdit | null>(null)
  const company = companies.find((c) => c.id === currentCompanyId)
  const quota = company?.store_quota ?? 3
  const canCreate = company && (stores.length === 0 || stores.length < quota)

  const { data: fullStores = stores } = useQuery({
    queryKey: ['stores-full', currentCompanyId],
    queryFn: () => getStoresByCompany(currentCompanyId!),
    enabled: !!currentCompanyId,
  })

  const handleCreated = async () => {
    setShowCreate(false)
    queryClient.invalidateQueries({ queryKey: ['stores-full', currentCompanyId!] })
    await refreshStores()
    await refreshCompanies()
    toast.success('Boutique créée')
  }

  const handleUpdated = async () => {
    setEditingStore(null)
    queryClient.invalidateQueries({ queryKey: ['stores-full', currentCompanyId!] })
    await refreshStores()
    await refreshCompanies()
    toast.success('Boutique mise à jour')
  }

  const storeList: Array<StoreEdit | (typeof stores)[number]> =
    fullStores.length > 0 ? fullStores : stores

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boutiques"
        description={company ? `${company.name} — Quota : ${company.store_quota} boutique(s). ${stores.length} créée(s).` : undefined}
        actions={
          canCreate && !showCreate && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle boutique</span>
            </Button>
          )
        }
      />
      {showCreate && currentCompanyId && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Créer une boutique</h2>
          <CreateStoreForm companyId={currentCompanyId} onSuccess={handleCreated} onCancel={() => setShowCreate(false)} />
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {storeList.length === 0 && !showCreate ? (
          <Card className="col-span-full p-8 text-center text-[var(--text-muted)]">
            Aucune boutique. {canCreate ? 'Cliquez sur "Nouvelle boutique".' : 'Quota atteint : demandez une augmentation.'}
          </Card>
        ) : (
          storeList.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-7 w-7 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)]">{s.name}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{s.code ?? '—'}</p>
                  {s.address && <p className="mt-1 text-xs text-[var(--text-secondary)]">{s.address}</p>}
                  {s.phone && <p className="text-xs text-[var(--text-secondary)]">{s.phone}</p>}
                  {s.email && <p className="text-xs text-[var(--text-secondary)]">{s.email}</p>}
                  {s.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--text-muted)]">{s.description}</p>
                  )}
                </div>
              </div>
              <div className="flex border-t border-[var(--border-solid)]">
                <Link
                  to={ROUTES.pos(s.id)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 border-r border-[var(--border-solid)] text-sm font-medium text-[var(--accent)] hover:bg-orange-500/5 touch-manipulation"
                >
                  <ShoppingCart className="h-4 w-4" />
                  POS
                </Link>
                <button
                  type="button"
                  onClick={() => setEditingStore(s)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
      {editingStore && (
        <EditStoreDialog
          store={editingStore}
          open={!!editingStore}
          onClose={() => setEditingStore(null)}
          onSuccess={handleUpdated}
        />
      )}
    </div>
  )
}
