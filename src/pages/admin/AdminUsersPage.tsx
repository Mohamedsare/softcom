import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, PageHeader, Button, Input, Label } from '@/components/ui'
import {
  adminListUsers,
  adminListCompanies,
  adminUpdateProfile,
  adminGetUserCompanyIds,
  adminSetUserCompanies,
  adminSetUserActive,
  adminDeleteUser,
  type AdminUser,
} from '@/features/admin/api/adminApi'
import { Shield, Pencil, Search, UserX, UserCheck, Trash2 } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
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
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editIsSuperAdmin, setEditIsSuperAdmin] = useState(false)
  const [editCompanyIds, setEditCompanyIds] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminListUsers(),
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: adminListCompanies,
  })

  const { data: userCompanyIds = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['admin-user-companies', editUser?.id],
    queryFn: () => (editUser ? adminGetUserCompanyIds(editUser.id) : Promise.resolve([])),
    enabled: !!editUser?.id,
  })

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        (u.full_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.company_names ?? []).some((c) => c.toLowerCase().includes(q))
    )
  }, [users, search])

  const updateProfileMutation = useMutation({
    mutationFn: ({ userId, full_name, is_super_admin }: { userId: string; full_name: string; is_super_admin: boolean }) =>
      adminUpdateProfile(userId, { full_name: full_name || null, is_super_admin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Profil mis à jour')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const setUserCompaniesMutation = useMutation({
    mutationFn: ({ userId, companyIds }: { userId: string; companyIds: string[] }) =>
      adminSetUserCompanies(userId, companyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user-companies'] })
      toast.success('Entreprises mises à jour')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const setUserActiveMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      adminSetUserActive(userId, active),
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(active ? 'Compte réactivé' : 'Compte désactivé')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminDeleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setDeleteTarget(null)
      toast.success('Utilisateur supprimé')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const openEdit = (u: AdminUser) => {
    setEditUser(u)
    setEditFullName(u.full_name ?? '')
    setEditIsSuperAdmin(u.is_super_admin)
    setEditCompanyIds([])
  }

  const closeEdit = () => {
    setEditUser(null)
  }

  const hasSyncedCompanies = useRef(false)
  useEffect(() => {
    if (!editUser) return
    if (loadingCompanies || userCompanyIds === undefined) return
    if (hasSyncedCompanies.current) return
    hasSyncedCompanies.current = true
    setEditCompanyIds(userCompanyIds)
  }, [editUser?.id, loadingCompanies, userCompanyIds])
  useEffect(() => {
    if (!editUser) hasSyncedCompanies.current = false
  }, [editUser?.id])

  const handleSave = () => {
    if (!editUser) return
    updateProfileMutation.mutate(
      { userId: editUser.id, full_name: editFullName.trim(), is_super_admin: editIsSuperAdmin },
      {
        onSuccess: () => {
          setUserCompaniesMutation.mutate(
            { userId: editUser.id, companyIds: editCompanyIds },
            { onSuccess: () => closeEdit() }
          )
        },
      }
    )
  }

  const toggleCompany = (companyId: string) => {
    setEditCompanyIds((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        description="Gestion complète des utilisateurs de la plateforme"
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            type="search"
            placeholder="Rechercher par nom, email, entreprise…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Nom</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Email</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Entreprises</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Rôle</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Statut</th>
                  <th className="p-3 text-right font-medium text-[var(--text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[var(--border-solid)] hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="p-3 font-medium text-[var(--text-primary)]">{u.full_name ?? '—'}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{u.email ?? '—'}</td>
                    <td className="p-3 text-[var(--text-muted)] max-w-[200px] truncate">
                      {u.company_names?.length ? u.company_names.join(', ') : '—'}
                    </td>
                    <td className="p-3">
                      {u.is_super_admin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400">
                          <Shield className="h-3 w-3" />
                          Super admin
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">Utilisateur</span>
                      )}
                    </td>
                    <td className="p-3">
                      {u.is_active !== false ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Actif</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">Désactivé</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(u)} title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {currentUser?.id !== u.id && (
                          <>
                            {u.is_active !== false ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setUserActiveMutation.mutate({ userId: u.id, active: false })}
                                disabled={setUserActiveMutation.isPending}
                                title="Désactiver le compte"
                                className="text-amber-600 hover:text-amber-700 dark:text-amber-400"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setUserActiveMutation.mutate({ userId: u.id, active: true })}
                                disabled={setUserActiveMutation.isPending}
                                title="Réactiver le compte"
                                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget(u)}
                              title="Supprimer définitivement"
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <p className="p-6 text-center text-sm text-[var(--text-muted)]">Aucun utilisateur.</p>
          )}
        </Card>
      )}

      {/* Modal édition utilisateur */}
      <Dialog.Root open={!!editUser} onOpenChange={(open) => !open && closeEdit()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
              Modifier l&apos;utilisateur
            </Dialog.Title>
            {editUser && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-[var(--text-muted)]">{editUser.email}</p>
                <div>
                  <Label className="mb-1 block">Nom</Label>
                  <Input
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Nom complet"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-super-admin"
                    checked={editIsSuperAdmin}
                    onChange={(e) => setEditIsSuperAdmin(e.target.checked)}
                    className="rounded border-[var(--border-solid)]"
                  />
                  <Label htmlFor="edit-super-admin">Super admin</Label>
                </div>
                <div>
                  <Label className="mb-2 block">Entreprises rattachées</Label>
                  {loadingCompanies ? (
                    <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border-solid)] p-2 space-y-1">
                      {companies.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-2 py-1">
                          <input
                            type="checkbox"
                            checked={editCompanyIds.includes(c.id)}
                            onChange={() => toggleCompany(c.id)}
                            className="rounded border-[var(--border-solid)]"
                          />
                          <span className="text-sm">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending || setUserCompaniesMutation.isPending}
                  >
                    {updateProfileMutation.isPending || setUserCompaniesMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                  <Button variant="secondary" onClick={closeEdit}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;utilisateur {deleteTarget?.full_name ?? deleteTarget?.email ?? '—'} sera supprimé définitivement
              (compte Auth et données associées). Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteUserMutation.mutate(deleteTarget.id)}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteUserMutation.isPending ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
