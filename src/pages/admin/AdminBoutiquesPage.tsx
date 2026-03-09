import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Button, PageHeader } from '@/components/ui'
import {
  adminListCompanies,
  adminListStores,
  adminUpdateStore,
  adminDeleteStore,
} from '@/features/admin/api/adminApi'
import { Power, PowerOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function AdminBoutiquesPage() {
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [companyFilter, setCompanyFilter] = useState<string>('')

  const { data: companies = [] } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: adminListCompanies,
  })

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: () => adminListStores(),
  })

  const updateStoreMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { is_active?: boolean } }) =>
      adminUpdateStore(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Boutique mise à jour')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const deleteStoreMutation = useMutation({
    mutationFn: adminDeleteStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setDeleteTarget(null)
      toast.success('Boutique supprimée définitivement')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const companyById = Object.fromEntries(companies.map((c) => [c.id, c.name]))
  const filteredStores = companyFilter
    ? stores.filter((s) => s.company_id === companyFilter)
    : stores

  return (
    <div className="space-y-8">
      <PageHeader
        title="Boutiques"
        description="Toutes les boutiques de la plateforme"
      />

      {companies.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-[var(--text-muted)]">Filtrer par entreprise :</label>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-solid)] bg-[var(--card-bg)] px-3 py-2 text-sm"
          >
            <option value="">Toutes</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Entreprise</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Boutique</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Code</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Statut</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Principale</th>
                  <th className="p-3 text-right font-medium text-[var(--text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--border-solid)] hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="p-3 text-[var(--text-secondary)]">
                      {companyById[s.company_id] ?? s.company_id}
                    </td>
                    <td className="p-3 font-medium text-[var(--text-primary)]">{s.name}</td>
                    <td className="p-3 text-[var(--text-muted)]">{s.code ?? '—'}</td>
                    <td className="p-3">
                      <span
                        className={
                          s.is_active
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[var(--text-muted)]'
                        }
                      >
                        {s.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="p-3">{s.is_primary ? 'Oui' : '—'}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateStoreMutation.mutate({
                              id: s.id,
                              patch: { is_active: !s.is_active },
                            })
                          }
                          title={s.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {s.is_active ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[var(--danger)]"
                          onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStores.length === 0 && (
            <p className="p-6 text-center text-sm text-[var(--text-muted)]">Aucune boutique.</p>
          )}
        </Card>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la boutique ?</AlertDialogTitle>
            <AlertDialogDescription>
              La boutique « {deleteTarget?.name} » sera supprimée définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--danger)] hover:bg-[var(--danger)]/90"
              onClick={() => deleteTarget && deleteStoreMutation.mutate(deleteTarget.id)}
              disabled={deleteStoreMutation.isPending}
            >
              {deleteStoreMutation.isPending ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
