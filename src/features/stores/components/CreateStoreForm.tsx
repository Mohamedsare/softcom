import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createStore } from '../api/storesService'
import { Button, Input, Label } from '@/components/ui'

const schema = z.object({
  name: z.string().min(2, 'Nom requis'),
  code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  description: z.string().optional(),
  is_primary: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface CreateStoreFormProps {
  companyId: string
  onSuccess: () => void
  onCancel: () => void
}

export function CreateStoreForm({ companyId, onSuccess, onCancel }: CreateStoreFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_primary: false },
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)
    try {
      const store = await createStore({
        company_id: companyId,
        name: data.name,
        code: data.code || undefined,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        description: data.description || undefined,
        is_primary: data.is_primary,
      })
      if (logoFile) {
        const { uploadStoreLogo, updateStore } = await import('../api/storesService')
        const logo_url = await uploadStoreLogo(store.id, logoFile)
        await updateStore(store.id, { ...data, logo_url })
      }
      onSuccess()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--border-solid)] bg-slate-50 transition-colors hover:border-[var(--accent)] dark:bg-slate-800 min-h-[44px] min-w-[44px] touch-manipulation"
        >
          {logoFile ? (
            <img src={URL.createObjectURL(logoFile)} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl text-[var(--text-muted)]">📷</span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Logo (optionnel)</p>
          <p className="text-xs text-[var(--text-muted)]">Cliquez pour sélectionner</p>
        </div>
      </div>
      <div>
        <Label htmlFor="name" className="mb-2 block">Nom *</Label>
        <Input id="name" {...register('name')} error={errors.name?.message} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code" className="mb-2 block">Code</Label>
          <Input id="code" {...register('code')} placeholder="B1" />
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
          rows={2}
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
          {isSubmitting ? 'Création...' : 'Créer'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
