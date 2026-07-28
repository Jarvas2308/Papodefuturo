import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import {
  createOfficialEventsRuntimeV1,
  type OfficialEventsRuntimeV1,
} from '../../application/context/official-events/runtime'
import { SidebarContent } from '../../components/layout/Sidebar'
import { createStorageTestEvent } from '../../data/context/official-events/storage/testFixtures'
import { getNavigationItems, getPageCopyFromPath } from '../../lib/navigation'
import { OfficialEventsPageContent } from './OfficialEventsPageContent'
import { OfficialEventsUiProvider } from './OfficialEventsUiProvider'
import { OfficialEventCard } from './components/OfficialEventCard'
import {
  OfficialEventDetailsContent,
  OfficialEventDetailsDialog,
} from './components/OfficialEventDetailsDialog'
import { OfficialEventsFilters } from './components/OfficialEventsFilters'
import { OfficialEventsState } from './components/OfficialEventsState'
import {
  OFFICIAL_EVENTS_REAL_UI_MODE,
  createRealOfficialEventsUiDependenciesV1,
} from './composition'
import { EMPTY_OFFICIAL_EVENTS_FILTERS } from './presentation'

function readOnlyRuntime(): OfficialEventsRuntimeV1 {
  return createOfficialEventsRuntimeV1({
    mode: 'read-only',
    repository: {
      async getByEventId() {
        return null
      },
      async listPage(query) {
        return {
          repositoryVersion: 'official-asset-event-read-repository.v1',
          items: [],
          returned: 0,
          limit: query.limit,
          hasMore: false,
          nextCursor: null,
        }
      },
    },
    getAccessState: () => 'authenticated',
    now: {
      now: () => '2026-07-20T12:00:00Z',
    },
  })
}

describe('official events page and feature mode', () => {
  it('activates the real UI mode flag to read-only', () => {
    expect(OFFICIAL_EVENTS_REAL_UI_MODE).toBe('read-only')
  })

  it('defaults to a disabled runtime when composition receives no explicit runtime, and renders the direct-route state', () => {
    const dependencies = createRealOfficialEventsUiDependenciesV1()
    const markup = renderToStaticMarkup(
      <OfficialEventsPageContent dependencies={dependencies} />
    )

    expect(dependencies.runtime.getCapability()).toMatchObject({
      mode: 'disabled',
      canRead: false,
      reason: 'disabled',
    })
    expect(markup).toContain('Eventos oficiais ainda não estão disponíveis')
    expect(markup).toContain('ainda não foi ativado neste ambiente')
    expect(markup).not.toContain('Aplicar filtros')
  })

  it('wraps an explicitly injected read-only runtime instead of the disabled default', () => {
    const runtime = readOnlyRuntime()
    const dependencies = createRealOfficialEventsUiDependenciesV1(runtime)
    expect(dependencies.runtime).toBe(runtime)
    expect(dependencies.runtime.getCapability().mode).toBe('read-only')
  })

  it('presents the product header copy, official sources and advisory notice', () => {
    const markup = renderToStaticMarkup(
      <OfficialEventsPageContent
        dependencies={createRealOfficialEventsUiDependenciesV1()}
      />
    )
    expect(getPageCopyFromPath('/eventos-oficiais').title).toBe(
      'Eventos Oficiais'
    )
    expect(markup).toContain('Documentos oficiais dos ativos acompanhados')
    expect(markup).toContain('CVM')
    expect(markup).toContain('SEC EDGAR')
    expect(markup).toContain('não constituem recomendação de investimento')
    expect(markup).toContain('não notícias editoriais')
  })

  it('omits the navigation item in disabled mode and includes it in read-only mode', () => {
    expect(
      getNavigationItems('disabled').some(
        (item) => item.to === '/eventos-oficiais'
      )
    ).toBe(false)
    expect(
      getNavigationItems('read-only').filter(
        (item) => item.to === '/eventos-oficiais'
      )
    ).toEqual([
      {
        to: '/eventos-oficiais',
        label: 'Eventos Oficiais',
        icon: 'officialEvents',
      },
    ])
  })

  it('renders the authenticated sidebar item from one injected runtime capability', () => {
    const markup = renderToStaticMarkup(
      <OfficialEventsUiProvider dependencies={{ runtime: readOnlyRuntime() }}>
        <MemoryRouter>
          <SidebarContent collapsed={false} />
        </MemoryRouter>
      </OfficialEventsUiProvider>
    )
    expect(markup).toContain('href="/eventos-oficiais"')
    expect(markup).toContain('Eventos Oficiais')
  })
})

describe('official event cards and details', () => {
  it('renders a semantic timeline card with official status and safe actions', () => {
    const event = createStorageTestEvent({
      ticker: 'VOO',
      source: 'sec-edgar',
      documentId: '0000036405-26-000010',
    })
    const markup = renderToStaticMarkup(
      <OfficialEventCard event={event} onOpen={() => undefined} />
    )
    expect(markup).toContain('<article')
    expect(markup).toContain('VOO')
    expect(markup).toContain('SEC EDGAR')
    expect(markup).toContain('Documento oficial')
    expect(markup).toContain('Publicado em')
    expect(markup).toContain('target="_blank"')
    expect(markup).toContain('rel="noopener noreferrer"')
    expect(markup).toContain('Ver detalhes')
    expect(markup).not.toContain('sourcePayloadHash')
    expect(markup).not.toContain('rawFields')
    expect(markup).not.toContain('parserVersion')
  })

  it('communicates cancellation and broad classification with text, not color alone', () => {
    const event = {
      ...createStorageTestEvent(),
      eventType: 'other-official-event' as const,
      classificationJustification: 'Classificação oficial residual.',
      status: 'cancellation' as const,
      supersedesEventId: 'official-event:previous',
    }
    const markup = renderToStaticMarkup(
      <OfficialEventCard event={event} onOpen={() => undefined} />
    )
    expect(markup).toContain('Status: Cancelamento')
    expect(markup).toContain('Classificação ampla')
  })

  it('shows friendly details, related documents and a loaded previous version', () => {
    const previous = createStorageTestEvent({
      documentId: 'previous-document',
      title: 'Documento original',
    })
    const current = createStorageTestEvent({
      documentId: 'current-document',
      title: 'Documento corrigido',
      status: 'correction',
      supersedesEventId: previous.eventId,
    })
    const event = {
      ...current,
      relatedDocuments: [
        {
          relation: 'supporting' as const,
          eventId: previous.eventId,
        },
      ],
    }
    const markup = renderToStaticMarkup(
      <OfficialEventDetailsContent
        event={event}
        previousStatus="succeeded"
        previousEvent={previous}
        onLoadPrevious={() => undefined}
      />
    )
    expect(markup).toContain('Documento corrigido')
    expect(markup).toContain('Identificação do documento')
    expect(markup).toContain('Documentos relacionados')
    expect(markup).toContain('Documento original')
    expect(markup).toContain('Relação com versão anterior')
    expect(markup).not.toContain('sourcePayloadHash')
    expect(markup).not.toContain('mappingVersion')
    expect(markup).not.toContain('rawFields')
    expect(markup).not.toContain(current.deduplicationKey)
  })

  it('omits null fields and explains absent official URL', () => {
    const event = createStorageTestEvent({
      ticker: 'KNRI11',
      source: 'cvm-fund-delivery',
      occurredAt: null,
    })
    const markup = renderToStaticMarkup(
      <OfficialEventDetailsContent
        event={event}
        previousStatus="idle"
        previousEvent={null}
        onLoadPrevious={() => undefined}
      />
    )
    expect(markup).toContain('Data não informada')
    expect(markup).toContain('Link oficial não disponibilizado pela fonte.')
    expect(markup).not.toContain('Número de acesso SEC')
    expect(markup).not.toContain('target="_blank"')
  })
})

describe('official events accessibility structure', () => {
  it('renders the details container as a labelled modal dialog with a close control', () => {
    const markup = renderToStaticMarkup(
      <OfficialEventDetailsDialog
        eventId="official-event:test"
        dependencies={createRealOfficialEventsUiDependenciesV1()}
        onClose={() => undefined}
        triggerRef={{ current: null }}
      />
    )
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('Detalhes do evento oficial')
    expect(markup).toContain('aria-label="Fechar detalhes do evento"')
  })

  it('associates filter labels and uses semantic controls on responsive filters', () => {
    const markup = renderToStaticMarkup(
      <OfficialEventsFilters
        value={EMPTY_OFFICIAL_EVENTS_FILTERS}
        onChange={() => undefined}
        onApply={() => undefined}
        onClear={() => undefined}
      />
    )
    expect(markup).toContain('<form')
    expect(markup).toContain('<fieldset')
    expect(markup).toContain('<legend')
    expect(markup).toContain('type="checkbox"')
    expect(markup).toContain('type="date"')
    expect(markup).toContain('Aplicar filtros')
    expect(markup).toContain('Limpar filtros')
    expect(markup).not.toContain('onclick=')
  })

  it.each([
    'disabled',
    'authentication-required',
    'not-ready',
    'unavailable',
    'failed',
  ] as const)('announces the %s state with textual content', (status) => {
    const markup = renderToStaticMarkup(
      <OfficialEventsState status={status} onRetry={() => undefined} />
    )
    expect(markup).toMatch(/role="(?:status|alert)"/)
    expect(markup).not.toContain('upstreamCode')
    expect(markup).not.toContain('RPC')
  })
})
