import { Sparkles } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { AiExplanationV1 } from '../../../domain/aiExplanation'

type AiExplanationProps = {
  explanation: AiExplanationV1
}

const CONVICTION_LABELS = {
  low: 'Convicção baixa',
  medium: 'Convicção média',
  high: 'Convicção alta',
} as const

export function AiExplanation({ explanation }: AiExplanationProps) {
  return (
    <Card className="space-y-4 p-5 sm:p-6" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-strong)]">
          <Sparkles className="size-4" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            Explicação gerada por IA
          </p>
          <span className="inline-flex rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-muted)]">
            {CONVICTION_LABELS[explanation.convictionLevel]}
          </span>
        </div>
      </div>

      <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-text-muted)]">
        {explanation.facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>

      <div className="space-y-3 text-sm leading-6 text-[var(--color-text-muted)]">
        <p>{explanation.interpretation}</p>
        <p>{explanation.technicalPlanSummary}</p>
        <p>{explanation.comparativeExplanation}</p>
      </div>

      <p className="text-xs leading-5 text-[var(--color-text-muted)]">
        A IA apenas interpreta o plano técnico já calculado pelo motor
        determinístico. Ela não cria, seleciona nem modifica o plano, não
        recomenda ativos e não executa ordens.
      </p>
    </Card>
  )
}
