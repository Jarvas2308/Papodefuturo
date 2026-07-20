import { Filter, RotateCcw } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import {
  OFFICIAL_EVENT_SOURCES,
  OFFICIAL_EVENT_STATUSES,
  OFFICIAL_EVENT_TICKER_GROUPS,
  OFFICIAL_EVENT_TYPES,
  isOfficialEventsDateRangeValid,
} from '../presentation'
import type { OfficialEventsFiltersV1 } from '../types'

type OfficialEventsFiltersProps = {
  value: OfficialEventsFiltersV1
  onChange: (filters: OfficialEventsFiltersV1) => void
  onApply: () => void
  onClear: () => void
}

const inputClassName =
  'min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]'

function toggleValue<Value extends string>(
  values: readonly Value[],
  value: Value,
  checked: boolean
): Value[] {
  return checked
    ? values.includes(value)
      ? [...values]
      : [...values, value]
    : values.filter((candidate) => candidate !== value)
}

function FilterCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[var(--color-brand)]"
      />
      <span>{label}</span>
    </label>
  )
}

export function OfficialEventsFilters({
  value,
  onChange,
  onApply,
  onClear,
}: OfficialEventsFiltersProps) {
  const validRange = isOfficialEventsDateRangeValid(value)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (validRange) onApply()
      }}
      className="space-y-4"
      aria-label="Filtros da timeline de eventos oficiais"
    >
      <div className="flex items-center gap-2">
        <Filter
          className="size-4 text-[var(--color-brand)]"
          aria-hidden="true"
        />
        <h2 className="font-semibold text-[var(--color-text)]">
          Filtrar eventos
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text)]">
            Ativos {value.tickers.length > 0 ? `(${value.tickers.length})` : ''}
          </summary>
          <div className="mt-3 max-h-72 space-y-3 overflow-y-auto">
            {OFFICIAL_EVENT_TICKER_GROUPS.map((group) => (
              <fieldset key={group.label}>
                <legend className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {group.label}
                </legend>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {group.tickers.map((ticker) => (
                    <FilterCheckbox
                      key={ticker}
                      label={ticker}
                      checked={value.tickers.includes(ticker)}
                      onChange={(checked) =>
                        onChange({
                          ...value,
                          tickers: toggleValue(value.tickers, ticker, checked),
                        })
                      }
                    />
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </details>

        <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text)]">
            Fontes {value.sources.length > 0 ? `(${value.sources.length})` : ''}
          </summary>
          <div className="mt-3 space-y-1">
            {OFFICIAL_EVENT_SOURCES.map((source) => (
              <FilterCheckbox
                key={source.value}
                label={source.label}
                checked={value.sources.includes(source.value)}
                onChange={(checked) =>
                  onChange({
                    ...value,
                    sources: toggleValue(value.sources, source.value, checked),
                  })
                }
              />
            ))}
          </div>
        </details>

        <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text)]">
            Tipos{' '}
            {value.eventTypes.length > 0 ? `(${value.eventTypes.length})` : ''}
          </summary>
          <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
            {OFFICIAL_EVENT_TYPES.map((type) => (
              <FilterCheckbox
                key={type.value}
                label={type.label}
                checked={value.eventTypes.includes(type.value)}
                onChange={(checked) =>
                  onChange({
                    ...value,
                    eventTypes: toggleValue(
                      value.eventTypes,
                      type.value,
                      checked
                    ),
                  })
                }
              />
            ))}
          </div>
        </details>

        <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text)]">
            Status{' '}
            {value.statuses.length > 0 ? `(${value.statuses.length})` : ''}
          </summary>
          <div className="mt-3 space-y-1">
            {OFFICIAL_EVENT_STATUSES.map((status) => (
              <FilterCheckbox
                key={status.value}
                label={status.label}
                checked={value.statuses.includes(status.value)}
                onChange={(checked) =>
                  onChange({
                    ...value,
                    statuses: toggleValue(
                      value.statuses,
                      status.value,
                      checked
                    ),
                  })
                }
              />
            ))}
          </div>
        </details>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_auto_auto] xl:items-end">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Publicado a partir de
          </span>
          <input
            type="date"
            value={value.publishedFrom}
            max={value.publishedTo || undefined}
            onChange={(event) =>
              onChange({ ...value, publishedFrom: event.target.value })
            }
            className={inputClassName}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Publicado até
          </span>
          <input
            type="date"
            value={value.publishedTo}
            min={value.publishedFrom || undefined}
            onChange={(event) =>
              onChange({ ...value, publishedTo: event.target.value })
            }
            className={inputClassName}
          />
        </label>
        <Button type="submit" disabled={!validRange} className="min-h-11">
          Aplicar filtros
        </Button>
        <Button
          variant="secondary"
          onClick={onClear}
          className="min-h-11 whitespace-nowrap"
        >
          <RotateCcw className="size-4" aria-hidden="true" /> Limpar filtros
        </Button>
      </div>
      {!validRange ? (
        <p role="alert" className="text-sm text-[var(--color-alert)]">
          A data inicial deve ser anterior ou igual à data final.
        </p>
      ) : null}
    </form>
  )
}
