import { useState, useMemo } from 'react'
import { useCompany } from '@/context/CompanyContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, PageHeader, Input, Label, Badge } from '@/components/ui'
import { Plus, Pencil, Trash2, Search, UserCircle, Building2 } from 'lucide-react'
import { customersApi, type Customer, type CustomerType } from '@/features/customers/api/customersApi'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  type: z.enum(['individual', 'company']),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const TYPE_LABEL: Record<CustomerType, string> = {
  individual: 'Particulier',
  company: 'Entreprise',
}

export function CustomersPage() {
  const { currentCompanyId } = useCompany()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', currentCompanyId],
    queryFn: () => customersApi.list(currentCompanyId!),
    enabled: !!currentCompanyId,
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.trim().toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone?.toLowerCase().includes(q) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.address?.toLowerCase().includes(q) ?? false)
    )
  }, [customers, search])

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      customersApi.create({
        company_id: currentCompanyId!,
        name: data.name,
        type: data.type,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', currentCompanyId] })
      setCreateOpen(false)
      toast.success('Client créé')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      customersApi.update(id, {
        name: data.name,
        type: data.type,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', currentCompanyId] })
      setEditCustomer(null)
      toast.success('Client mis à jour')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', currentCompanyId] })
      setDeleteId(null)
      toast.success('Client supprimé')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const defaultValues: FormData = {
    name: '',
    type: 'individual',
    phone: '',
    email: '',
    address: '',
    notes: '',
  }

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const openCreate = () => {
    form.reset(defaultValues)
    setCreateOpen(true)
  }

  const openEdit = (c: Customer) => {
    form.reset({
      name: c.name,
      type: c.type,
      phone: c.phone ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
      notes: c.notes ?? '',
    })
    setEditCustomer(c)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Gérer vos clients (particuliers et entreprises)"
        actions={
          currentCompanyId && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau client</span>
            </Button>
          )
        }
      />

      <Card>
        <div className="p-4 border-b border-[var(--border-solid)] sm:p-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="search"
              placeholder="Rechercher (nom, tél., email, adresse)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-solid)] bg-slate-50 py-2 pl-9 pr-3 text-sm dark:bg-slate-800"
            />
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 font-medium text-[var(--text-primary)]">Nom</th>
                <th className="p-4 font-medium text-[var(--text-primary)]">Type</th>
                <th className="p-4 font-medium text-[var(--text-primary)]">Téléphone</th>
                <th className="hidden p-4 font-medium text-[var(--text-primary)] sm:table-cell">Email</th>
                <th className="hidden p-4 font-medium text-[var(--text-primary)] md:table-cell">Adresse</th>
                <th className="hidden p-4 font-medium text-[var(--text-primary)] lg:table-cell">Notes</th>
                <th className="p-4 font-medium text-[var(--text-primary)] w-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                    Chargement...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                    {search.trim() ? 'Aucun client ne correspond à la recherche.' : 'Aucun client. Créez-en un pour commencer.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border-solid)] hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-medium text-[var(--text-primary)]">{c.name}</td>
                    <td className="p-4">
                      <Badge variant={c.type === 'company' ? 'default' : 'outline'}>
                        {c.type === 'company' ? (
                          <Building2 className="h-3 w-3 mr-1 inline" />
                        ) : (
                          <UserCircle className="h-3 w-3 mr-1 inline" />
                        )}
                        {TYPE_LABEL[c.type]}
                      </Badge>
                    </td>
                    <td className="p-4">{c.phone ?? '—'}</td>
                    <td className="hidden p-4 sm:table-cell">{c.email ?? '—'}</td>
                    <td className="hidden max-w-[180px] truncate p-4 md:table-cell" title={c.address ?? undefined}>
                      {c.address ?? '—'}
                    </td>
                    <td className="hidden max-w-[160px] truncate p-4 lg:table-cell text-[var(--text-muted)]" title={c.notes ?? undefined}>
                      {c.notes ?? '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700 touch-manipulation"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(c.id)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Création */}
      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">Nouveau client</Dialog.Title>
            <CustomerForm
              form={form}
              onSubmit={(d) => createMutation.mutate(d)}
              isSubmitting={createMutation.isPending}
              onCancel={() => setCreateOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Édition */}
      <Dialog.Root open={!!editCustomer} onOpenChange={(open) => !open && setEditCustomer(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">Modifier le client</Dialog.Title>
            {editCustomer && (
              <CustomerForm
                form={form}
                onSubmit={(d) => updateMutation.mutate({ id: editCustomer.id, data: d })}
                isSubmitting={updateMutation.isPending}
                onCancel={() => setEditCustomer(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Confirmation suppression */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Supprimer ce client ?</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Cette action est irréversible. Les ventes liées à ce client ne seront pas supprimées (le client sera simplement retiré).
            </p>
            <div className="mt-6 flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>
                Annuler
              </Button>
              <Button
                variant="secondary"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CustomerForm({
  form,
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  form: ReturnType<typeof useForm<FormData>>
  onSubmit: (data: FormData) => void
  isSubmitting: boolean
  onCancel: () => void
}) {
  const { register, handleSubmit, formState: { errors } } = form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
      <div>
        <Label className="mb-1 block">Nom *</Label>
        <Input {...register('name')} placeholder="Nom du client" error={errors.name?.message} />
      </div>
      <div>
        <Label className="mb-1 block">Type</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="individual" {...register('type')} className="rounded-full" />
            <span className="text-sm">Particulier</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="company" {...register('type')} className="rounded-full" />
            <span className="text-sm">Entreprise</span>
          </label>
        </div>
      </div>
      <div>
        <Label className="mb-1 block">Téléphone</Label>
        <Input {...register('phone')} placeholder="+226 70 00 00 00" type="tel" />
      </div>
      <div>
        <Label className="mb-1 block">Email</Label>
        <Input type="email" {...register('email')} placeholder="client@exemple.com" error={errors.email?.message} />
      </div>
      <div>
        <Label className="mb-1 block">Adresse</Label>
        <textarea
          {...register('address')}
          rows={2}
          placeholder="Adresse complète"
          className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800"
        />
      </div>
      <div>
        <Label className="mb-1 block">Notes</Label>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Notes internes"
          className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
