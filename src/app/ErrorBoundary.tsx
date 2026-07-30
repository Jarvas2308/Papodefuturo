import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { appLogger, describeError, type Logger } from '../lib/logger'

export type ErrorFallbackProps = {
  scope: string
  detail: string | null
  onReload?: () => void
}

export function ErrorFallback({ scope, detail, onReload }: ErrorFallbackProps) {
  return (
    <Card role="alert">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        Algo falhou nesta tela
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Nenhum dado foi alterado. Recarregue a página para tentar novamente. Se
        o erro persistir, informe em qual tela ele aconteceu.
      </p>
      <dl className="mt-4 space-y-1 text-xs text-[var(--color-text-muted)]">
        <div className="flex gap-2">
          <dt className="font-semibold">Tela:</dt>
          <dd>{scope}</dd>
        </div>
        {detail ? (
          <div className="flex gap-2">
            <dt className="font-semibold">Detalhe técnico:</dt>
            <dd className="break-all">{detail}</dd>
          </div>
        ) : null}
      </dl>
      {onReload ? (
        <Button className="mt-5" onClick={onReload}>
          Recarregar página
        </Button>
      ) : null}
    </Card>
  )
}

export type ErrorBoundaryProps = {
  scope: string
  children: ReactNode
  logger?: Logger
  onReload?: () => void
}

export type ErrorBoundaryState = {
  detail: string | null
}

function reloadCurrentPage(): void {
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { detail: null }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { detail: describeError(error).message }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    const logger = this.props.logger ?? appLogger
    const described = describeError(error)

    logger.error('Erro capturado por error boundary.', {
      scope: this.props.scope,
      name: described.name,
      detail: described.message,
      ...(described.stack ? { stack: described.stack } : {}),
      ...(info.componentStack ? { componentStack: info.componentStack } : {}),
    })
  }

  render(): ReactNode {
    if (this.state.detail === null) {
      return this.props.children
    }

    return (
      <ErrorFallback
        scope={this.props.scope}
        detail={this.state.detail}
        onReload={this.props.onReload ?? reloadCurrentPage}
      />
    )
  }
}
