import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MovementStatusBadge } from './HistoryBadges'

describe('MovementStatusBadge', () => {
  it('renders the cancelled purchase status visibly', () => {
    expect(
      renderToStaticMarkup(<MovementStatusBadge status="cancelled" />)
    ).toContain('Cancelado')
  })
})
