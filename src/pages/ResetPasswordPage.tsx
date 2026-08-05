import { ArrowRight, LockKeyhole } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

function getUpdatePasswordFailureMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Não foi possível redefinir a senha. Tente novamente.'
  }

  if (error.message.toLowerCase().includes('password')) {
    return 'A senha não atende aos requisitos mínimos de segurança.'
  }

  return 'Não foi possível redefinir a senha. Solicite um novo link e tente novamente.'
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { status, isPasswordRecovery, updatePassword, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)
  const isDemoMode = status === 'demo'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isDemoMode || isSubmitting) {
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas informadas não são iguais.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await updatePassword(password)
      await signOut()
      setIsDone(true)
    } catch (updateError) {
      setError(getUpdatePasswordFailureMessage(updateError))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDone) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
        <Card className="mx-auto w-full max-w-md space-y-4 p-8 text-center">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">
            Senha redefinida
          </h2>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Sua senha foi atualizada. Entre novamente com a nova senha.
          </p>
          <Button
            className="w-full justify-center"
            onClick={() => navigate('/login', { replace: true })}
          >
            Ir para o login
            <ArrowRight className="size-4" />
          </Button>
        </Card>
      </main>
    )
  }

  if (!isDemoMode && !isPasswordRecovery) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
        <Card className="mx-auto w-full max-w-md space-y-4 p-8 text-center">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">
            Link inválido ou expirado
          </h2>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Este link de redefinição não é válido ou já expirou. Solicite um
            novo link para continuar.
          </p>
          <Link
            to="/recuperar-senha"
            className="inline-flex text-sm font-semibold text-[var(--color-brand)] underline-offset-4 hover:underline"
          >
            Solicitar novo link
          </Link>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <Card className="mx-auto w-full max-w-md p-0">
        <div className="border-b border-[var(--color-border)] px-6 py-6 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-strong)]">
            Papo de Futuro
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
            Redefinir senha
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {isDemoMode
              ? 'Modo demonstrativo ativo neste ambiente.'
              : 'Escolha uma nova senha para sua conta.'}
          </p>
        </div>
        <form className="space-y-5 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-[var(--color-text)]"
              htmlFor="password"
            >
              Nova senha
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-3 pl-11 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-ring)]"
                placeholder="Digite a nova senha"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-[var(--color-text)]"
              htmlFor="confirmPassword"
            >
              Confirmar nova senha
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-3 pl-11 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-ring)]"
                placeholder="Repita a nova senha"
              />
            </div>
          </div>

          {error ? (
            <p role="status" className="text-sm text-[var(--color-alert)]">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full justify-center"
            disabled={isDemoMode || isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </Card>
    </main>
  )
}
