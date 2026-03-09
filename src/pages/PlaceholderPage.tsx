
interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
        <p className="text-[var(--text-muted)]">Module à développer (étape 5).</p>
      </div>
    </div>
  )
}
