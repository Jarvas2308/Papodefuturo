// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../auth/authContext'
import * as useAuthModule from '../auth/useAuth'
import { ResetPasswordPage } from './ResetPasswordPage'

function mockAuth(overrides: Partial<AuthContextValue> = {}) {
  const base: AuthContextValue = {
    status: 'authenticated',
    session: null,
    user: null,
    client: null,
    isPasswordRecovery: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
    resetPasswordForEmail: vi.fn(),
    updatePassword: vi.fn().mockResolvedValue(undefined),
  }
  const auth = { ...base, ...overrides }
  vi.spyOn(useAuthModule, 'useAuth').mockReturnValue(auth)
  return auth
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>
  )
}

describe('ResetPasswordPage', () => {
  it('refuses to show the form without a valid recovery session', () => {
    mockAuth({ isPasswordRecovery: false })
    renderPage()

    expect(screen.getByText('Link inválido ou expirado')).toBeInTheDocument()
    expect(
      screen.queryByLabelText('Nova senha')
    ).not.toBeInTheDocument()
  })

  it('shows the form when a recovery session is present', () => {
    mockAuth()
    renderPage()

    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
  })

  it('rejects mismatched passwords without calling updatePassword', async () => {
    const auth = mockAuth()
    renderPage()

    await userEvent.type(screen.getByLabelText('Nova senha'), 'senha-nova-1')
    await userEvent.type(
      screen.getByLabelText('Confirmar nova senha'),
      'senha-diferente'
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar nova senha' })
    )

    expect(
      await screen.findByText('As senhas informadas não são iguais.')
    ).toBeInTheDocument()
    expect(auth.updatePassword).not.toHaveBeenCalled()
  })

  it('updates the password, signs out the recovery session, and shows the done screen', async () => {
    const auth = mockAuth()
    renderPage()

    await userEvent.type(screen.getByLabelText('Nova senha'), 'senha-nova-1')
    await userEvent.type(
      screen.getByLabelText('Confirmar nova senha'),
      'senha-nova-1'
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar nova senha' })
    )

    expect(await screen.findByText('Senha redefinida')).toBeInTheDocument()
    expect(auth.updatePassword).toHaveBeenCalledWith('senha-nova-1')
    expect(auth.signOut).toHaveBeenCalled()
  })

  it('shows a friendly message when updatePassword fails', async () => {
    mockAuth({
      updatePassword: vi.fn().mockRejectedValue(new Error('weak password')),
    })
    renderPage()

    await userEvent.type(screen.getByLabelText('Nova senha'), 'senha-nova-1')
    await userEvent.type(
      screen.getByLabelText('Confirmar nova senha'),
      'senha-nova-1'
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar nova senha' })
    )

    expect(
      await screen.findByText(
        'A senha não atende aos requisitos mínimos de segurança.'
      )
    ).toBeInTheDocument()
  })
})
