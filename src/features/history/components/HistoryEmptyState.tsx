import { SearchX } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

export function HistoryEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-6 py-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
        <SearchX className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-[var(--color-text)]">
        Nenhuma movimentação encontrada
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
        Não existem movimentações demonstrativas para os filtros escolhidos.
      </p>
      <Button variant="secondary" onClick={onClear} className="mt-5">
        Limpar filtros
      </Button>
    </div>
  )
}
