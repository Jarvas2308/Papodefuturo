import { CircleAlert, FileSearch, LockKeyhole, RadioTower } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type { FundamentalsDossierStatusV1 } from '../types'

const STATE_COPY: Record<
  Exclude<FundamentalsDossierStatusV1, 'idle' | 'loading' | 'succeeded'>,
  { title: string; message: string }
> = {
  disabled: {
    title: 'Fundamentos ainda não estão disponíveis',
    message:
      'O recurso está preparado, mas ainda não foi ativado neste ambiente.',
  },
  'authentication-required': {
    title: 'Entre na sua conta para consultar os fundamentos',
    message:
      'Os fatos fundamentalistas estão disponíveis somente em uma sessão autenticada.',
  },
  'not-ready': {
    title: 'Estamos verificando seu acesso',
    message: 'Aguarde enquanto confirmamos a disponibilidade do recurso.',
  },
  failed: {
    title: 'Não foi possível carregar os fundamentos',
    message:
      'Ocorreu uma falha segura ao consultar os dados. Nenhum dado foi substituído.',
  },
}

export function FundamentalsInitialSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">Carregando fundamentos...</span>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
          aria-hidden="true"
        >
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="mt-5 h-6 w-3/4 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

export function FundamentalsState({
  status,
  onRetry,
}: {
  status: Exclude<FundamentalsDossierStatusV1, 'idle' | 'loading' | 'succeeded'>
  onRetry?: () => void
}) {
  const copy = STATE_COPY[status]
  const Icon =
    status === 'authentication-required'
      ? LockKeyhole
      : status === 'disabled'
        ? RadioTower
        : status === 'not-ready'
          ? FileSearch
          : CircleAlert
  return (
    <div
      className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center shadow-[var(--shadow-soft)]"
      role={status === 'failed' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <Icon
        className="mx-auto size-8 text-[var(--color-brand)]"
        aria-hidden="true"
      />
      <h2 className="mt-4 text-xl font-semibold text-[var(--color-text)]">
        {copy.title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
        {copy.message}
      </p>
      {status === 'failed' && onRetry ? (
        <Button className="mt-5" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}
