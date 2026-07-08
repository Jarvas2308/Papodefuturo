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
  const dialogRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        triggerRef.current?.focus()
        wasOpenRef.current = false
      }
      return
    }

    const previousOverflow = document.body.style.overflow
    wasOpenRef.current = true
    document.body.style.overflow = 'hidden'

    const dialog = dialogRef.current
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    function getFocusableElements() {
      if (!dialog) {
        return []
      }

      return Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter(
        (element) =>
          element.tabIndex >= 0 &&
          element.getAttribute('aria-hidden') !== 'true' &&
          element.getClientRects().length > 0
      )
    }

    const firstFocusableElement = getFocusableElements()[0]
    ;(firstFocusableElement ?? dialog)?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements = getFocusableElements()
      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)

      if (!firstElement || !lastElement) {
        event.preventDefault()
        dialog?.focus()
        return
      }

      const activeElement = document.activeElement

      if (
        event.shiftKey &&
        (activeElement === firstElement || !dialog?.contains(activeElement))
      ) {
        event.preventDefault()
        lastElement.focus()
      } else if (
        !event.shiftKey &&
        (activeElement === lastElement || !dialog?.contains(activeElement))
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (!dialog?.contains(event.target as Node)) {
        ;(getFocusableElements()[0] ?? dialog)?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
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
        aria-hidden="true"
        tabIndex={-1}
      />
      <aside
        ref={dialogRef}
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
