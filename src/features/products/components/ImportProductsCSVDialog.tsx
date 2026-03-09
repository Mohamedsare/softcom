import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui'
import { Upload, FileText } from 'lucide-react'
import { productsApi } from '../api/productsApi'
import { parseProductsCsv } from '../utils/productsCsv'
import { toast } from 'sonner'

interface ImportProductsCSVDialogProps {
  companyId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ImportProductsCSVDialog({
  companyId,
  open,
  onClose,
  onSuccess,
}: ImportProductsCSVDialogProps) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ count: number; errors: string[] } | null>(null)

  const importMutation = useMutation({
    mutationFn: (rows: ReturnType<typeof parseProductsCsv>) =>
      productsApi.importFromCsv(companyId, rows),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId] })
      if (result.created > 0) {
        toast.success(`${result.created} produit(s) importé(s)`)
        onSuccess()
        onClose()
      }
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} erreur(s) lors de l'import`)
        setPreview((p) => p ? { ...p, errors: result.errors } : null)
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    setFile(f ?? null)
    setPreview(null)
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const rows = parseProductsCsv(text)
      if (rows.length === 0) {
        setPreview({ count: 0, errors: ['Aucune ligne produit valide trouvée. Vérifiez le format (header: nom, sku, ...)'] })
      } else {
        setPreview({ count: rows.length, errors: [] })
      }
    }
    reader.readAsText(f, 'utf-8')
  }

  const handleImport = () => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseProductsCsv(reader.result as string)
      importMutation.mutate(rows)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
            Importer des produits (CSV)
          </Dialog.Title>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Colonnes acceptées : nom, sku, code_barres, unite, prix_achat, prix_vente, prix_min, stock_min, description, actif (1/0), categorie, marque
          </p>
          <div className="mt-4 space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border-solid)] p-6 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 touch-manipulation min-h-[80px]"
            >
              {file ? (
                <>
                  <FileText className="h-10 w-10 shrink-0 text-[var(--accent)]" />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{file.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {file.size > 1024 ? `${(file.size / 1024).toFixed(1)} Ko` : `${file.size} octets`}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 shrink-0 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-secondary)]">Cliquez pour sélectionner un fichier CSV</span>
                </>
              )}
            </button>

            {preview && (
              <div className="rounded-lg border border-[var(--border-solid)] p-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {preview.count} produit(s) à importer
                </p>
                {preview.errors.length > 0 && (
                  <ul className="mt-2 max-h-32 overflow-y-auto text-sm text-[var(--danger)] space-y-1">
                    {preview.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {preview.errors.length > 10 && (
                      <li>... et {preview.errors.length - 10} autre(s)</li>
                    )}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleImport}
                disabled={!file || preview?.count === 0 || importMutation.isPending}
              >
                {importMutation.isPending ? 'Import en cours...' : 'Importer'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Annuler
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
