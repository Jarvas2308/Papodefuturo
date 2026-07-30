import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '../../auth/RequireAuth'
import { AppShell } from '../../components/layout/AppShell'
import { LoginPage } from '../../pages/LoginPage'
import { NotFoundPage } from '../../pages/NotFoundPage'

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

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/carteira"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <PortfolioPage />
              </Suspense>
            }
          />
          <Route
            path="/novo-aporte"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <NewContributionPage />
              </Suspense>
            }
          />
          <Route
            path="/historico"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <HistoryPage />
              </Suspense>
            }
          />
          <Route
            path="/eventos-oficiais"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <OfficialEventsPage />
              </Suspense>
            }
          />
          <Route
            path="/fundamentos"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <FundamentalsPage />
              </Suspense>
            }
          />
          <Route
            path="/estrategia"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <StrategyPage />
              </Suspense>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
