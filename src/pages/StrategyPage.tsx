import { useState } from 'react'
import { StrategyCategorySection } from '../features/strategy/components/StrategyCategorySection'
import { StrategySummaryCards } from '../features/strategy/components/StrategySummaryCards'
import { StrategyToolbar } from '../features/strategy/components/StrategyToolbar'
import { StrategyValidationPanel } from '../features/strategy/components/StrategyValidationPanel'
import {
  strategyCurrentPositions,
  strategyMock,
} from '../features/strategy/mocks/strategyMock'
import type {
  StrategyCategoryId,
  StrategyDraft,
} from '../features/strategy/types'
import {
  calculateStrategyAllocation,
  cloneStrategy,
  createStrategyDraft,
  strategyFromDraft,
  validateStrategy,
} from '../features/strategy/utils/strategy'

export function StrategyPage() {
  const [appliedStrategy, setAppliedStrategy] = useState(() =>
    cloneStrategy(strategyMock)
  )
  const [draft, setDraft] = useState<StrategyDraft>(() =>
    createStrategyDraft(strategyMock)
  )
  const [isEditing, setIsEditing] = useState(false)
  const [feedback, setFeedback] = useState('')

  const activeStrategy = isEditing
    ? strategyFromDraft(appliedStrategy, draft)
    : appliedStrategy
  const validation = validateStrategy(activeStrategy)
  const allocations = calculateStrategyAllocation(
    activeStrategy,
    strategyCurrentPositions
  )
  const hasChanges =
    JSON.stringify(draft) !==
    JSON.stringify(createStrategyDraft(appliedStrategy))

  function startEditing() {
    setDraft(createStrategyDraft(appliedStrategy))
    setFeedback('')
    setIsEditing(true)
  }

  function updateCategoryTarget(categoryId: StrategyCategoryId, value: string) {
    setDraft((current) => ({
      categories: current.categories.map((category) =>
        category.id === categoryId
          ? { ...category, targetPercentage: value }
          : category
      ),
    }))
  }

  function updateAssetTarget(
    categoryId: StrategyCategoryId,
    assetId: string,
    value: string
  ) {
    setDraft((current) => ({
      categories: current.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              assets: category.assets.map((asset) =>
                asset.assetId === assetId
                  ? { ...asset, targetPercentage: value }
                  : asset
              ),
            }
          : category
      ),
    }))
  }

  function applyChanges() {
    if (!validation.isValid || !hasChanges) {
      return
    }

    const nextStrategy = cloneStrategy(activeStrategy)
    setAppliedStrategy(nextStrategy)
    setDraft(createStrategyDraft(nextStrategy))
    setIsEditing(false)
    setFeedback(
      'Simulação aplicada apenas nesta sessão. Nenhum dado foi persistido.'
    )
  }

  function cancelChanges() {
    setDraft(createStrategyDraft(appliedStrategy))
    setIsEditing(false)
    setFeedback('Alterações não aplicadas foram descartadas.')
  }

  function restoreDefault() {
    if (isEditing) {
      setDraft(createStrategyDraft(strategyMock))
      setFeedback(
        'Estratégia padrão preparada. Aplique para usar nesta sessão.'
      )
      return
    }

    const defaultStrategy = cloneStrategy(strategyMock)
    setAppliedStrategy(defaultStrategy)
    setDraft(createStrategyDraft(defaultStrategy))
    setFeedback('Estratégia padrão restaurada apenas nesta sessão.')
  }

  return (
    <section className="space-y-6">
      <StrategyToolbar
        isEditing={isEditing}
        isValid={validation.isValid}
        hasChanges={hasChanges}
        onEdit={startEditing}
        onApply={applyChanges}
        onCancel={cancelChanges}
        onRestore={restoreDefault}
      />

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {feedback}
      </p>
      {feedback ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text)]">
          {feedback}
        </p>
      ) : null}

      <StrategySummaryCards allocations={allocations} validation={validation} />

      <StrategyValidationPanel validation={validation} />

      <div className="space-y-6">
        {allocations.map((category) => (
          <StrategyCategorySection
            key={category.id}
            category={category}
            draftCategory={draft.categories.find(
              (candidate) => candidate.id === category.id
            )}
            isEditing={isEditing}
            isInvalid={validation.invalidCategoryIds.includes(category.id)}
            onCategoryTargetChange={(value) =>
              updateCategoryTarget(category.id, value)
            }
            onAssetTargetChange={(assetId, value) =>
              updateAssetTarget(category.id, assetId, value)
            }
          />
        ))}
      </div>

      <p className="text-xs leading-5 text-[var(--color-text-muted)]">
        Esta visualização não classifica ativos como bons ou ruins e não
        representa recomendação, plano de compra ou execução financeira.
      </p>
    </section>
  )
}
