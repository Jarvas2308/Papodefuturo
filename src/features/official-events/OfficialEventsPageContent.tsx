import { useRef, useState } from 'react'
import { FileCheck2, Landmark, ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { OfficialEventCard } from './components/OfficialEventCard'
import { OfficialEventDetailsDialog } from './components/OfficialEventDetailsDialog'
import { OfficialEventsFilters } from './components/OfficialEventsFilters'
import {
  OfficialEventsInitialSkeleton,
  OfficialEventsState,
} from './components/OfficialEventsState'
import { useOfficialEventsTimelineV1 } from './hooks'
import {
  EMPTY_OFFICIAL_EVENTS_FILTERS,
  cloneOfficialEventsFilters,
  hasOfficialEventsFilters,
} from './presentation'
import type {
  OfficialEventsFiltersV1,
  OfficialEventsUiDependenciesV1,
} from './types'

export function OfficialEventsPageContent({
  dependencies,
}: {
  dependencies: OfficialEventsUiDependenciesV1
}) {
  const [draftFilters, setDraftFilters] = useState<OfficialEventsFiltersV1>(
    () => cloneOfficialEventsFilters(EMPTY_OFFICIAL_EVENTS_FILTERS)
  )
  const [appliedFilters, setAppliedFilters] = useState<OfficialEventsFiltersV1>(
    () => cloneOfficialEventsFilters(EMPTY_OFFICIAL_EVENTS_FILTERS)
  )
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const detailsTriggerRef = useRef<HTMLButtonElement | null>(null)
  const timeline = useOfficialEventsTimelineV1(
    dependencies.runtime,
    appliedFilters
  )
  const capability = dependencies.runtime.getCapability()

  function clearFilters() {
    const empty = cloneOfficialEventsFilters(EMPTY_OFFICIAL_EVENTS_FILTERS)
    setDraftFilters(empty)
    setAppliedFilters(cloneOfficialEventsFilters(empty))
  }

  function openDetails(eventId: string, trigger: HTMLButtonElement) {
    detailsTriggerRef.current = trigger
    setSelectedEventId(eventId)
  }

  return (
    <section
      className="space-y-6"
      aria-labelledby="official-events-section-title"
    >
      <Card className="relative overflow-hidden border-blue-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_58%,#f7fbf8_100%)] p-5 sm:p-7">
        <div
          className="absolute -right-12 -top-12 size-40 rounded-full bg-blue-200/35 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
              Contexto regulatório
            </p>
            <h2
              id="official-events-section-title"
              className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]"
            >
              Documentos oficiais dos ativos acompanhados
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
              Comunicados e documentos regulatórios publicados por CVM e SEC
              para os ativos acompanhados pela carteira.
            </p>
          </div>
          <div
            className="flex flex-wrap gap-2"
            aria-label="Fontes oficiais disponíveis"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--color-brand-strong)] shadow-sm">
              <Landmark className="size-4" aria-hidden="true" /> CVM
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--color-brand-strong)] shadow-sm">
              <ShieldCheck className="size-4" aria-hidden="true" /> SEC EDGAR
            </span>
          </div>
        </div>
        <div className="relative mt-5 flex items-start gap-3 rounded-[var(--radius-lg)] border border-blue-200 bg-white/75 p-4">
          <FileCheck2
            className="mt-0.5 size-5 shrink-0 text-[var(--color-brand)]"
            aria-hidden="true"
          />
          <p className="text-sm leading-6 text-[var(--color-text)]">
            Essas informações são de caráter informativo e não constituem
            recomendação de investimento. São eventos oficiais, não notícias
            editoriais, e não alteram o Motor V2 nem o plano técnico de aporte.
            Fontes podem atrasar, e documentos podem ser corrigidos ou
            substituídos.
          </p>
        </div>
      </Card>

      {capability.mode === 'disabled' ? (
        <OfficialEventsState status="disabled" />
      ) : (
        <>
          <Card className="p-5 sm:p-6">
            <OfficialEventsFilters
              value={draftFilters}
              onChange={setDraftFilters}
              onApply={() =>
                setAppliedFilters(cloneOfficialEventsFilters(draftFilters))
              }
              onClear={clearFilters}
            />
          </Card>

          {timeline.state.status === 'idle' ||
          timeline.state.status === 'loading' ? (
            <OfficialEventsInitialSkeleton />
          ) : timeline.state.status !== 'succeeded' ? (
            <OfficialEventsState
              status={timeline.state.status}
              onRetry={() => void timeline.reload()}
            />
          ) : timeline.state.items.length === 0 ? (
            <div
              className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center shadow-[var(--shadow-soft)]"
              role="status"
              aria-live="polite"
            >
              <h2 className="text-xl font-semibold text-[var(--color-text)]">
                Nenhum evento encontrado
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {hasOfficialEventsFilters(appliedFilters)
                  ? 'Não há eventos para a combinação de filtros aplicada.'
                  : 'Ainda não há eventos oficiais disponíveis para esta timeline.'}
              </p>
              {hasOfficialEventsFilters(appliedFilters) ? (
                <Button
                  variant="secondary"
                  className="mt-5"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </Button>
              ) : null}
            </div>
          ) : (
            <div aria-live="polite" aria-label="Timeline de eventos oficiais">
              <p className="mb-4 text-sm text-[var(--color-text-muted)]">
                {timeline.state.items.length}{' '}
                {timeline.state.items.length === 1
                  ? 'evento oficial carregado'
                  : 'eventos oficiais carregados'}
              </p>
              <ol className="space-y-4">
                {timeline.state.items.map((event) => (
                  <li key={event.eventId}>
                    <OfficialEventCard
                      event={event}
                      onOpen={(trigger) => openDetails(event.eventId, trigger)}
                    />
                  </li>
                ))}
              </ol>
              {timeline.state.nextCursor ? (
                <div className="mt-6 flex flex-col items-center gap-3">
                  {timeline.state.loadMoreFailure ? (
                    <p
                      role="alert"
                      className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900"
                    >
                      {timeline.state.loadMoreFailure === 'unavailable'
                        ? 'A próxima parte da timeline está temporariamente indisponível. Os eventos já carregados foram preservados.'
                        : 'Não foi possível carregar mais eventos. Os eventos já carregados foram preservados.'}
                    </p>
                  ) : null}
                  <Button
                    variant="secondary"
                    disabled={timeline.state.isLoadingMore}
                    onClick={() => void timeline.loadMore()}
                    aria-label="Carregar mais eventos oficiais"
                  >
                    {timeline.state.isLoadingMore
                      ? 'Carregando mais...'
                      : 'Carregar mais'}
                  </Button>
                  {timeline.state.isLoadingMore ? (
                    <span
                      role="status"
                      className="text-sm text-[var(--color-text-muted)]"
                    >
                      Carregando a próxima parte da timeline...
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {selectedEventId ? (
        <OfficialEventDetailsDialog
          eventId={selectedEventId}
          dependencies={dependencies}
          onClose={() => setSelectedEventId(null)}
          triggerRef={detailsTriggerRef}
        />
      ) : null}
    </section>
  )
}
