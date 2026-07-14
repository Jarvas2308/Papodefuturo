import { describe, expect, it } from 'vitest'
import { portfolioMock } from '../../mocks/portfolio'
import { createInitialPortfolioLoadState } from './usePortfolioData'

describe('createInitialPortfolioLoadState', () => {
  it('keeps demo mode on its mock without requiring an exchange rate', () => {
    expect(createInitialPortfolioLoadState(true)).toEqual({
      data: portfolioMock,
      status: 'ready',
      error: null,
      needsExchangeRate: false,
      latestUsdBrlRate: null,
    })
  })
})
