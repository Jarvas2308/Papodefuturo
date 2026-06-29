import { X } from 'lucide-react'
import { Button } from '../ui/Button'
import { SidebarContent } from './Sidebar'

type MobileSidebarProps = {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  return (
    <div
      className={`fixed inset-0 z-40 lg:hidden ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-950/35 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-label="Fechar menu ao tocar no fundo"
      />
      <aside
        className={`absolute left-0 top-0 flex h-full w-[18rem] max-w-[85vw] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu lateral"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">
              Papo de Futuro
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Inteligência para o seu próximo aporte
            </p>
          </div>
          <Button
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
