import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from '../../../pages/DashboardPage'

describe('DashboardPage', () => {
  it('keeps a single visible CTA to plan a new contribution', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    const contributionLinks = markup.match(/href="\/novo-aporte"/g) ?? []

    expect(contributionLinks).toHaveLength(1)
    expect(markup).toContain('Planejar novo aporte')
    expect(markup).not.toContain('Planejar aporte')
  })
})
