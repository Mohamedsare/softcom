import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Button, PageHeader } from '@/components/ui'
import {
  adminListCompanies,
  adminListStores,
  adminUpdateCompany,
  adminUpdateStore,
  adminDeleteCompany,
  adminDeleteStore,
  type AdminCompany,
  type AdminStore,
} from '@/features/admin/api/adminApi'
import {
  Building2,
  Power,
  PowerOff,
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
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

export function AdminEntreprisesPage() {
  const queryClient = useQueryClient()
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'company' | 'store'; id: string; name: string } | null>(null)

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: adminListCompanies,
  })

  const { data: stores = [] } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: () => adminListStores(),
  })

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof adminUpdateCompany>[1] }) =>
      adminUpdateCompany(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Entreprise mise à jour')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const updateStoreMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof adminUpdateStore>[1] }) =>
      adminUpdateStore(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Boutique mise à jour')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const deleteCompanyMutation = useMutation({
    mutationFn: adminDeleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setDeleteTarget(null)
      toast.success('Entreprise supprimée définitivement')
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

  const storesByCompany = stores.reduce(
    (acc, s) => {
      if (!acc[s.company_id]) acc[s.company_id] = []
      acc[s.company_id].push(s)
      return acc
    },
    {} as Record<string, AdminStore[]>
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Entreprises"
        description="Gestion des entreprises et de leurs boutiques"
      />

      {companiesLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]"></th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Nom</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Slug</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Statut</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Préd. IA</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Quota boutiques</th>
                  <th className="p-3 text-right font-medium text-[var(--text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <React.Fragment key={c.id}>
                    <tr className="border-b border-[var(--border-solid)] hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCompanyId((id) => (id === c.id ? null : c.id))
                          }
                          className="p-1"
                        >
                          {(storesByCompany[c.id]?.length ?? 0) > 0 ? (
                            expandedCompanyId === c.id ? (
                              <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                            )
                          ) : null}
                        </button>
                      </td>
                      <td className="p-3 font-medium text-[var(--text-primary)]">{c.name}</td>
                      <td className="p-3 text-[var(--text-muted)]">{c.slug ?? '—'}</td>
                      <td className="p-3">
                        <span
                          className={
                            c.is_active
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[var(--text-muted)]'
                          }
                        >
                          {c.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={
                            c.ai_predictions_enabled
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[var(--text-muted)]'
                          }
                        >
                          {c.ai_predictions_enabled ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="p-3 text-[var(--text-muted)]">{c.store_quota}</td>
                      <td className="p-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              updateCompanyMutation.mutate({
                                id: c.id,
                                patch: { is_active: !c.is_active },
                              })
                            }
                            title={c.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {c.is_active ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              updateCompanyMutation.mutate({
                                id: c.id,
                                patch: { ai_predictions_enabled: !c.ai_predictions_enabled },
                              })
                            }
                            title={c.ai_predictions_enabled ? 'Désactiver prédictions IA' : 'Activer prédictions IA'}
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[var(--danger)]"
                            onClick={() => setDeleteTarget({ type: 'company', id: c.id, name: c.name })}
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedCompanyId === c.id && (storesByCompany[c.id]?.length ?? 0) > 0 && (
                      <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                        <td colSpan={7} className="p-0">
                          <div className="border-t border-[var(--border-solid)] px-4 py-3">
                            <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">
                              Boutiques ({storesByCompany[c.id].length})
                            </p>
                            <ul className="space-y-2">
                              {storesByCompany[c.id].map((s) => (
                                <li
                                  key={s.id}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-solid)] bg-[var(--card-bg)] p-3"
                                >
                                  <div>
                                    <span className="font-medium text-[var(--text-primary)]">{s.name}</span>
                                    {s.is_primary && (
                                      <span className="ml-2 text-xs text-[var(--text-muted)]">(principale)</span>
                                    )}
                                    <span
                                      className={`ml-2 text-xs ${s.is_active ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`}
                                    >
                                      {s.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        updateStoreMutation.mutate({
                                          id: s.id,
                                          patch: { is_active: !s.is_active },
                                        })
                                      }
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
                                      onClick={() =>
                                        setDeleteTarget({ type: 'store', id: s.id, name: s.name })
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'company'
                ? `L'entreprise « ${deleteTarget.name} » et toutes ses données (boutiques, ventes, produits, etc.) seront supprimées. Cette action est irréversible.`
                : `La boutique « ${deleteTarget?.name} » sera supprimée définitivement. Cette action est irréversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--danger)] hover:bg-[var(--danger)]/90"
              onClick={() => {
                if (!deleteTarget) return
                if (deleteTarget.type === 'company') deleteCompanyMutation.mutate(deleteTarget.id)
                else deleteStoreMutation.mutate(deleteTarget.id)
              }}
              disabled={deleteCompanyMutation.isPending || deleteStoreMutation.isPending}
            >
              {deleteCompanyMutation.isPending || deleteStoreMutation.isPending ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
