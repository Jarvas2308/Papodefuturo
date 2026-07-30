import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../../auth/AuthProvider'
import { createFundamentalsRuntimeV1 } from '../../application/context/fundamentals/runtime'
import { createOfficialEventsRuntimeV1 } from '../../application/context/official-events/runtime'
import { FundamentalsUiProvider } from '../../features/fundamentals/FundamentalsUiProvider'
import { OfficialEventsUiProvider } from '../../features/official-events/OfficialEventsUiProvider'
import { SidebarContent } from './Sidebar'

const now = { now: () => '2026-07-30T12:00:00Z' }

function render() {
  return renderToStaticMarkup(
    <OfficialEventsUiProvider
      dependencies={{
        runtime: createOfficialEventsRuntimeV1({ mode: 'disabled', now }),
      }}
    >
      <FundamentalsUiProvider
        dependencies={{
          runtime: createFundamentalsRuntimeV1({ mode: 'disabled', now }),
        }}
      >
        <MemoryRouter>
          <AuthProvider>
            <SidebarContent collapsed={false} />
          </AuthProvider>
        </MemoryRouter>
      </FundamentalsUiProvider>
    </OfficialEventsUiProvider>
  )
}

// O rodapé era fixo: uma sessão real lia "Perfil demonstrativo" e "Dados de
// exemplo" sobre a própria carteira. Agora o texto vem do estado de auth, no
// mesmo padrão que o Header já aplicava.
//
// Só o ramo demo é coberto aqui: sem env pública do Supabase o AuthProvider
// entra em modo demo, e montar uma sessão autenticada exige DOM real. O ramo
// autenticado entra na suíte de interação do Sprint 13.
describe('SidebarContent profile footer', () => {
  it('identifies the demo profile when there is no real session', () => {
    const markup = render()

    expect(markup).toContain('DE')
    expect(markup).toContain('Perfil demonstrativo')
    expect(markup).toContain('Dados de exemplo')
    expect(markup).not.toContain('Sua conta')
  })
})
