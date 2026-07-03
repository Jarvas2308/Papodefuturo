import { Pencil, RotateCcw, Save, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

type StrategyToolbarProps = {
  isEditing: boolean
  isValid: boolean
  hasChanges: boolean
  onEdit: () => void
  onApply: () => void
  onCancel: () => void
  onRestore: () => void
}

export function StrategyToolbar({
  isEditing,
  isValid,
  hasChanges,
  onEdit,
  onApply,
  onCancel,
  onRestore,
}: StrategyToolbarProps) {
  return (
    <Card className="flex flex-col gap-5 border-[color:color-mix(in_srgb,var(--color-brand)_22%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-brand-subtle)_45%,white)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="inline-flex rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-strong)]">
          Configuração demonstrativa
        </span>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
          As alterações ficam somente nesta sessão e não são persistidas. Um
          refresh restaura a estratégia padrão.
        </p>
        {isEditing ? (
          <p className="mt-2 text-sm font-semibold text-[var(--color-brand-strong)]">
            {hasChanges
              ? 'Existem alterações ainda não aplicadas.'
              : 'Nenhuma alteração pendente.'}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <Button variant="secondary" onClick={onRestore}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Restaurar padrão
            </Button>
            <Button variant="secondary" onClick={onCancel}>
              <X className="size-4" aria-hidden="true" />
              Cancelar
            </Button>
            <Button
              onClick={onApply}
              disabled={!isValid || !hasChanges}
              aria-describedby={
                !isValid ? 'strategy-validation-title' : undefined
              }
            >
              <Save className="size-4" aria-hidden="true" />
              Aplicar alterações
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onRestore}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Restaurar padrão
            </Button>
            <Button onClick={onEdit}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar estratégia
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
