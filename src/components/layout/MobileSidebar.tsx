import { useEffect, useId, useRef, type RefObject } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/Button'
import { SidebarContent } from './Sidebar'

type MobileSidebarProps = {
  isOpen: boolean
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

export function MobileSidebar({
  isOpen,
  onClose,
  triggerRef,
}: MobileSidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const wasOpenRef = useRef(false)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = ''
      if (wasOpenRef.current) {
        triggerRef.current?.focus()
        wasOpenRef.current = false
      }
      return
    }

    const previousOverflow = document.body.style.overflow
    wasOpenRef.current = true
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/35 transition-opacity duration-200"
        onClick={onClose}
        aria-label="Fechar menu ao tocar no fundo"
      />
      <aside
        className="absolute left-0 top-0 flex h-full w-[18rem] max-w-[85vw] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl transition-transform duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
          <div>
            <p
              id={titleId}
              className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-strong)]"
            >
              Papo de Futuro
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Inteligência para o seu próximo aporte
            </p>
          </div>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar menu de navegação"
          >
            <X className="size-5" />
          </Button>
        </div>
        <SidebarContent collapsed={false} onNavigate={onClose} />
      </aside>
    </div>
  )
}
