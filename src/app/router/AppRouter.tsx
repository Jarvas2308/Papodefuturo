import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '../../auth/RequireAuth'
import { AppShell } from '../../components/layout/AppShell'
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage'
import { LoginPage } from '../../pages/LoginPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { ResetPasswordPage } from '../../pages/ResetPasswordPage'
import { ErrorBoundary } from '../ErrorBoundary'

const DashboardPage = lazy(() =>
  import('../../pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }))
)
const FundamentalsPage = lazy(() =>
  import('../../pages/FundamentalsPage').then((module) => ({
    default: module.FundamentalsPage,
  }))
)
const HistoryPage = lazy(() =>
  import('../../pages/HistoryPage').then((module) => ({
    default: module.HistoryPage,
  }))
)
const NewContributionPage = lazy(() =>
  import('../../pages/NewContributionPage').then((module) => ({
    default: module.NewContributionPage,
  }))
)
const OfficialEventsPage = lazy(() =>
  import('../../pages/OfficialEventsPage').then((module) => ({
    default: module.OfficialEventsPage,
  }))
)
const PortfolioPage = lazy(() =>
  import('../../pages/PortfolioPage').then((module) => ({
    default: module.PortfolioPage,
  }))
)
const SettingsPage = lazy(() =>
  import('../../pages/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  }))
)
const StrategyPage = lazy(() =>
  import('../../pages/StrategyPage').then((module) => ({
    default: module.StrategyPage,
  }))
)

function RouteLoadingFallback() {
  return (
    <p role="status" className="text-sm text-[var(--color-text-muted)]">
      Carregando...
    </p>
  )
}

type RouteContentProps = {
  scope: string
  children: ReactNode
}

/**
 * Isola cada rota: uma falha de render ou de carregamento do chunk não pode
 * derrubar o shell inteiro nem apagar a navegação.
 */
function RouteContent({ scope, children }: RouteContentProps) {
  return (
    <ErrorBoundary scope={scope}>
      <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={
          <ErrorBoundary scope="Login">
            <LoginPage />
          </ErrorBoundary>
        }
      />
      <Route
        path="/recuperar-senha"
        element={
          <ErrorBoundary scope="Recuperar Senha">
            <ForgotPasswordPage />
          </ErrorBoundary>
        }
      />
      <Route
        path="/redefinir-senha"
        element={
          <ErrorBoundary scope="Redefinir Senha">
            <ResetPasswordPage />
          </ErrorBoundary>
        }
      />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route
            path="/dashboard"
            element={
              <RouteContent scope="Painel">
                <DashboardPage />
              </RouteContent>
            }
          />
          <Route
            path="/carteira"
            element={
              <RouteContent scope="Carteira">
                <PortfolioPage />
              </RouteContent>
            }
          />
          <Route
            path="/novo-aporte"
            element={
              <RouteContent scope="Novo Aporte">
                <NewContributionPage />
              </RouteContent>
            }
          />
          <Route
            path="/historico"
            element={
              <RouteContent scope="Histórico">
                <HistoryPage />
              </RouteContent>
            }
          />
          <Route
            path="/eventos-oficiais"
            element={
              <RouteContent scope="Eventos Oficiais">
                <OfficialEventsPage />
              </RouteContent>
            }
          />
          <Route
            path="/fundamentos"
            element={
              <RouteContent scope="Fundamentos">
                <FundamentalsPage />
              </RouteContent>
            }
          />
          <Route
            path="/estrategia"
            element={
              <RouteContent scope="Estratégia">
                <StrategyPage />
              </RouteContent>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <RouteContent scope="Configurações">
                <SettingsPage />
              </RouteContent>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
