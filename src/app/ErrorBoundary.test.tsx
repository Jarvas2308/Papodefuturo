import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createLogger, type LogEntry } from '../lib/logger'
import { ErrorBoundary, ErrorFallback } from './ErrorBoundary'

describe('ErrorFallback', () => {
  it('announces the failure and names the affected screen', () => {
    const markup = renderToStaticMarkup(
      <ErrorFallback scope="Novo Aporte" detail="preço ausente" />
    )

    expect(markup).toContain('role="alert"')
    expect(markup).toContain('Algo falhou nesta tela')
    expect(markup).toContain('Novo Aporte')
    expect(markup).toContain('preço ausente')
  })

  it('states that no data was changed', () => {
    const markup = renderToStaticMarkup(
      <ErrorFallback scope="Carteira" detail={null} />
    )

    expect(markup).toContain('Nenhum dado foi alterado')
  })

  it('omits the technical detail block when there is none', () => {
    const markup = renderToStaticMarkup(
      <ErrorFallback scope="Carteira" detail={null} />
    )

    expect(markup).not.toContain('Detalhe técnico')
  })

  it('only offers the reload action when a handler is provided', () => {
    expect(
      renderToStaticMarkup(<ErrorFallback scope="Carteira" detail={null} />)
    ).not.toContain('Recarregar página')

    expect(
      renderToStaticMarkup(
        <ErrorFallback scope="Carteira" detail={null} onReload={() => {}} />
      )
    ).toContain('Recarregar página')
  })
})

describe('ErrorBoundary', () => {
  it('renders children while no error happened', () => {
    const markup = renderToStaticMarkup(
      <ErrorBoundary scope="Carteira">
        <p>conteúdo real</p>
      </ErrorBoundary>
    )

    expect(markup).toContain('conteúdo real')
  })

  it('derives the fallback state from the thrown error message', () => {
    expect(
      ErrorBoundary.getDerivedStateFromError(new Error('cotação indisponível'))
    ).toEqual({ detail: 'cotação indisponível' })
  })

  it('derives a stable state from a non-error value', () => {
    expect(ErrorBoundary.getDerivedStateFromError(undefined)).toEqual({
      detail: 'unknown',
    })
  })

  it('logs the scope, the error and the component stack', () => {
    const entries: LogEntry[] = []
    const logger = createLogger({ sink: (entry) => entries.push(entry) })
    const boundary = new ErrorBoundary({
      scope: 'Histórico',
      children: null,
      logger,
    })

    boundary.componentDidCatch(new RangeError('quantidade inválida'), {
      componentStack: '\n    at HistoryPage',
    })

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      level: 'error',
      message: 'Erro capturado por error boundary.',
      context: {
        scope: 'Histórico',
        name: 'RangeError',
        detail: 'quantidade inválida',
        componentStack: '\n    at HistoryPage',
      },
    })
  })
})
