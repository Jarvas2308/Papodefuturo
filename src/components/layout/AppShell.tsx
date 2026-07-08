import { useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { MobileSidebar } from './MobileSidebar'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null)

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div
        className="flex min-h-screen"
        inert={isMobileSidebarOpen ? true : undefined}
        aria-hidden={isMobileSidebarOpen ? true : undefined}
      >
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((current) => !current)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            menuButtonRef={mobileMenuButtonRef}
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          />
          <main
            className="flex-1 px-4 py-6 sm:px-6 lg:px-8"
            aria-label="Conteúdo principal"
          >
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        triggerRef={mobileMenuButtonRef}
      />
    </div>
  )
}
