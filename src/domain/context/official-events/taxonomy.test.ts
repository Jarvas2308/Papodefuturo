import { describe, expect, it } from 'vitest'
import { getOfficialEventAssetIdentityByTicker } from './assetIdentities'
import {
  assertOfficialEventTypeCompatibility,
  getOfficialEventTaxonomyDefinition,
  getOfficialEventTaxonomyDefinitionsV1,
} from './taxonomy'

describe('official event taxonomy', () => {
  it('contains exactly fifteen types in stable order', () => {
    expect(
      getOfficialEventTaxonomyDefinitionsV1().map(({ type }) => type)
    ).toEqual([
      'regulatory-filing',
      'earnings-release',
      'periodic-report',
      'material-fact',
      'market-communication',
      'dividend-or-distribution',
      'capital-structure-change',
      'offering-or-issuance',
      'shareholder-meeting',
      'management-change',
      'merger-acquisition-or-reorganization',
      'legal-or-regulatory-action',
      'fund-policy-change',
      'fund-manager-or-administrator-change',
      'other-official-event',
    ])
  })

  it('returns defensive taxonomy copies', () => {
    const definition = getOfficialEventTaxonomyDefinition('periodic-report')
    Object.assign(definition.allowedSources, { 0: 'sec-edgar' })
    expect(
      getOfficialEventTaxonomyDefinition('periodic-report').allowedSources[0]
    ).toBe('cvm-ipe')
  })

  it.each([
    ['BBAS3', 'cvm-ipe'],
    ['KNRI11', 'cvm-fund-eventual'],
    ['VOO', 'sec-edgar'],
  ] as const)(
    'accepts regulatory filing for %s through %s',
    (ticker, source) => {
      expect(() =>
        assertOfficialEventTypeCompatibility(
          'regulatory-filing',
          getOfficialEventAssetIdentityByTicker(ticker),
          source
        )
      ).not.toThrow()
    }
  )

  it('rejects material fact for SEC', () => {
    expect(() =>
      assertOfficialEventTypeCompatibility(
        'material-fact',
        getOfficialEventAssetIdentityByTicker('VOO'),
        'sec-edgar'
      )
    ).toThrow(/incompatible/)
  })

  it('rejects fund policy change for a stock', () => {
    expect(() =>
      assertOfficialEventTypeCompatibility(
        'fund-policy-change',
        getOfficialEventAssetIdentityByTicker('BBAS3'),
        'cvm-ipe'
      )
    ).toThrow(/incompatible/)
  })

  it('restricts fund manager or administrator change to funds', () => {
    expect(() =>
      assertOfficialEventTypeCompatibility(
        'fund-manager-or-administrator-change',
        getOfficialEventAssetIdentityByTicker('BBAS3'),
        'cvm-ipe'
      )
    ).toThrow(/incompatible/)
    expect(() =>
      assertOfficialEventTypeCompatibility(
        'fund-manager-or-administrator-change',
        getOfficialEventAssetIdentityByTicker('KNRI11'),
        'cvm-fund-eventual'
      )
    ).not.toThrow()
  })

  it('rejects a source incompatible with the asset category', () => {
    expect(() =>
      assertOfficialEventTypeCompatibility(
        'regulatory-filing',
        getOfficialEventAssetIdentityByTicker('KNRI11'),
        'cvm-ipe'
      )
    ).toThrow(/Source/)
  })

  it('marks only the fallback category for human review', () => {
    const requiringReview = getOfficialEventTaxonomyDefinitionsV1()
      .filter(({ requiresHumanReview }) => requiresHumanReview)
      .map(({ type }) => type)
    expect(requiringReview).toEqual(['other-official-event'])
  })

  it('does not define qualitative categories', () => {
    const serialized = JSON.stringify(getOfficialEventTaxonomyDefinitionsV1())
    for (const forbidden of [
      'positive',
      'negative',
      'bullish',
      'bearish',
      'opportunity',
      'risk',
    ]) {
      expect(serialized).not.toContain(`"${forbidden}"`)
    }
  })
})
