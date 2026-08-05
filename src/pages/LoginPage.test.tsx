// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../auth/authContext'
import * as useAuthModule from '../auth/useAuth'
import { LoginPage } from './LoginPage'

function mockAuth(overrides: Partial<AuthContextValue> = {}) {
  const base: AuthContextValue = {
    status: 'unauthenticated',
    session: null,
    user: null,
    client: null,
    isPasswordRecovery: false,
    signIn: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue({ requiresEmailConfirmation: false }),
    signOut: vi.fn().mockResolvedValue(undefined),
    resetPasswordForEmail: vi.fn().mockResolvedValue(undefined),
    updatePassword: vi.fn().mockResolvedValue(undefined),
  }
  const auth = { ...base, ...overrides }
  vi.spyOn(useAuthModule, 'useAuth').mockReturnValue(auth)
  return auth
}

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LoginPage', () => {
  it('shows the forgot-password link only in sign-in mode, outside demo', async () => {
    mockAuth()
    renderLoginPage()

    expect(
      screen.getByRole('link', { name: 'Esqueceu sua senha?' })
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(
      screen.queryByRole('link', { name: 'Esqueceu sua senha?' })
    ).not.toBeInTheDocument()
  })

  it('hides the forgot-password link in demo mode', () => {
    mockAuth({ status: 'demo' })
    renderLoginPage()

    expect(
      screen.queryByRole('link', { name: 'Esqueceu sua senha?' })
    ).not.toBeInTheDocument()
  })

  it('calls signIn with the typed credentials and submits', async () => {
    const auth = mockAuth()
    renderLoginPage()

    await userEvent.type(
      screen.getByLabelText('E-mail'),
      'usuario@exemplo.com'
    )
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-correta')
    await userEvent.click(screen.getByRole('button', { name: /Entrar/ }))

    await waitFor(() => {
      expect(auth.signIn).toHaveBeenCalledWith(
        'usuario@exemplo.com',
        'senha-correta'
      )
    })
  })

  it('shows a friendly message when the credentials are invalid', async () => {
    const auth = mockAuth({
      signIn: vi.fn().mockRejectedValue(new Error('Invalid login credentials')),
    })
    renderLoginPage()

    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: /Entrar/ }))

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeInTheDocument()
    expect(auth.signIn).toHaveBeenCalled()
  })
})
