import {
  ChevronLeft,
  ChevronRight,
  Goal,
  History,
  Landmark,
  LayoutDashboard,
  FileClock,
  LineChart,
  Settings,
  Wallet,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { cn } from '../../lib/cn'
import { useOfficialEventsUiDependenciesV1 } from '../../features/official-events/officialEventsUiContext'
import { useFundamentalsUiDependenciesV1 } from '../../features/fundamentals/fundamentalsUiContext'
import { getNavigationItems } from '../../lib/navigation'
import { Button } from '../ui/Button'

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
}

type SidebarContentProps = {
  collapsed: boolean
  onNavigate?: () => void
}

const iconMap = {
  dashboard: LayoutDashboard,
  portfolio: Wallet,
  contribution: Landmark,
  history: History,
  officialEvents: FileClock,
  fundamentals: LineChart,
  strategy: Goal,
  settings: Settings,
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 lg:flex lg:min-h-screen lg:flex-col',
        collapsed ? 'lg:w-24' : 'lg:w-72'
      )}
      aria-label="Navegação principal"
    >
      <div className="flex items-start justify-between border-b border-[var(--color-border)] px-4 py-5">
        <div className={cn('min-w-0', collapsed && 'sr-only')}>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">
            Papo de Futuro
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Inteligência para o seu próximo aporte
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={
            collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'
          }
          className={cn('shrink-0', collapsed && 'mx-auto')}
        >
          {collapsed ? (
            <ChevronRight className="size-5" />
          ) : (
            <ChevronLeft className="size-5" />
          )}
        </Button>
      </div>
      <SidebarContent collapsed={collapsed} />
    </aside>
  )
}

export function SidebarContent({ collapsed, onNavigate }: SidebarContentProps) {
  const { runtime } = useOfficialEventsUiDependenciesV1()
  const { runtime: fundamentalsRuntime } = useFundamentalsUiDependenciesV1()
  const { status, user } = useAuth()
  const items = getNavigationItems(
    runtime.getCapability().mode,
    fundamentalsRuntime.getCapability().mode
  )
  // Mesmo padrão do Header: em sessão real o rodapé identifica a conta, em vez
  // de afirmar que o perfil é demonstrativo sobre dados que são do usuário.
  const isAuthenticated = status === 'authenticated'
  const profileInitials = isAuthenticated
    ? (user?.email?.slice(0, 2).toUpperCase() ?? 'US')
    : 'DE'
  const profileName = isAuthenticated ? 'Sua conta' : 'Perfil demonstrativo'
  const profileDetail =
    isAuthenticated && user?.email ? user.email : 'Dados de exemplo'

  return (
    <>
      <nav className="flex-1 px-3 py-5" aria-label="Seções da plataforma">
        <ul className="space-y-1.5">
          {items.map((item) => {
            const Icon = iconMap[item.icon]

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium outline-none transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
                      isActive
                        ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-strong)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]',
                      collapsed && 'justify-center px-2'
                    )
                  }
                  aria-label={collapsed ? item.label : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className={cn('truncate', collapsed && 'sr-only')}>
                    {item.label}
                  </span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t border-[var(--color-border)] px-3 py-4">
        <div
          className={cn(
            'flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] px-3 py-3',
            collapsed && 'justify-center px-2'
          )}
        >
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] font-semibold text-white"
            aria-hidden="true"
          >
            {profileInitials}
          </div>
          <div className={cn('min-w-0', collapsed && 'sr-only')}>
            <p className="truncate text-sm font-semibold text-[var(--color-text)]">
              {profileName}
            </p>
            <p className="truncate text-sm text-[var(--color-text-muted)]">
              {profileDetail}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
