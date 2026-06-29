import { SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <Card className="w-full max-w-xl text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-strong)]">
          <SearchX className="size-6" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-strong)]">
          Erro 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
          Página não encontrada
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
          A rota acessada não existe nesta etapa do projeto. Você pode voltar
          para o painel principal e continuar navegando normalmente.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-all hover:bg-[var(--color-brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        >
          Voltar ao Dashboard
        </Link>
      </Card>
    </main>
  )
}
