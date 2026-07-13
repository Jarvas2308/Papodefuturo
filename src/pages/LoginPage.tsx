import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

type LoginMode = 'sign-in' | 'sign-up'

type LoginLocationState = {
  from?: string
}

type LoginFeedback = {
  tone: 'error' | 'success'
  message: string
}

function getAuthFailureMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Não foi possível concluir o acesso. Tente novamente.'
  }

  if (error.message === 'Invalid login credentials') {
    return 'E-mail ou senha inválidos.'
  }

  if (error.message === 'Email not confirmed') {
    return 'Confirme seu e-mail antes de entrar.'
  }

  if (error.message === 'User already registered') {
    return 'Já existe uma conta com este e-mail.'
  }

  if (error.message.toLowerCase().includes('password')) {
    return 'A senha não atende aos requisitos mínimos de segurança.'
  }

  return 'Não foi possível concluir o acesso. Verifique os dados e tente novamente.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { status, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<LoginMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<LoginFeedback | null>(null)
  const destination =
    (location.state as LoginLocationState | null)?.from ?? '/dashboard'
  const isDemoMode = status === 'demo'
  const isSignUp = mode === 'sign-up'

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(destination, { replace: true })
    }
  }, [destination, navigate, status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isDemoMode) {
      navigate(destination, { replace: true })
      return
    }

    if (status === 'loading') {
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      if (isSignUp) {
        const result = await signUp(email, password)

        if (result.requiresEmailConfirmation) {
          setFeedback({
            tone: 'success',
            message:
              'Conta criada. Confirme seu e-mail antes de entrar na plataforma.',
          })
          return
        }
      } else {
        await signIn(email, password)
      }

      navigate(destination, { replace: true })
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: getAuthFailureMessage(error),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function toggleMode() {
    setMode((currentMode) =>
      currentMode === 'sign-in' ? 'sign-up' : 'sign-in'
    )
    setFeedback(null)
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
              {isSignUp ? 'Criar conta' : 'Entrar'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              {isDemoMode
                ? 'Modo demonstrativo ativo neste ambiente.'
                : isSignUp
                  ? 'Crie seu acesso com e-mail e senha.'
                  : 'Entre com seu e-mail e senha para continuar.'}
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
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-3 pl-11 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-ring)]"
                  placeholder="voce@exemplo.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-[var(--color-text)]"
                htmlFor="password"
              >
                Senha
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  minLength={isSignUp ? 6 : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-3 pl-11 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-ring)]"
                  placeholder="Digite sua senha"
                />
              </div>
            </div>

            <p
              className={`text-sm ${
                isDemoMode
                  ? 'text-[var(--color-alert)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              {isDemoMode
                ? 'O ambiente ainda está sem configuração pública do Supabase. O acesso continua demonstrativo.'
                : 'A sessão é gerenciada pelo acesso autenticado da plataforma.'}
            </p>

            {feedback ? (
              <p
                role="status"
                className={`text-sm ${
                  feedback.tone === 'error'
                    ? 'text-[var(--color-alert)]'
                    : 'text-[var(--color-brand-strong)]'
                }`}
              >
                {feedback.message}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full justify-center"
              disabled={isSubmitting || status === 'loading'}
            >
              {isSubmitting
                ? 'Processando...'
                : isSignUp
                  ? 'Criar conta'
                  : 'Entrar'}
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-center text-sm text-[var(--color-text-muted)]">
              {isSignUp ? 'Já tem acesso? ' : 'Ainda não tem acesso? '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-[var(--color-brand)] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                {isSignUp ? 'Entrar' : 'Criar conta'}
              </button>
            </p>
          </form>
        </Card>
      </div>
    </main>
  )
}
