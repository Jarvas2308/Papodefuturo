import { ArrowLeft, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const GENERIC_SUCCESS_MESSAGE =
  'Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha.'

export function ForgotPasswordPage() {
  const { status, resetPasswordForEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const isDemoMode = status === 'demo'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isDemoMode || status === 'loading' || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      await resetPasswordForEmail(email)
    } catch {
      // Mesma mensagem de sucesso independente do resultado: não revela se
      // o e-mail existe na base.
    } finally {
      setFeedback(GENERIC_SUCCESS_MESSAGE)
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <Card className="mx-auto w-full max-w-md p-0">
        <div className="border-b border-[var(--color-border)] px-6 py-6 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-strong)]">
            Papo de Futuro
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
            Recuperar senha
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {isDemoMode
              ? 'Modo demonstrativo ativo neste ambiente.'
              : 'Informe seu e-mail para receber um link de redefinição.'}
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

          {isDemoMode ? (
            <p className="text-sm text-[var(--color-alert)]">
              O ambiente ainda está sem configuração pública do Supabase.
              Recuperação de senha indisponível no modo demonstrativo.
            </p>
          ) : null}

          {feedback ? (
            <p
              role="status"
              className="text-sm text-[var(--color-brand-strong)]"
            >
              {feedback}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full justify-center"
            disabled={isDemoMode || isSubmitting || status === 'loading'}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar link de redefinição'}
          </Button>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-brand)] underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4" />
            Voltar para o login
          </Link>
        </form>
      </Card>
    </main>
  )
}
