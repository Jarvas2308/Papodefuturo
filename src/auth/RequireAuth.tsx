import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 text-[var(--color-text)]">
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          Verificando acesso...
        </p>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}
