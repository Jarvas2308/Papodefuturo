import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { Bell, Info, Menu, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getPageCopyFromPath } from '../../lib/navigation'
import { Button } from '../ui/Button'
import { PageHeader } from '../ui/PageHeader'

type HeaderProps = {
  menuButtonRef: RefObject<HTMLButtonElement | null>
  onOpenMobileMenu: () => void
}

export function Header({ menuButtonRef, onOpenMobileMenu }: HeaderProps) {
  const location = useLocation()
  const pageCopy = getPageCopyFromPath(location.pathname)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null)
  const notificationPanelRef = useRef<HTMLDivElement | null>(null)
  const notificationPanelId = useId()
  const notificationTitleId = useId()

  function closeNotifications(restoreFocus = false) {
    setIsNotificationsOpen(false)

    if (restoreFocus) {
      requestAnimationFrame(() => notificationButtonRef.current?.focus())
    }
  }

  useEffect(() => {
    if (!isNotificationsOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsNotificationsOpen(false)
        requestAnimationFrame(() => notificationButtonRef.current?.focus())
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node

      if (
        notificationButtonRef.current?.contains(target) ||
        notificationPanelRef.current?.contains(target)
      ) {
        return
      }

      setIsNotificationsOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isNotificationsOpen])

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface)_92%,white)]/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Button
          ref={menuButtonRef}
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
        <div className="relative">
          <Button
            ref={notificationButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Abrir notificações"
            aria-expanded={isNotificationsOpen}
            aria-controls={notificationPanelId}
            onClick={() =>
              setIsNotificationsOpen((currentIsOpen) => !currentIsOpen)
            }
          >
            <Bell className="size-5" />
          </Button>
          {isNotificationsOpen ? (
            <div
              ref={notificationPanelRef}
              id={notificationPanelId}
              className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-card)]"
              role="region"
              aria-labelledby={notificationTitleId}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-brand-strong)]"
                    aria-hidden="true"
                  >
                    <Info className="size-4" />
                  </span>
                  <div>
                    <p
                      id={notificationTitleId}
                      className="text-sm font-semibold text-[var(--color-text)]"
                    >
                      Notificações demonstrativas
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                      As notificações reais serão ativadas em uma etapa futura.
                      Por enquanto, este painel apenas demonstra onde os avisos
                      da carteira aparecerão.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-full"
                  onClick={() => closeNotifications(true)}
                  aria-label="Fechar notificações demonstrativas"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Exemplos demonstrativos
                </p>
                <p className="text-sm text-[var(--color-text)]">
                  Rebalanceamento e lembretes aparecerão aqui quando a
                  funcionalidade real existir.
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className="flex size-10 items-center justify-center rounded-full bg-[var(--color-brand)] font-semibold text-white shadow-[var(--shadow-soft)]"
          role="img"
          aria-label="Avatar do perfil demonstrativo, com dados de exemplo"
        >
          DE
        </div>
      </div>
    </header>
  )
}
