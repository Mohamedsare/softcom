import { Card, CardHeader, CardTitle, CardContent, PageHeader } from '@/components/ui'
import { Button, Input, Label } from '@/components/ui'
import { RequirePermission } from '@/components/guards/RequirePermission'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/context/AuthContext'
import { useCompany } from '@/context/CompanyContext'
import { useTheme } from '@/context/ThemeContext'
import { profilesApi } from '@/features/settings/api/profilesApi'
import { getReceiptWidth, setReceiptWidth, type ReceiptWidthMm } from '@/features/pos/receiptConfig'
import { supabase } from '@/lib/supabase'
import { Moon, Sun, User, Mail, Building2, LogOut, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function SettingsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.settings_manage} fallback={<p className="p-4 text-[var(--text-muted)]">Vous n'avez pas accès aux paramètres.</p>}>
      <SettingsPageContent />
    </RequirePermission>
  )
}

function SettingsPageContent() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { companies, stores, currentCompanyId, currentStoreId, setCurrentCompanyId, setCurrentStoreId } = useCompany()
  const { theme, setTheme } = useTheme()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [receiptWidth, setReceiptWidthState] = useState<ReceiptWidthMm>(() => getReceiptWidth())

  const currentCompany = companies.find((c) => c.id === currentCompanyId)

  useEffect(() => {
    setReceiptWidthState(getReceiptWidth())
  }, [])

  useEffect(() => {
    setFullName(profile?.full_name ?? '')
  }, [profile?.full_name])

  const handleSaveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    try {
      await profilesApi.updateProfile(user.id, { full_name: fullName || undefined })
      await refreshProfile()
      toast.success('Profil mis à jour')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Mot de passe mis à jour')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Profil, thème, compte et entreprise" />

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nom affiché</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom"
                className="mt-1"
              />
            </div>
            <Button variant="primary" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Impression tickets (58 mm / 80 mm) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Impression tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            Largeur du ticket de caisse pour l&apos;impression (point de vente). Par défaut : 80 mm.
          </p>
          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="receiptWidth"
                checked={receiptWidth === 58}
                onChange={() => {
                  setReceiptWidth(58)
                  setReceiptWidthState(58)
                  toast.success('Largeur ticket : 58 mm')
                }}
                className="h-4 w-4 border-[var(--border-solid)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-[var(--text-primary)]">58 mm</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="receiptWidth"
                checked={receiptWidth === 80}
                onChange={() => {
                  setReceiptWidth(80)
                  setReceiptWidthState(80)
                  toast.success('Largeur ticket : 80 mm')
                }}
                className="h-4 w-4 border-[var(--border-solid)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-[var(--text-primary)]">80 mm (défaut)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Thème */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Thème
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="theme"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
                className="h-4 w-4 border-[var(--border-solid)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-[var(--text-primary)]">Clair</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="theme"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
                className="h-4 w-4 border-[var(--border-solid)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-[var(--text-primary)]">Sombre</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Compte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ''} readOnly disabled className="mt-1" />
            </div>
            <div className="border-t border-[var(--border-solid)] pt-4">
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">Changer le mot de passe</p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>
                <Button variant="secondary" onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entreprise */}
      {currentCompany && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Entreprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companies.length > 1 && (
                <div>
                  <Label>Entreprise</Label>
                  <select
                    value={currentCompanyId ?? ''}
                    onChange={(e) => setCurrentCompanyId(e.target.value || null)}
                    className="mt-1 flex w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)] dark:bg-slate-800"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {companies.length === 1 && (
                <div>
                  <Label>Entreprise</Label>
                  <p className="text-[var(--text-primary)] mt-1">{currentCompany.name}</p>
                </div>
              )}
              {stores.length > 0 && (
                <div>
                  <Label>Boutique</Label>
                  <select
                    value={currentStoreId ?? ''}
                    onChange={(e) => setCurrentStoreId(e.target.value || null)}
                    className="mt-1 flex w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)] dark:bg-slate-800"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {currentCompany && stores.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">Aucune boutique configurée</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Déconnexion */}
      <Card className="border-[var(--danger)]/30">
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Déconnexion</p>
              <p className="text-sm text-[var(--text-muted)]">Se déconnecter de FasoStock</p>
            </div>
            <Button variant="danger" onClick={signOut} className="flex items-center gap-2 shrink-0">
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
