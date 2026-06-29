import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { DashboardPage } from '../../pages/DashboardPage'
import { HistoryPage } from '../../pages/HistoryPage'
import { LoginPage } from '../../pages/LoginPage'
import { NewContributionPage } from '../../pages/NewContributionPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { PortfolioPage } from '../../pages/PortfolioPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { StrategyPage } from '../../pages/StrategyPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/carteira" element={<PortfolioPage />} />
        <Route path="/novo-aporte" element={<NewContributionPage />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/estrategia" element={<StrategyPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
