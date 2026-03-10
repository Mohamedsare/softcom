import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Button, PageHeader, Input, Label } from '@/components/ui'
import { useCompany } from '@/context/CompanyContext'
import { RequirePermission } from '@/components/guards/RequirePermission'
import { PERMISSIONS } from '@/constants/permissions'
import {
  listCompanyMembers,
  listRoles,
  setCompanyMemberActive,
} from '@/features/users/api/usersApi'
import { supabase } from '@/lib/supabase'
import { translateErrorMessage } from '@/lib/errorMessages'
import { UserPlus, UserCheck, UserX, X, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

function UsersList() {
  const { currentCompanyId, stores } = useCompany()
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createFullName, setCreateFullName] = useState('')
  const [createRoleSlug, setCreateRoleSlug] = useState('')
  const [createStoreIds, setCreateStoreIds] = useState<string[]>([])
  const [resetPasswordFor, setResetPasswordFor] = useState<{ user_id: string; ucrId: string } | null>(null)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('')

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['company-members', currentCompanyId],
    queryFn: () => listCompanyMembers(currentCompanyId!),
    enabled: !!currentCompanyId,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles(),
    enabled: creating,
  })

  const createUserMutation = useMutation({
    mutationFn: async () => {
      // Rafraîchir la session pour avoir un token valide, puis envoyer explicitement le Bearer
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Session absente. Déconnectez-vous puis reconnectez-vous.')
      }
      await supabase.auth.refreshSession()
      const { data: { session: fresh } } = await supabase.auth.getSession()
      const token = fresh?.access_token ?? session.access_token

      const { data, error } = await supabase.functions.invoke('create-company-user', {
        body: {
          email: createEmail.trim(),
          password: createPassword,
          full_name: createFullName.trim() || undefined,
          role_slug: createRoleSlug,
          company_id: currentCompanyId,
          store_ids: createStoreIds.length ? createStoreIds : undefined,
        },
        headers: { Authorization: `Bearer ${token}` },
      })
      if (error) {
        const msg = error.message || ''
        const bodyMsg = (data as { error?: string })?.error
        if (bodyMsg === 'Unauthorized' || bodyMsg === 'Invalid token' || (msg.includes('401'))) {
          throw new Error('Session expirée ou invalide. Déconnectez-vous puis reconnectez-vous, puis réessayez.')
        }
        if (msg.includes('Failed to send') || msg.includes('fetch') || msg.includes('Network')) {
          throw new Error(
            'Impossible de joindre le serveur (Edge Function). Déployez la fonction "create-company-user" sur votre projet Supabase : supabase functions deploy create-company-user'
          )
        }
        throw new Error(translateErrorMessage(bodyMsg || msg))
      }
      if (data?.error) throw new Error(translateErrorMessage(data.error))
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-members', currentCompanyId] })
      toast.success('Utilisateur créé. Communiquez-lui ses identifiants (email et mot de passe).')
      setCreating(false)
      setCreateEmail('')
      setCreatePassword('')
      setCreateFullName('')
      setCreateRoleSlug('')
      setCreateStoreIds([])
    },
    onError: (e) => toast.error(translateErrorMessage(e instanceof Error ? e.message : undefined)),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!resetPasswordFor || !currentCompanyId) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Session absente. Déconnectez-vous puis reconnectez-vous.')
      }
      await supabase.auth.refreshSession()
      const { data: { session: fresh } } = await supabase.auth.getSession()
      const token = fresh?.access_token ?? session.access_token

      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          user_id: resetPasswordFor.user_id,
          new_password: resetPasswordValue,
          company_id: currentCompanyId,
        },
        headers: { Authorization: `Bearer ${token}` },
      })
      if (error) {
        const bodyMsg = (data as { error?: string })?.error
        if (bodyMsg === 'Unauthorized' || bodyMsg === 'Invalid token') {
          throw new Error('Session expirée ou invalide. Déconnectez-vous puis reconnectez-vous.')
        }
        throw new Error(translateErrorMessage(bodyMsg || error.message))
      }
      if (data?.error) throw new Error(translateErrorMessage(data.error))
      return data
    },
    onSuccess: () => {
      toast.success('Mot de passe mis à jour. Communiquez-le à l’utilisateur.')
      setResetPasswordFor(null)
      setResetPasswordValue('')
      setResetPasswordConfirm('')
    },
    onError: (e) => toast.error(translateErrorMessage(e instanceof Error ? e.message : undefined)),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setCompanyMemberActive(id, isActive),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['company-members', currentCompanyId] })
      toast.success(isActive ? 'Utilisateur activé' : 'Utilisateur désactivé')
    },
    onError: (e) => toast.error(translateErrorMessage(e instanceof Error ? e.message : undefined)),
  })

  if (!currentCompanyId) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Gérer les accès et les droits des utilisateurs de l'entreprise"
      />

      <Card>
        <div className="border-b border-[var(--border-solid)] p-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-[var(--text-primary)]">Membres</h2>
          <Button
            variant="primary"
            onClick={() => setCreating(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Créer un utilisateur
          </Button>
        </div>
        <div className="p-4">
          {creating && (
            <div className="rounded-lg border border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50 p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[var(--text-primary)]">Nouvel utilisateur</h3>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="p-1 rounded text-[var(--text-muted)] hover:bg-slate-200 dark:hover:bg-slate-700"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                L’utilisateur pourra se connecter avec l’email et le mot de passe ci-dessous. Communiquez-les-lui de façon sécurisée.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="new-user-email">Email *</Label>
                  <Input
                    id="new-user-email"
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="utilisateur@exemple.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new-user-password">Mot de passe *</Label>
                  <Input
                    id="new-user-password"
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="new-user-name">Nom affiché</Label>
                  <Input
                    id="new-user-name"
                    value={createFullName}
                    onChange={(e) => setCreateFullName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new-user-role">Rôle *</Label>
                  <select
                    id="new-user-role"
                    value={createRoleSlug}
                    onChange={(e) => setCreateRoleSlug(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800 text-[var(--text-primary)]"
                  >
                    <option value="">Choisir un rôle</option>
                    {roles.filter((r) => r.slug !== 'super_admin').map((r) => (
                      <option key={r.id} value={r.slug}>{r.name}</option>
                    ))}
                  </select>
                </div>
                {stores.length > 0 && (
                  <div>
                    <Label>Boutiques (optionnel)</Label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {stores.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={createStoreIds.includes(s.id)}
                            onChange={(e) =>
                              setCreateStoreIds((prev) =>
                                e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                              )
                            }
                            className="rounded border-[var(--border-solid)] text-[var(--accent)]"
                          />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="primary"
                  onClick={() => createUserMutation.mutate()}
                  disabled={
                    !createEmail.trim() ||
                    createPassword.length < 6 ||
                    !createRoleSlug ||
                    createUserMutation.isPending
                  }
                >
                  {createUserMutation.isPending ? 'Création…' : 'Créer et donner les identifiants'}
                </Button>
                <Button variant="secondary" onClick={() => setCreating(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
          {isLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Aucun membre pour cette entreprise.</p>
          ) : (
            <ul className="divide-y divide-[var(--border-solid)]">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"
                >
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {m.profile?.full_name?.trim() || 'Sans nom'}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">{m.role.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {resetPasswordFor?.user_id === m.user_id ? (
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Input
                          type="password"
                          placeholder="Nouveau mot de passe"
                          value={resetPasswordValue}
                          onChange={(e) => setResetPasswordValue(e.target.value)}
                          className="min-w-[140px]"
                        />
                        <Input
                          type="password"
                          placeholder="Confirmer"
                          value={resetPasswordConfirm}
                          onChange={(e) => setResetPasswordConfirm(e.target.value)}
                          className="min-w-[120px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => resetPasswordMutation.mutate()}
                          disabled={
                            resetPasswordValue.length < 6 ||
                            resetPasswordValue !== resetPasswordConfirm ||
                            resetPasswordMutation.isPending
                          }
                        >
                          {resetPasswordMutation.isPending ? 'Envoi…' : 'Enregistrer'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setResetPasswordFor(null)
                            setResetPasswordValue('')
                            setResetPasswordConfirm('')
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span
                          className={`text-sm ${m.is_active ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-muted)]'}`}
                        >
                          {m.is_active ? 'Actif' : 'Inactif'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setResetPasswordFor({ user_id: m.user_id, ucrId: m.id })}
                          title="Réinitialiser le mot de passe"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: m.id,
                              isActive: !m.is_active,
                            })
                          }
                          disabled={toggleActiveMutation.isPending}
                          className="shrink-0"
                          title={m.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {m.is_active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}

export function UsersPage() {
  return (
    <RequirePermission permission={PERMISSIONS.users_manage}>
      <UsersList />
    </RequirePermission>
  )
}
