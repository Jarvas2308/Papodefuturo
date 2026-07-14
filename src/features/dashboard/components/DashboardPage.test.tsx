import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DashboardContent } from '../../../pages/DashboardPage'
import { dashboardMock } from '../../../mocks/dashboard'

describe('DashboardPage', () => {
  it('keeps a single visible CTA to plan a new contribution', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <DashboardContent data={dashboardMock} />
      </MemoryRouter>
    )

    const contributionLinks = markup.match(/href="\/novo-aporte"/g) ?? []

    expect(contributionLinks).toHaveLength(1)
    expect(markup).toContain('Planejar novo aporte')
    expect(markup).not.toContain('Planejar aporte')
  })

  it('shows a clear empty state instead of an empty movements table', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <DashboardContent
          data={{
            ...dashboardMock,
            recentMovements: {
              ...dashboardMock.recentMovements,
              items: [],
            },
          }}
        />
      </MemoryRouter>
    )

    expect(markup).toContain('Nenhuma movimentação registrada ainda.')
    expect(markup).not.toContain('<table')
  })
})
