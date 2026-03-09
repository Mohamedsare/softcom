import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Input, Label } from '@/components/ui'
import { productsApi } from '../api/productsApi'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface CategoriesSectionProps {
  companyId: string
}

export function CategoriesSection({ companyId }: CategoriesSectionProps) {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', companyId],
    queryFn: () => productsApi.categories(companyId),
    enabled: !!companyId,
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => productsApi.createCategory(companyId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', companyId] })
      queryClient.invalidateQueries({ queryKey: ['products', companyId] })
      setNewName('')
      toast.success('Catégorie créée')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      productsApi.updateCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', companyId] })
      queryClient.invalidateQueries({ queryKey: ['products', companyId] })
      setEditingId(null)
      setEditName('')
      toast.success('Catégorie mise à jour')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', companyId] })
      queryClient.invalidateQueries({ queryKey: ['products', companyId] })
      toast.success('Catégorie supprimée')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const startEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateMutation.mutate({ id: editingId, name: editName.trim() })
    }
  }

  return (
    <Card>
      <div className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="new-cat" className="mb-1 block text-sm">Nouvelle catégorie</Label>
            <Input
              id="new-cat"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom"
              onKeyDown={(e) => e.key === 'Enter' && newName.trim() && createMutation.mutate(newName.trim())}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => newName.trim() && createMutation.mutate(newName.trim())}
              disabled={!newName.trim() || createMutation.isPending}
              className="min-h-[44px] min-w-[44px]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Ajouter</span>
            </Button>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Catégories ({categories.length})</h3>
          {categories.length === 0 ? (
            <p className="py-4 text-sm text-[var(--text-muted)]">Aucune catégorie.</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-solid)] p-3 min-h-[44px]"
                >
                  {editingId === c.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={saveEdit} disabled={!editName.trim()}>
                          OK
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => { setEditingId(null); setEditName('') }}>
                          Annuler
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-[var(--text-primary)]">{c.name}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(c.id, c.name)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Supprimer cette catégorie ?')) deleteMutation.mutate(c.id)
                          }}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}
