// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../auth/authContext'
import * as useAuthModule from '../auth/useAuth'
import { ForgotPasswordPage } from './ForgotPasswordPage'

const GENERIC_SUCCESS =
  'Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha.'

function mockAuth(overrides: Partial<AuthContextValue> = {}) {
  const base: AuthContextValue = {
    status: 'unauthenticated',
    session: null,
    user: null,
    client: null,
    isPasswordRecovery: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn().mockResolvedValue(undefined),
    updatePassword: vi.fn(),
  }
  const auth = { ...base, ...overrides }
  vi.spyOn(useAuthModule, 'useAuth').mockReturnValue(auth)
  return auth
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>
  )
}

describe('ForgotPasswordPage', () => {
  it('calls resetPasswordForEmail with the typed address and shows a generic success message', async () => {
    const auth = mockAuth()
    renderPage()

    await userEvent.type(
      screen.getByLabelText('E-mail'),
      'existente@exemplo.com'
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Enviar link de redefinição' })
    )

    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'existente@exemplo.com'
    )
    expect(await screen.findByText(GENERIC_SUCCESS)).toBeInTheDocument()
  })

  it('shows the same generic message even when the request fails, avoiding account enumeration', async () => {
    mockAuth({
      resetPasswordForEmail: vi.fn().mockRejectedValue(new Error('boom')),
    })
    renderPage()

    await userEvent.type(
      screen.getByLabelText('E-mail'),
      'inexistente@exemplo.com'
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Enviar link de redefinição' })
    )

    expect(await screen.findByText(GENERIC_SUCCESS)).toBeInTheDocument()
  })

  it('disables submission in demo mode', () => {
    mockAuth({ status: 'demo' })
    renderPage()

    expect(
      screen.getByRole('button', { name: 'Enviar link de redefinição' })
    ).toBeDisabled()
  })
})
