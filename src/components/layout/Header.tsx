import { Bell, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getPageCopyFromPath } from '../../lib/navigation'
import { Button } from '../ui/Button'
import { PageHeader } from '../ui/PageHeader'

type HeaderProps = {
  onOpenMobileMenu: () => void
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const location = useLocation()
  const pageCopy = getPageCopyFromPath(location.pathname)

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface)_92%,white)]/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu de navegação"
        >
          <Menu className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <PageHeader
            title={pageCopy.title}
            description={pageCopy.description}
            compact
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Abrir notificações"
        >
          <Bell className="size-5" />
        </Button>
        <div
          className="flex size-10 items-center justify-center rounded-full bg-[var(--color-brand)] font-semibold text-white shadow-[var(--shadow-soft)]"
          aria-label="Avatar do usuário Luis Fernando"
        >
          LF
        </div>
      </div>
    </header>
  )
}
