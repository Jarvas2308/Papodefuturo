import { useEffect, useEffectEvent, useId, useRef, type RefObject } from 'react'
import { ExternalLink, FileClock, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type { OfficialAssetEventV1 } from '../../../domain/context/official-events'
import { useOfficialEventDetailsV1 } from '../hooks'
import {
  formatOfficialEventTemporal,
  getDocumentIdentityLabel,
  getOfficialEventCategoryLabel,
  getOfficialEventSourceLabel,
  getOfficialEventStatusLabel,
  getOfficialEventTypeLabel,
  getSafeOfficialDocumentUrl,
} from '../presentation'
import type { OfficialEventsUiDependenciesV1 } from '../types'
import { OfficialEventStatusBadge } from './OfficialEventCard'

function DetailItem({ label, value }: { label: string; value: string | null }) {
  if (value === null || value === '') return null
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-[var(--color-text)]">
        {value}
      </dd>
    </div>
  )
}

function OfficialDocumentLink({ event }: { event: OfficialAssetEventV1 }) {
  const documentUrl = getSafeOfficialDocumentUrl(event)
  if (documentUrl === null) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Link oficial não disponibilizado pela fonte.
      </p>
    )
  }
  return (
    <a
      href={documentUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand)] px-4 text-sm font-semibold text-white outline-none hover:bg-[var(--color-brand-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 sm:w-auto"
      aria-label="Abrir documento oficial em uma nova aba"
    >
      Abrir documento oficial
      <ExternalLink className="size-4" aria-hidden="true" />
    </a>
  )
}

export function OfficialEventDetailsContent({
  event,
  previousStatus,
  previousEvent,
  onLoadPrevious,
}: {
  event: OfficialAssetEventV1
  previousStatus: 'idle' | 'loading' | 'not-found' | 'failed' | 'succeeded'
  previousEvent: OfficialAssetEventV1 | null
  onLoadPrevious: () => void
}) {
  return (
    <div className="space-y-7">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--color-brand-strong)] px-3 py-1 text-sm font-bold text-white">
            {event.assetIdentity.ticker}
          </span>
          <OfficialEventStatusBadge status={event.status} />
        </div>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          {event.assetIdentity.officialName}
        </p>
        <h3 className="mt-2 break-words text-xl font-semibold leading-8 text-[var(--color-text)] sm:text-2xl">
          {event.title}
        </h3>
        {event.summary ? (
          <p className="mt-3 break-words text-sm leading-6 text-[var(--color-text-muted)]">
            {event.summary}
          </p>
        ) : null}
      </div>

      <dl className="grid gap-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-4 sm:grid-cols-2">
        <DetailItem
          label="Fonte"
          value={getOfficialEventSourceLabel(event.source)}
        />
        <DetailItem
          label="Tipo"
          value={getOfficialEventTypeLabel(event.eventType)}
        />
        <DetailItem
          label="Status"
          value={getOfficialEventStatusLabel(event.status)}
        />
        <DetailItem
          label="Categoria do ativo"
          value={getOfficialEventCategoryLabel(event.assetIdentity.category)}
        />
        <DetailItem
          label="Publicado em"
          value={formatOfficialEventTemporal(event.publishedAt)}
        />
        <DetailItem
          label="Data do evento"
          value={formatOfficialEventTemporal(event.occurredAt)}
        />
        <DetailItem
          label="Jurisdição"
          value={event.jurisdiction === 'BR' ? 'Brasil' : 'Estados Unidos'}
        />
        <DetailItem
          label="Idioma"
          value={
            event.language === 'pt-BR'
              ? 'Português do Brasil'
              : 'Inglês dos Estados Unidos'
          }
        />
      </dl>

      <section aria-labelledby="document-identification-title">
        <h4
          id="document-identification-title"
          className="font-semibold text-[var(--color-text)]"
        >
          Identificação do documento
        </h4>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <DetailItem
            label={getDocumentIdentityLabel(event.documentIdentity.kind)}
            value={event.documentIdentity.value}
          />
          <DetailItem
            label="Protocolo"
            value={event.documentIdentifiers.protocolNumber}
          />
          <DetailItem
            label="Número de acesso SEC"
            value={event.documentIdentifiers.accessionNumber}
          />
          <DetailItem
            label="Identificador regulatório"
            value={event.documentIdentifiers.regulatoryDocumentId}
          />
          <DetailItem
            label="Identificador da fonte"
            value={event.sourceDocumentId}
          />
        </dl>
      </section>

      {event.relatedDocuments.length > 0 ? (
        <section aria-labelledby="related-documents-title">
          <h4
            id="related-documents-title"
            className="font-semibold text-[var(--color-text)]"
          >
            Documentos relacionados
          </h4>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {event.relatedDocuments.length}{' '}
            {event.relatedDocuments.length === 1
              ? 'documento oficial relacionado.'
              : 'documentos oficiais relacionados.'}
          </p>
        </section>
      ) : null}

      {event.supersedesEventId ? (
        <section
          className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-4"
          aria-labelledby="revision-title"
        >
          <div className="flex items-start gap-3">
            <FileClock
              className="mt-0.5 size-5 shrink-0 text-amber-800"
              aria-hidden="true"
            />
            <div>
              <h4 id="revision-title" className="font-semibold text-amber-950">
                Relação com versão anterior
              </h4>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Este documento está relacionado a uma versão oficial anterior.
              </p>
            </div>
          </div>
          {previousStatus === 'idle' ? (
            <Button
              variant="secondary"
              className="mt-3"
              onClick={onLoadPrevious}
            >
              Consultar versão anterior
            </Button>
          ) : null}
          {previousStatus === 'loading' ? (
            <p role="status" className="mt-3 text-sm text-amber-900">
              Carregando versão anterior...
            </p>
          ) : null}
          {previousStatus === 'not-found' ? (
            <p className="mt-3 text-sm text-amber-900">
              A versão anterior não foi encontrada nesta consulta.
            </p>
          ) : null}
          {previousStatus === 'failed' ? (
            <p role="alert" className="mt-3 text-sm text-amber-900">
              Não foi possível consultar a versão anterior.
            </p>
          ) : null}
          {previousStatus === 'succeeded' && previousEvent ? (
            <div className="mt-3 border-t border-amber-200 pt-3">
              <p className="text-sm font-semibold text-amber-950">
                {previousEvent.title}
              </p>
              <p className="mt-1 text-sm text-amber-900">
                Publicado em{' '}
                {formatOfficialEventTemporal(previousEvent.publishedAt)}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <OfficialDocumentLink event={event} />
    </div>
  )
}

export function OfficialEventDetailsDialog({
  eventId,
  dependencies,
  onClose,
  triggerRef,
}: {
  eventId: string
  dependencies: OfficialEventsUiDependenciesV1
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}) {
  const details = useOfficialEventDetailsV1(dependencies.runtime)
  const openDetails = useEffectEvent(details.open)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    void openDetails(eventId)
  }, [eventId])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const returnFocusTarget = triggerRef.current
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const elements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      )
      const first = elements[0]
      const last = elements.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      returnFocusTarget?.focus()
    }
  }, [onClose, triggerRef])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40"
        onClick={onClose}
        aria-label="Fechar detalhes ao tocar no fundo"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl sm:w-[min(90vw,42rem)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <h2
            id={titleId}
            className="text-lg font-semibold text-[var(--color-text)]"
          >
            Detalhes do evento oficial
          </h2>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar detalhes do evento"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {details.state.status === 'closed' ||
          details.state.status === 'loading' ? (
            <p role="status" className="text-sm text-[var(--color-text-muted)]">
              Carregando detalhes do evento...
            </p>
          ) : details.state.status === 'succeeded' && details.state.event ? (
            <OfficialEventDetailsContent
              event={details.state.event}
              previousStatus={details.state.previousStatus}
              previousEvent={details.state.previousEvent}
              onLoadPrevious={() => void details.loadPrevious()}
            />
          ) : details.state.status === 'not-found' ? (
            <p role="status" className="text-sm text-[var(--color-text-muted)]">
              O evento não foi encontrado.
            </p>
          ) : (
            <p role="alert" className="text-sm text-[var(--color-alert)]">
              Não foi possível carregar os detalhes do evento.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
