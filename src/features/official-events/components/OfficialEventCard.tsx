import { ExternalLink, FileCheck2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type { OfficialAssetEventV1 } from '../../../domain/context/official-events'
import {
  formatOfficialEventTemporal,
  getOfficialEventSourceLabel,
  getOfficialEventStatusLabel,
  getOfficialEventTypeLabel,
  getSafeOfficialDocumentUrl,
} from '../presentation'

export function OfficialEventStatusBadge({
  status,
}: {
  status: OfficialAssetEventV1['status']
}) {
  const isOriginal = status === 'original'
  return (
    <span
      className={
        isOriginal
          ? 'inline-flex rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-strong)]'
          : 'inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900'
      }
    >
      Status: {getOfficialEventStatusLabel(status)}
    </span>
  )
}

export function OfficialEventCard({
  event,
  onOpen,
}: {
  event: OfficialAssetEventV1
  onOpen: (trigger: HTMLButtonElement) => void
}) {
  const documentUrl = getSafeOfficialDocumentUrl(event)
  const broadClassification = event.eventType === 'other-official-event'

  return (
    <article className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div
        className="absolute inset-y-0 left-0 w-1 bg-[var(--color-brand)]"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-brand-strong)] px-3 py-1 text-sm font-bold tracking-wide text-white">
              {event.assetIdentity.ticker}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              {getOfficialEventSourceLabel(event.source)}
            </span>
            <OfficialEventStatusBadge status={event.status} />
          </div>
          <h3 className="mt-4 break-words text-lg font-semibold leading-7 text-[var(--color-text)] sm:text-xl">
            {event.title}
          </h3>
          <p className="mt-1 break-words text-sm text-[var(--color-text-muted)]">
            {event.assetIdentity.officialName}
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
          <FileCheck2 className="size-3.5" aria-hidden="true" /> Documento
          oficial
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1.5 text-[var(--color-text)]">
          {getOfficialEventTypeLabel(event.eventType)}
        </span>
        {broadClassification ? (
          <span className="rounded-full border border-[var(--color-border-strong)] px-3 py-1.5 text-[var(--color-text-muted)]">
            Classificação ampla
          </span>
        ) : null}
      </div>

      {event.summary ? (
        <p className="mt-4 line-clamp-3 break-words text-sm leading-6 text-[var(--color-text-muted)]">
          {event.summary}
        </p>
      ) : null}

      <dl className="mt-5 grid gap-3 border-t border-[var(--color-border)] pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--color-text-muted)]">Publicado em</dt>
          <dd className="mt-1 font-medium text-[var(--color-text)]">
            {formatOfficialEventTemporal(event.publishedAt)}
          </dd>
        </div>
        {event.occurredAt ? (
          <div>
            <dt className="text-[var(--color-text-muted)]">Data do evento</dt>
            <dd className="mt-1 font-medium text-[var(--color-text)]">
              {formatOfficialEventTemporal(event.occurredAt)}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="secondary"
          className="sm:w-auto"
          onClick={(clickEvent) => onOpen(clickEvent.currentTarget)}
          aria-label={`Ver detalhes de ${event.title}`}
        >
          Ver detalhes
        </Button>
        {documentUrl ? (
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold text-[var(--color-brand-strong)] outline-none hover:bg-[var(--color-brand-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
            aria-label="Abrir documento oficial em uma nova aba"
          >
            Abrir documento oficial
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  )
}
