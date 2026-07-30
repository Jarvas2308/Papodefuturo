import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  createFundamentalsRuntimeV1,
  type FundamentalsRuntimeV1,
} from '../../application/context/fundamentals/runtime'
import { getNavigationItems, getPageCopyFromPath } from '../../lib/navigation'
import { FundamentalsPageContent } from './FundamentalsPageContent'
import {
  FUNDAMENTALS_REAL_UI_MODE,
  createRealFundamentalsUiDependenciesV1,
} from './composition'

function readOnlyRuntime(): FundamentalsRuntimeV1 {
  return createFundamentalsRuntimeV1({
    mode: 'read-only',
    repository: {
      async listAssets() {
        return []
      },
      async listBrazilianStockSnapshots() {
        return []
      },
      async listRealEstateFundSnapshots() {
        return []
      },
      async listInternationalEtfSnapshots() {
        return []
      },
    },
    getAccessState: () => 'authenticated',
    now: { now: () => '2026-07-28T12:00:00Z' },
  })
}

describe('fundamentals page and feature mode', () => {
  it('activates the real UI mode flag to read-only', () => {
    expect(FUNDAMENTALS_REAL_UI_MODE).toBe('read-only')
  })

  it('defaults to a disabled runtime when composition receives no explicit runtime, and renders the disabled state', () => {
    const dependencies = createRealFundamentalsUiDependenciesV1()
    const markup = renderToStaticMarkup(
      <FundamentalsPageContent dependencies={dependencies} />
    )
    expect(markup).toContain('Fundamentos ainda não estão disponíveis')
  })

  it('renders the initial skeleton for a read-only, authenticated runtime before the effect resolves', () => {
    const dependencies =
      createRealFundamentalsUiDependenciesV1(readOnlyRuntime())
    const markup = renderToStaticMarkup(
      <FundamentalsPageContent dependencies={dependencies} />
    )
    expect(markup).toContain('Carregando fundamentos')
  })

  it('does not add a sidebar item when fundamentals is disabled', () => {
    const items = getNavigationItems('disabled', 'disabled')
    expect(items.some((item) => item.to === '/fundamentos')).toBe(false)
  })

  it('adds a sidebar item after Eventos Oficiais when both are read-only', () => {
    const items = getNavigationItems('read-only', 'read-only')
    const eventsIndex = items.findIndex(
      (item) => item.to === '/eventos-oficiais'
    )
    const fundamentalsIndex = items.findIndex(
      (item) => item.to === '/fundamentos'
    )
    expect(eventsIndex).toBeGreaterThanOrEqual(0)
    expect(fundamentalsIndex).toBe(eventsIndex + 1)
  })

  it('adds a sidebar item right after Histórico when only fundamentals is read-only', () => {
    const items = getNavigationItems('disabled', 'read-only')
    const historyIndex = items.findIndex((item) => item.to === '/historico')
    const fundamentalsIndex = items.findIndex(
      (item) => item.to === '/fundamentos'
    )
    expect(fundamentalsIndex).toBe(historyIndex + 1)
  })

  it('registers page copy for the fundamentals route', () => {
    expect(getPageCopyFromPath('/fundamentos').title).toBe('Fundamentos')
  })
})
