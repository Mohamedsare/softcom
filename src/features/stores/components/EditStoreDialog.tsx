import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { Button, Input, Label } from '@/components/ui'
import { Camera } from 'lucide-react'
import { updateStore, uploadStoreLogo } from '../api/storesService'

export interface StoreEdit {
  id: string
  name: string
  code?: string | null
  address?: string | null
  logo_url?: string | null
  phone?: string | null
  email?: string | null
  description?: string | null
  is_primary?: boolean
}

const schema = z.object({
  name: z.string().min(2, 'Nom requis'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  description: z.string().optional(),
  is_primary: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface EditStoreDialogProps {
  store: StoreEdit
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditStoreDialog({ store, open, onClose, onSuccess }: EditStoreDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(store.logo_url ?? null)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: store.name,
      address: store.address ?? '',
      phone: store.phone ?? '',
      email: store.email ?? '',
      description: store.description ?? '',
      is_primary: store.is_primary,
    },
  })

  useEffect(() => {
    if (open && store) {
      reset({
        name: store.name,
        code: store.code ?? '',
        address: store.address ?? '',
        phone: store.phone ?? '',
        email: store.email ?? '',
        description: store.description ?? '',
        is_primary: store.is_primary ?? false,
      })
      setLogoPreview(store.logo_url ?? null)
      setLogoFile(null)
    }
  }, [open, store, reset])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setLogoFile(f)
      const url = URL.createObjectURL(f)
      setLogoPreview(url)
    }
  }

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)
    try {
      let logo_url = store.logo_url
      if (logoFile) {
        logo_url = await uploadStoreLogo(store.id, logoFile)
      }
      await updateStore(store.id, {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        description: data.description,
        is_primary: data.is_primary,
        logo_url: logo_url ?? undefined,
      })
      onSuccess()
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
            Modifier la boutique
          </Dialog.Title>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--border-solid)] bg-slate-50 transition-colors hover:border-[var(--accent)] dark:bg-slate-800 min-h-[44px] min-w-[44px] touch-manipulation"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-[var(--text-muted)]" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Logo</p>
                <p className="text-xs text-[var(--text-muted)]">Cliquez pour changer</p>
              </div>
            </div>
            <div>
              <Label htmlFor="name" className="mb-2 block">Nom *</Label>
              <Input id="name" {...register('name')} error={errors.name?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Code</Label>
                <div className="flex h-10 items-center rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm text-[var(--text-muted)] dark:bg-slate-800">
                  {store.code ?? '—'}
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Généré automatiquement par le système</p>
              </div>
              <div>
                <Label htmlFor="phone" className="mb-2 block">Téléphone</Label>
                <Input id="phone" type="tel" {...register('phone')} />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="mb-2 block">Email</Label>
              <Input id="email" type="email" {...register('email')} error={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="address" className="mb-2 block">Adresse Physique</Label>
              <textarea
                id="address"
                {...register('address')}
                rows={2}
                placeholder="Rue, quartier, ville, pays"
                className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 py-3 dark:bg-slate-800"
              />
            </div>
            <div>
              <Label htmlFor="description" className="mb-2 block">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 py-3 dark:bg-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('is_primary')} id="is_primary" className="rounded border-[var(--border-solid)] min-h-[20px] min-w-[20px]" />
              <Label htmlFor="is_primary" className="cursor-pointer">Boutique principale</Label>
            </div>
            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Annuler
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
