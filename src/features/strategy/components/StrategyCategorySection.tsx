import { Target } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type {
  StrategyCategoryAllocation,
  StrategyDraftCategory,
} from '../types'
import {
  formatBasisPoints,
  formatCurrencyFromCents,
  formatDeviation,
  formatGlobalTargetProduct,
} from '../utils/strategy'
import { StrategyStatusBadge } from './StrategyStatusBadge'

type StrategyCategorySectionProps = {
  category: StrategyCategoryAllocation
  draftCategory?: StrategyDraftCategory
  isEditing: boolean
  isInvalid: boolean
  onCategoryTargetChange: (value: string) => void
  onAssetTargetChange: (assetId: string, value: string) => void
}

const inputClassName =
  'min-h-11 w-28 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-right text-sm font-semibold text-[var(--color-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]'

function PercentageInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2">
      <span className="sr-only">{label}</span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
        aria-label={label}
      />
      <span className="text-sm font-semibold text-[var(--color-text-muted)]">
        %
      </span>
    </label>
  )
}

export function StrategyCategorySection({
  category,
  draftCategory,
  isEditing,
  isInvalid,
  onCategoryTargetChange,
  onAssetTargetChange,
}: StrategyCategorySectionProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[var(--radius-xl)] border bg-[var(--color-surface)] shadow-[var(--shadow-soft)]',
        isInvalid
          ? 'border-[color:color-mix(in_srgb,var(--color-alert)_45%,var(--color-border))]'
          : 'border-[var(--color-border)]'
      )}
      aria-labelledby={`strategy-category-${category.id}`}
    >
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
                <Target className="size-4" aria-hidden="true" />
              </span>
              <h2
                id={`strategy-category-${category.id}`}
                className="text-xl font-semibold text-[var(--color-text)]"
              >
                {category.name}
              </h2>
              <StrategyStatusBadge status={category.status} />
            </div>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              {category.assets.length} ativos · valor atual{' '}
              {formatCurrencyFromCents(category.currentValueInCents)}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[var(--color-text-muted)]">Atual</dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {formatBasisPoints(category.currentInBasisPoints)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Meta</dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {isEditing ? (
                  <PercentageInput
                    id={`category-target-${category.id}`}
                    label={`Meta da categoria ${category.name}`}
                    value={draftCategory?.targetPercentage ?? ''}
                    onChange={onCategoryTargetChange}
                  />
                ) : (
                  formatBasisPoints(category.targetInBasisPoints)
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Desvio</dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {formatDeviation(category.deviationInBasisPoints)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Metas internas</dt>
              <dd className="mt-1 font-semibold text-[var(--color-text)]">
                {formatBasisPoints(category.internalTargetTotalInBasisPoints)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>Participação atual</span>
            <span>Meta {formatBasisPoints(category.targetInBasisPoints)}</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-[var(--color-border)]"
            role="progressbar"
            aria-label={`Participação atual de ${category.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={category.currentInBasisPoints / 100}
          >
            <div
              className="h-full rounded-full bg-[var(--color-brand)]"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, category.currentInBasisPoints / 100)
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="hidden xl:block">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            Metas demonstrativas dos ativos de {category.name}
          </caption>
          <thead>
            <tr>
              {[
                'Ativo',
                'Atual global',
                'Meta na categoria',
                'Meta global',
                'Desvio',
                'Status',
              ].map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {category.assets.map((asset) => (
              <tr
                key={asset.assetId}
                className="border-t border-[var(--color-border)]"
              >
                <th scope="row" className="px-5 py-4 text-left">
                  <span className="block text-sm font-semibold text-[var(--color-text)]">
                    {asset.ticker}
                  </span>
                  <span className="mt-1 block text-xs font-normal text-[var(--color-text-muted)]">
                    {asset.assetName}
                  </span>
                </th>
                <td className="px-5 py-4 text-sm font-medium text-[var(--color-text)]">
                  {formatBasisPoints(asset.currentGlobalInBasisPoints)}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-[var(--color-text)]">
                  {isEditing ? (
                    <PercentageInput
                      id={`asset-target-${category.id}-${asset.assetId}`}
                      label={`Meta de ${asset.ticker} dentro de ${category.name}`}
                      value={
                        draftCategory?.assets.find(
                          (candidate) => candidate.assetId === asset.assetId
                        )?.targetPercentage ?? ''
                      }
                      onChange={(value) =>
                        onAssetTargetChange(asset.assetId, value)
                      }
                    />
                  ) : (
                    formatBasisPoints(asset.targetWithinCategoryInBasisPoints)
                  )}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-[var(--color-text)]">
                  {formatGlobalTargetProduct(asset.globalTargetProduct)}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-[var(--color-text)]">
                  {formatDeviation(asset.deviationInBasisPoints)}
                </td>
                <td className="px-5 py-4">
                  <StrategyStatusBadge status={asset.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-4 p-4 md:grid-cols-2 xl:hidden">
        {category.assets.map((asset) => (
          <li
            key={asset.assetId}
            className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-text)]">
                  {asset.ticker}
                </p>
                <p className="mt-1 break-words text-sm text-[var(--color-text-muted)]">
                  {asset.assetName}
                </p>
              </div>
              <StrategyStatusBadge status={asset.status} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-4 text-sm">
              <div>
                <dt className="text-[var(--color-text-muted)]">Atual global</dt>
                <dd className="mt-1 font-semibold text-[var(--color-text)]">
                  {formatBasisPoints(asset.currentGlobalInBasisPoints)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">Meta global</dt>
                <dd className="mt-1 font-semibold text-[var(--color-text)]">
                  {formatGlobalTargetProduct(asset.globalTargetProduct)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">Desvio</dt>
                <dd className="mt-1 font-semibold text-[var(--color-text)]">
                  {formatDeviation(asset.deviationInBasisPoints)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">
                  Meta na categoria
                </dt>
                <dd className="mt-1 font-semibold text-[var(--color-text)]">
                  {isEditing ? (
                    <PercentageInput
                      id={`asset-target-mobile-${category.id}-${asset.assetId}`}
                      label={`Meta de ${asset.ticker} dentro de ${category.name}`}
                      value={
                        draftCategory?.assets.find(
                          (candidate) => candidate.assetId === asset.assetId
                        )?.targetPercentage ?? ''
                      }
                      onChange={(value) =>
                        onAssetTargetChange(asset.assetId, value)
                      }
                    />
                  ) : (
                    formatBasisPoints(asset.targetWithinCategoryInBasisPoints)
                  )}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  )
}
