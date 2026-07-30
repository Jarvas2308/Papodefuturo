import { describe, expect, it } from 'vitest'
import { matchCvmFiiOfficialNameAlias } from './officialNames'
import { CVM_REAL_ESTATE_FUNDS } from './funds'

describe('matchCvmFiiOfficialNameAlias', () => {
  it.each([
    [
      'KNRI11',
      'KINEA RENDA IMOBILIARIA FII RESPONSABILIDADE LIMITADA',
      'KINEA RENDA IMOBILIARIA FII RESPONSABILIDADE LIMITADA',
    ],
    [
      'VISC11',
      'VINCI SHOPPING CENTERS FUNDO DE INVESTIMENTO IMOBILIÁRIO-FII',
      'VINCI SHOPPING CENTERS FUNDO DE INVESTIMENTO IMOBILIÁRIO-FII',
    ],
    ['XPLG11', 'XP LOG FII RL', 'XP LOG FII RL'],
    ['XPLG11', 'FII XP LOG', 'FII XP LOG'],
    [
      'HGRU11',
      'PÁTRIA RENDA URBANA - FUNDO DE INVESTIMENTO IMOBILIÁRIO',
      'PÁTRIA RENDA URBANA - FUNDO DE INVESTIMENTO IMOBILIÁRIO',
    ],
  ] as const)(
    'matches the closed alias for %s: %s',
    (ticker, observed, expected) => {
      const fund = CVM_REAL_ESTATE_FUNDS.find(
        (candidate) => candidate.ticker === ticker
      )
      if (!fund) throw new Error(`Missing fixture for ${ticker}`)
      expect(
        matchCvmFiiOfficialNameAlias(ticker, observed, fund.officialName)
      ).toBe(expected.normalize('NFC').toLocaleUpperCase('pt-BR'))
    }
  )

  it('rejects a name outside the closed allowlist', () => {
    const fund = CVM_REAL_ESTATE_FUNDS.find(
      (candidate) => candidate.ticker === 'XPLG11'
    )
    if (!fund) throw new Error('Missing fixture for XPLG11')
    expect(
      matchCvmFiiOfficialNameAlias(
        'XPLG11',
        'XP LOGISTICA FII',
        fund.officialName
      )
    ).toBeNull()
  })

  it('throws when the canonical name diverges from the closed alias configuration', () => {
    expect(() =>
      matchCvmFiiOfficialNameAlias('XPLG11', 'XP LOG FII RL', 'WRONG NAME')
    ).toThrow(/Invalid canonical alias configuration/)
  })
})
