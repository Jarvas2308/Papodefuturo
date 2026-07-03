import { Pencil, RotateCcw, Save, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

type SettingsToolbarProps = {
  isEditing: boolean
  isValid: boolean
  hasChanges: boolean
  onEdit: () => void
  onApply: () => void
  onCancel: () => void
  onRestore: () => void
}

export function SettingsToolbar({
  isEditing,
  isValid,
  hasChanges,
  onEdit,
  onApply,
  onCancel,
  onRestore,
}: SettingsToolbarProps) {
  return (
    <Card className="flex flex-col gap-5 border-[color:color-mix(in_srgb,var(--color-brand)_22%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-brand-subtle)_45%,white)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="inline-flex rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-strong)]">
          Preferências demonstrativas
        </span>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
          As alterações ficam somente nesta página. Um refresh restaura as
          configurações padrão e nenhuma preferência afeta as demais telas.
        </p>
        {isEditing ? (
          <p className="mt-2 text-sm font-semibold text-[var(--color-brand-strong)]">
            {hasChanges
              ? 'Existem alterações ainda não aplicadas.'
              : 'Nenhuma alteração pendente.'}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
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
                !isValid ? 'settings-validation-title' : undefined
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
              Editar configurações
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
