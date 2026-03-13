import { useState } from 'react'
import { useCompany } from '@/context/CompanyContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, PageHeader, Input, Label } from '@/components/ui'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  name: z.string().min(2, 'Nom requis'),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function SuppliersPage() {
  const { currentCompanyId } = useCompany()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return []
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('name')
      if (error) throw new Error(error.message)
      return data ?? []
    },
    enabled: !!currentCompanyId,
  })

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: res, error } = await supabase
        .from('suppliers')
        .insert({
          company_id: currentCompanyId!,
          name: data.name,
          contact: data.contact || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          notes: data.notes || null,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', currentCompanyId] })
      setOpen(false)
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', contact: '', phone: '', email: '', address: '', notes: '' },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fournisseurs"
        description="Gérer vos fournisseurs"
        actions={
          currentCompanyId && (
            <Button onClick={() => { reset(); setOpen(true); }}>
              <Plus className="h-4 w-4" />
              Nouveau fournisseur
            </Button>
          )
        }
      />
      <Card>
        <div className="table-responsive">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 font-medium text-[var(--text-primary)]">Nom</th>
                <th className="p-4 font-medium text-[var(--text-primary)]">Contact</th>
                <th className="hidden p-4 font-medium text-[var(--text-primary)] sm:table-cell">Téléphone</th>
                <th className="hidden p-4 font-medium text-[var(--text-primary)] md:table-cell">Email</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-[var(--text-muted)]">Chargement...</td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-[var(--text-muted)]">Aucun fournisseur.</td></tr>
              ) : (
                suppliers.map((s: { id: string; name: string; contact: string | null; phone: string | null; email: string | null }) => (
                  <tr key={s.id} className="border-b border-[var(--border-solid)]">
                    <td className="p-4 font-medium">{s.name}</td>
                    <td className="p-4">{s.contact ?? '—'}</td>
                    <td className="hidden p-4 sm:table-cell">{s.phone ?? '—'}</td>
                    <td className="hidden p-4 md:table-cell">{s.email ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold">Nouveau fournisseur</Dialog.Title>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="mt-4 space-y-4">
              <div>
                <Label className="mb-2 block">Nom *</Label>
                <Input {...register('name')} error={errors.name?.message} />
              </div>
              <div>
                <Label className="mb-2 block">Contact</Label>
                <Input {...register('contact')} />
              </div>
              <div>
                <Label className="mb-2 block">Téléphone</Label>
                <Input {...register('phone')} />
              </div>
              <div>
                <Label className="mb-2 block">Email</Label>
                <Input type="email" {...register('email')} error={errors.email?.message} />
              </div>
              <div>
                <Label className="mb-2 block">Adresse</Label>
                <textarea {...register('address')} rows={2} className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 py-3 dark:bg-slate-800" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>Créer</Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
