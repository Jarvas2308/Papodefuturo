import { useState } from 'react'
import type { ContributionPosition } from '../../contribution/types'
import type {
  StrategyCategory,
  StrategyCategoryId,
  StrategyDraft,
} from '../types'
import { calculateStrategyAllocationForRuntime } from '../strategyAllocation'
import {
  cloneStrategy,
  createStrategyDraft,
  strategyFromDraft,
  validateStrategy,
} from '../utils/strategy'
import { StrategyCategorySection } from './StrategyCategorySection'
import { StrategySummaryCards } from './StrategySummaryCards'
import { StrategyToolbar } from './StrategyToolbar'
import { StrategyValidationPanel } from './StrategyValidationPanel'

type StrategyEditorProps = {
  initialStrategy: StrategyCategory[]
  defaultStrategy: StrategyCategory[]
  positions: ContributionPosition[]
  isDemo: boolean
  onSave(strategy: StrategyCategory[]): Promise<void>
}

export function StrategyEditor({
  initialStrategy,
  defaultStrategy,
  positions,
  isDemo,
  onSave,
}: StrategyEditorProps) {
  const [appliedStrategy, setAppliedStrategy] = useState(() =>
    cloneStrategy(initialStrategy)
  )
  const [draft, setDraft] = useState<StrategyDraft>(() =>
    createStrategyDraft(initialStrategy)
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  const activeStrategy = isEditing
    ? strategyFromDraft(appliedStrategy, draft)
    : appliedStrategy
  const validation = validateStrategy(activeStrategy)
  const allocations = calculateStrategyAllocationForRuntime(
    activeStrategy,
    positions
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

  async function applyChanges() {
    if (!validation.isValid || !hasChanges || isSaving) {
      return
    }

    const nextStrategy = cloneStrategy(activeStrategy)
    setIsSaving(true)
    setFeedback('')

    try {
      await onSave(nextStrategy)
      setAppliedStrategy(nextStrategy)
      setDraft(createStrategyDraft(nextStrategy))
      setIsEditing(false)
      setFeedback(
        isDemo
          ? 'Simulação aplicada apenas nesta sessão. Nenhum dado foi persistido.'
          : 'Estratégia salva com sucesso na sua conta.'
      )
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a estratégia.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  function cancelChanges() {
    setDraft(createStrategyDraft(appliedStrategy))
    setIsEditing(false)
    setFeedback('Alterações não aplicadas foram descartadas.')
  }

  function restoreDefault() {
    if (isEditing) {
      setDraft(createStrategyDraft(defaultStrategy))
      setFeedback('Estratégia padrão preparada. Aplique para confirmar.')
      return
    }

    const nextDefault = cloneStrategy(defaultStrategy)
    setAppliedStrategy(nextDefault)
    setDraft(createStrategyDraft(nextDefault))
    setFeedback(
      isDemo
        ? 'Estratégia padrão restaurada apenas nesta sessão.'
        : 'Estratégia padrão preparada localmente. Edite e aplique para persistir.'
    )
  }

  return (
    <>
      <StrategyToolbar
        isEditing={isEditing}
        isValid={validation.isValid}
        hasChanges={hasChanges && !isSaving}
        onEdit={startEditing}
        onApply={() => void applyChanges()}
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
    </>
  )
}
