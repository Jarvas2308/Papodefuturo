import type { ReactNode } from 'react'
import { Clock3 } from 'lucide-react'
import { Card } from './Card'

type ComingSoonCardProps = {
  message: string
  detail: ReactNode
}

export function ComingSoonCard({ message, detail }: ComingSoonCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-strong)]">
            <Clock3 className="size-4" />
            Etapa em construção
          </span>
          <p className="mt-4 text-lg font-semibold text-[var(--color-text)]">
            {message}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            {detail}
          </p>
        </div>
        <div className="grid min-w-52 gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Próxima entrega
          </span>
          <p className="text-sm font-medium text-[var(--color-text)]">
            Conteúdo funcional e dados reais entram nas etapas específicas do
            produto.
          </p>
        </div>
      </div>
    </Card>
  )
}
