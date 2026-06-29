import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export function LoginPage() {
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-soft)] lg:flex lg:flex-col lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-strong)]">
              Papo de Futuro
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-[var(--color-text)]">
              Inteligência para o seu próximo aporte
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
              Uma plataforma pensada para organizar decisões, preparar aportes e
              evoluir sua visão estratégica com clareza visual desde a primeira
              etapa.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-[var(--color-surface-muted)]">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Navegação estruturada
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Layout principal, rotas e estados provisórios prontos para
                crescer com o produto.
              </p>
            </Card>
            <Card className="bg-[var(--color-surface-muted)]">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Identidade consistente
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Base visual clara, profissional e preparada para as próximas
                entregas da aplicação.
              </p>
            </Card>
          </div>
        </section>
        <Card className="mx-auto w-full max-w-xl p-0">
          <div className="border-b border-[var(--color-border)] px-6 py-6 sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-strong)]">
              Papo de Futuro
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
              Entrar
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Acesso demonstrativo para a fundação visual da plataforma.
            </p>
          </div>
          <form className="space-y-5 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-[var(--color-text)]"
                htmlFor="email"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-3 pl-11 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-ring)]"
                  placeholder="voce@exemplo.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  className="block text-sm font-medium text-[var(--color-text)]"
                  htmlFor="password"
                >
                  Senha
                </label>
                <Link
                  to="/login"
                  className="text-sm font-medium text-[var(--color-brand)] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-3 pl-11 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-ring)]"
                  placeholder="Digite sua senha"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                <input
                  type="checkbox"
                  name="remember"
                  className="size-4 rounded border-[var(--color-border-strong)] text-[var(--color-brand)] focus:ring-[var(--color-ring)]"
                />
                Lembrar de mim
              </label>
              <p className="text-sm text-[var(--color-alert)]">
                O acesso ainda é demonstrativo.
              </p>
            </div>
            <Button type="submit" className="w-full justify-center">
              Entrar
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-center text-sm text-[var(--color-text-muted)]">
              Ainda não tem acesso?{' '}
              <Link
                to="/login"
                className="font-semibold text-[var(--color-brand)] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                Criar conta
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </main>
  )
}
