import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent, PageHeader, Button, Input, Label } from '@/components/ui'
import { adminGetPlatformSettings, adminSetPlatformSettings } from '@/features/admin/api/adminApi'
import { Settings, Building2, Mail, Phone, MessageCircle, UserPlus, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Record<string, string>>({})

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ['admin-platform-settings'],
    queryFn: adminGetPlatformSettings,
  })

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, string>) => adminSetPlatformSettings(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platform-settings'] })
      toast.success('Paramètres enregistrés')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  useEffect(() => {
    setForm({ ...settings })
  }, [settings])

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  const getValue = (key: string) => form[key] ?? settings[key] ?? ''

  return (
    <div className="space-y-8">
      <PageHeader
        title="Paramètres"
        description="Configuration de la plateforme (nom, contact, options)"
      />

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations plateforme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-500" />
                Informations plateforme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="platform_name" className="mb-1 block">
                  Nom de la plateforme
                </Label>
                <Input
                  id="platform_name"
                  value={getValue('platform_name')}
                  onChange={(e) => handleChange('platform_name', e.target.value)}
                  placeholder="FasoStock"
                />
              </div>
              <div>
                <Label htmlFor="contact_email" className="mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email de contact
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={getValue('contact_email')}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone" className="mb-1 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </Label>
                <Input
                  id="contact_phone"
                  value={getValue('contact_phone')}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+226 00 00 00 00"
                />
              </div>
              <div>
                <Label htmlFor="contact_whatsapp" className="mb-1 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp (affiché sur la landing)
                </Label>
                <Input
                  id="contact_whatsapp"
                  value={getValue('contact_whatsapp')}
                  onChange={(e) => handleChange('contact_whatsapp', e.target.value)}
                  placeholder="+226 64 71 20 44"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fonctionnalités */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-500" />
                Fonctionnalités
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="registration_enabled"
                  checked={getValue('registration_enabled') === 'true'}
                  onChange={(e) =>
                    handleChange('registration_enabled', e.target.checked ? 'true' : 'false')
                  }
                  className="rounded border-[var(--border-solid)]"
                />
                <Label htmlFor="registration_enabled" className="flex items-center gap-2 cursor-pointer">
                  <UserPlus className="h-4 w-4" />
                  Inscriptions publiques autorisées (lien S&apos;inscrire sur la landing)
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="landing_chat_enabled"
                  checked={getValue('landing_chat_enabled') === 'true'}
                  onChange={(e) =>
                    handleChange('landing_chat_enabled', e.target.checked ? 'true' : 'false')
                  }
                  className="rounded border-[var(--border-solid)]"
                />
                <Label htmlFor="landing_chat_enabled" className="flex items-center gap-2 cursor-pointer">
                  <MessageCircle className="h-4 w-4" />
                  Chatbot de la landing page activé
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enregistrement…
                </>
              ) : (
                'Enregistrer les paramètres'
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
