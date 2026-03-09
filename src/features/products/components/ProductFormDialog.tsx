import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { Button, Input, Label } from '@/components/ui'
import { productsApi } from '../api/productsApi'
import { X, Plus, Camera } from 'lucide-react'
import type { ProductImage } from '../api/productsApi'

const schema = z.object({
  name: z.string().min(2, 'Nom requis'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, 'Unité requise'),
  purchase_price: z.number().min(0, 'Prix >= 0'),
  sale_price: z.number().min(0, 'Prix >= 0'),
  min_price: z.number().min(0).nullable(),
  stock_min: z.number().min(0, 'Stock min >= 0'),
  description: z.string().optional(),
  is_active: z.boolean(),
  category_id: z.string().optional(),
  brand_id: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ProductFormDialogProps {
  companyId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
  productId?: string
}

const UNITS = ['pce', 'kg', 'L', 'm', 'm²', 'lot', 'paquet', 'carton', 'boîte', 'sachet']

export function ProductFormDialog({
  companyId,
  open,
  onClose,
  onSuccess,
  productId,
}: ProductFormDialogProps) {
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newBrandName, setNewBrandName] = useState('')
  const [images, setImages] = useState<ProductImage[]>([])
  const [pendingImages, setPendingImages] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', companyId],
    queryFn: () => productsApi.categories(companyId),
    enabled: open && !!companyId,
  })
  const { data: brands = [] } = useQuery({
    queryKey: ['brands', companyId],
    queryFn: () => productsApi.brands(companyId),
    enabled: open && !!companyId,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      unit: 'pce',
      purchase_price: 0,
      sale_price: 0,
      min_price: null,
      stock_min: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (productId && open) {
      productsApi.get(productId).then((p) => {
        if (p) {
          reset({
            name: p.name,
            sku: p.sku ?? '',
            barcode: p.barcode ?? '',
            unit: p.unit,
            purchase_price: p.purchase_price,
            sale_price: p.sale_price,
            min_price: p.min_price ?? null,
            stock_min: p.stock_min,
            description: p.description ?? '',
            is_active: p.is_active,
            category_id: p.category_id ?? '',
            brand_id: p.brand_id ?? '',
          })
          setImages(p.product_images ?? [])
        }
      })
      setPendingImages([])
    } else if (open) {
      reset({
        name: '',
        sku: '',
        barcode: '',
        unit: 'pce',
        purchase_price: 0,
        sale_price: 0,
        min_price: null,
        stock_min: 0,
        description: '',
        is_active: true,
        category_id: '',
        brand_id: '',
      })
      setImages([])
      setPendingImages([])
    }
  }, [productId, open, reset])

  const addCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const c = await productsApi.createCategory(companyId, newCategoryName.trim())
      queryClient.invalidateQueries({ queryKey: ['categories', companyId] })
      setValue('category_id', c.id)
      setNewCategoryName('')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const addBrand = async () => {
    if (!newBrandName.trim()) return
    try {
      const b = await productsApi.createBrand(companyId, newBrandName.trim())
      queryClient.invalidateQueries({ queryKey: ['brands', companyId] })
      setValue('brand_id', b.id)
      setNewBrandName('')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) setPendingImages((prev) => [...prev, ...Array.from(files)])
    e.target.value = ''
  }

  const removePendingImage = (i: number) => {
    setPendingImages((prev) => prev.filter((_, idx) => idx !== i))
  }

  const removeImage = async (img: ProductImage) => {
    if (!productId) return
    try {
      await productsApi.deleteImage(img.id)
      setImages((prev) => prev.filter((x) => x.id !== img.id))
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)
    try {
      let id = productId
      if (!id) {
        const p = await productsApi.create({
          company_id: companyId,
          name: data.name,
          sku: data.sku || undefined,
          barcode: data.barcode || undefined,
          unit: data.unit,
          purchase_price: data.purchase_price,
          sale_price: data.sale_price,
          min_price: data.min_price ?? undefined,
          stock_min: data.stock_min,
          description: data.description || undefined,
          is_active: data.is_active,
          category_id: data.category_id || undefined,
          brand_id: data.brand_id || undefined,
        })
        id = p.id
      } else {
        await productsApi.update(id, {
          name: data.name,
          sku: data.sku || undefined,
          barcode: data.barcode || undefined,
          unit: data.unit,
          purchase_price: data.purchase_price,
          sale_price: data.sale_price,
          min_price: data.min_price ?? undefined,
          stock_min: data.stock_min,
          description: data.description || undefined,
          is_active: data.is_active,
          category_id: data.category_id || undefined,
          brand_id: data.brand_id || undefined,
        })
      }
      for (const file of pendingImages) {
        await productsApi.addImage(id!, file)
      }
      queryClient.invalidateQueries({ queryKey: ['products', companyId] })
      onSuccess()
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
            {productId ? 'Modifier le produit' : 'Nouveau produit'}
          </Dialog.Title>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {/* Images */}
            <div>
              <Label className="mb-2 block">Images</Label>
              <div className="flex flex-wrap gap-2">
                {images.map((img) => (
                  <div key={img.id} className="relative">
                    <img
                      src={img.url}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--danger)] text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {pendingImages.map((file, i) => (
                  <div key={`p-${i}`} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingImage(i)}
                      className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--danger)] text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800 touch-manipulation min-h-[44px] min-w-[44px]"
                >
                  <Camera className="h-6 w-6 text-[var(--text-muted)]" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name" className="mb-2 block">Nom *</Label>
              <Input id="name" {...register('name')} error={errors.name?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku" className="mb-2 block">SKU</Label>
                <Input id="sku" {...register('sku')} />
              </div>
              <div>
                <Label htmlFor="barcode" className="mb-2 block">Code-barres</Label>
                <Input id="barcode" {...register('barcode')} />
              </div>
            </div>
            <div>
              <Label htmlFor="unit" className="mb-2 block">Unité</Label>
              <select
                id="unit"
                {...register('unit')}
                className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 py-2 dark:bg-slate-800"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="purchase_price" className="mb-2 block">Prix d'achat</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  {...register('purchase_price', { valueAsNumber: true })}
                  error={errors.purchase_price?.message}
                />
              </div>
              <div>
                <Label htmlFor="sale_price" className="mb-2 block">Prix de vente</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  {...register('sale_price', { valueAsNumber: true })}
                  error={errors.sale_price?.message}
                />
              </div>
              <div>
                <Label htmlFor="min_price" className="mb-2 block">Prix min.</Label>
                <Input
                  id="min_price"
                  type="number"
                  step="0.01"
                  placeholder="—"
                  {...register('min_price', {
                    setValueAs: (v) => (v === '' || v === undefined ? null : parseFloat(v)),
                  })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="stock_min" className="mb-2 block">Stock minimum</Label>
              <Input
                id="stock_min"
                type="number"
                {...register('stock_min', { valueAsNumber: true })}
                error={errors.stock_min?.message}
              />
            </div>

            {/* Catégorie */}
            <div>
              <Label className="mb-2 block">Catégorie</Label>
              <div className="flex gap-2">
                <select
                  {...register('category_id')}
                  className="flex-1 min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 py-2 dark:bg-slate-800"
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <Input
                    placeholder="Nouvelle catégorie"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="min-w-[120px]"
                  />
                  <Button type="button" size="icon" variant="secondary" onClick={addCategory}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Marque */}
            <div>
              <Label className="mb-2 block">Marque</Label>
              <div className="flex gap-2">
                <select
                  {...register('brand_id')}
                  className="flex-1 min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 py-2 dark:bg-slate-800"
                >
                  <option value="">—</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <Input
                    placeholder="Nouvelle marque"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="min-w-[120px]"
                  />
                  <Button type="button" size="icon" variant="secondary" onClick={addBrand}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
              <input
                type="checkbox"
                {...register('is_active')}
                id="is_active"
                className="rounded border-[var(--border-solid)] min-h-[20px] min-w-[20px]"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Produit actif</Label>
            </div>

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : productId ? 'Mettre à jour' : 'Créer'}
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
