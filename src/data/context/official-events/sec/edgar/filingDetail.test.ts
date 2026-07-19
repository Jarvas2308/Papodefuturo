import { describe, expect, it } from 'vitest'

import { parseSecEdgarFilingDetailHtml } from './filingDetail'
import { createFilingDetailHtml, TEST_IDENTITIES } from './testFixtures'

const ACCESSION = '0000036405-26-000001'

describe('SEC EDGAR filing detail parser', () => {
  it('extracts the exact series/class hierarchy and document count', () => {
    expect(
      parseSecEdgarFilingDetailHtml({
        html: createFilingDetailHtml(),
        expectedAccessionNumber: ACCESSION,
      })
    ).toEqual({
      accessionNumber: ACCESSION,
      scope: 'series-and-classes',
      series: [
        {
          seriesId: TEST_IDENTITIES[0].seriesId,
          classes: [{ classContractId: TEST_IDENTITIES[0].classContractId }],
        },
      ],
      seriesCount: 1,
      classCount: 1,
      documentCount: 2,
    })
  })

  it('returns normalized hierarchy independent across parses', () => {
    const html = createFilingDetailHtml()
    const first = parseSecEdgarFilingDetailHtml({
      html,
      expectedAccessionNumber: ACCESSION,
    })
    first.series[0].seriesId = 'S999999999'
    first.series[0].classes[0].classContractId = 'C999999999'
    const second = parseSecEdgarFilingDetailHtml({
      html,
      expectedAccessionNumber: ACCESSION,
    })
    expect(second.series[0]).toEqual({
      seriesId: TEST_IDENTITIES[0].seriesId,
      classes: [{ classContractId: TEST_IDENTITIES[0].classContractId }],
    })
  })

  it('ignores identifiers inside comments, scripts and styles', () => {
    const html = createFilingDetailHtml().replace(
      '<h1>Filing Detail</h1>',
      '<!-- S999999999 C999999999 --><script>S999999999</script><style>C999999999</style><h1>Filing Detail</h1>'
    )
    const result = parseSecEdgarFilingDetailHtml({
      html,
      expectedAccessionNumber: ACCESSION,
    })
    expect(result.series).toHaveLength(1)
    expect(result.series[0].seriesId).toBe(TEST_IDENTITIES[0].seriesId)
  })

  it('does not treat script text after an HTML script terminator as series data', () => {
    const html = createFilingDetailHtml().replace(
      '<h1>Filing Detail</h1>',
      '<script>const value = "</script><div>S999999999 C999999999</div>";</script><h1>Filing Detail</h1>'
    )
    expect(
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      }).series[0].seriesId
    ).toBe(TEST_IDENTITIES[0].seriesId)
  })

  it('does not extract series or class identifiers from attributes', () => {
    const html = createFilingDetailHtml()
      .replace(`>${TEST_IDENTITIES[0].seriesId}</a>`, '>series</a>')
      .replace(`>${TEST_IDENTITIES[0].classContractId}</a>`, '>class</a>')
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/contains no series/)
  })

  it('ignores identifiers outside the associated series table', () => {
    const html = createFilingDetailHtml().replace(
      '<div class="seriesClassTitle">',
      '<div>S999999999 C999999999</div><div class="seriesClassTitle">'
    )
    const result = parseSecEdgarFilingDetailHtml({
      html,
      expectedAccessionNumber: ACCESSION,
    })
    expect(result.series).toEqual([
      {
        seriesId: TEST_IDENTITIES[0].seriesId,
        classes: [{ classContractId: TEST_IDENTITIES[0].classContractId }],
      },
    ])
  })

  it('does not accept the expected accession from ignored script attributes', () => {
    const html = createFilingDetailHtml()
      .replaceAll(ACCESSION, '0000036405-26-000002')
      .replace(
        '<h1>Filing Detail</h1>',
        `<script data-accession="${ACCESSION}">ignored</script><h1>Filing Detail</h1>`
      )
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/accession diverges/)
  })

  it('does not accept an accession found only in an arbitrary footer', () => {
    const html = createFilingDetailHtml()
      .replaceAll(ACCESSION, '0000036405-26-000002')
      .replace('</body>', `<footer>${ACCESSION}</footer></body>`)
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/accession diverges/)
  })

  it('does not accept Filing Detail found only in arbitrary page text', () => {
    const html = createFilingDetailHtml()
      .replace('<h1>Filing Detail</h1>', '<h1>Other</h1>')
      .replace('</body>', '<footer>Filing Detail</footer></body>')
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/not an official filing detail/)
  })

  it('accepts the audited SEC title marker', () => {
    const html = createFilingDetailHtml().replace(
      '<h1>Filing Detail</h1>',
      '<title>SEC.gov | Filing Detail</title>'
    )
    expect(
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      }).accessionNumber
    ).toBe(ACCESSION)
  })

  it('decodes numeric and basic entities before exact heading matching', () => {
    const html = createFilingDetailHtml().replace(
      'Series and Classes/Contracts Information:',
      'Series&#32;and&nbsp;Classes/Contracts Information:'
    )
    expect(
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      }).scope
    ).toBe('series-and-classes')
  })

  it.each(['&#0;', '&#x0;', '&#55296;', '&#xD800;', '&#1114112;'])(
    'rejects unsafe numeric entity %s',
    (entity) => {
      expect(() =>
        parseSecEdgarFilingDetailHtml({
          html: createFilingDetailHtml().replace('Filing Detail', entity),
          expectedAccessionNumber: ACCESSION,
        })
      ).toThrow(/invalid entity/)
    }
  )

  it('parses uppercase tags and heading whitespace deterministically', () => {
    const html = createFilingDetailHtml()
      .replaceAll('<div', '<DIV')
      .replaceAll('</div>', '</DIV>')
      .replaceAll('<table', '<TABLE')
      .replaceAll('</table>', '</TABLE>')
      .replaceAll('<tr>', '<TR>')
      .replaceAll('</tr>', '</TR>')
      .replaceAll('<td>', '<TD>')
      .replaceAll('</td>', '</TD>')
      .replace(
        'Series and Classes/Contracts Information:',
        'Series\n and\t Classes/Contracts Information:'
      )
    expect(
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      }).classCount
    ).toBe(1)
  })

  it('preserves one series with multiple exact classes', () => {
    const html = createFilingDetailHtml().replace(
      `</table>\n</body>`,
      `<tr><td>C000000001</td></tr></table>\n</body>`
    )
    expect(
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      }).series[0].classes
    ).toEqual([
      { classContractId: TEST_IDENTITIES[0].classContractId },
      { classContractId: 'C000000001' },
    ])
  })

  it('preserves multiple series and their exact hierarchy', () => {
    const html = createFilingDetailHtml().replace(
      `</table>\n</body>`,
      `<tr><td>S000000001</td></tr><tr><td>C000000001</td></tr></table>\n</body>`
    )
    const result = parseSecEdgarFilingDetailHtml({
      html,
      expectedAccessionNumber: ACCESSION,
    })
    expect(result.seriesCount).toBe(2)
    expect(result.classCount).toBe(2)
  })

  it('returns registrant-only only with filing and document markers', () => {
    const html = createFilingDetailHtml().replace(
      /<div class="seriesClassTitle">[\s\S]*?<\/table>/,
      ''
    )
    expect(
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      }).scope
    ).toBe('registrant-only')
  })

  it('collapses exact duplicate series structures', () => {
    const rows = `<tr><td>${TEST_IDENTITIES[0].seriesId}</td></tr><tr><td>${TEST_IDENTITIES[0].classContractId}</td></tr>`
    const html = createFilingDetailHtml().replace(
      '</table>\n</body>',
      `${rows}</table>\n</body>`
    )
    expect(
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      }).series
    ).toHaveLength(1)
  })

  it('rejects a class before a series', () => {
    const html = createFilingDetailHtml().replace(
      `<tr><td><a href="?CIK=${TEST_IDENTITIES[0].seriesId}">${TEST_IDENTITIES[0].seriesId}</a></td></tr>`,
      ''
    )
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/before its parent series/)
  })

  it('rejects contradictory duplicate hierarchy', () => {
    const rows = `<tr><td>${TEST_IDENTITIES[0].seriesId}</td></tr><tr><td>C000000001</td></tr>`
    const html = createFilingDetailHtml().replace(
      '</table>\n</body>',
      `${rows}</table>\n</body>`
    )
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/contradictory/)
  })

  it('rejects a heading without its associated table', () => {
    const html = createFilingDetailHtml().replace(
      /<table class="tableSeries">[\s\S]*?<\/table>/,
      ''
    )
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/followed by its table/)
  })

  it('rejects an unrelated element between the series heading and table', () => {
    const html = createFilingDetailHtml().replace(
      '</div>\n  <table class="tableSeries">',
      '</div><div>unrelated</div>\n  <table class="tableSeries">'
    )
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/immediately followed/)
  })

  it('rejects document counts above the audited limit', () => {
    const html = createFilingDetailHtml().replace(
      '<div class="info">2</div>',
      '<div class="info">2049</div>'
    )
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/document count/)
  })

  it('applies the document limit to observed rows before reconciliation', () => {
    const rows = Array.from(
      { length: 2_049 },
      (_, index) => `<tr><td>document-${index}</td></tr>`
    ).join('')
    const html = createFilingDetailHtml()
      .replace('<div class="info">2</div>', '<div class="info">2048</div>')
      .replace(
        /<table class="tableFile">[\s\S]*?<\/table>/,
        `<table class="tableFile">${rows}</table>`
      )
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/document count exceeds/)
  })

  it('rejects a document summary that diverges from the structured table', () => {
    const html = createFilingDetailHtml().replace(
      '<div class="info">2</div>',
      '<div class="info">1</div>'
    )
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/diverges from its official table/)
  })

  it('applies the series occurrence limit before collapsing duplicates', () => {
    const rows = Array.from(
      { length: 512 },
      () =>
        `<tr><td>${TEST_IDENTITIES[0].seriesId}</td></tr><tr><td>${TEST_IDENTITIES[0].classContractId}</td></tr>`
    ).join('')
    const html = createFilingDetailHtml().replace(
      '</table>\n</body>',
      `${rows}</table>\n</body>`
    )
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/supported limits/)
  })

  it('applies the class occurrence limit before collapsing duplicates', () => {
    const rows = Array.from(
      { length: 1_024 },
      () => `<tr><td>${TEST_IDENTITIES[0].classContractId}</td></tr>`
    ).join('')
    const html = createFilingDetailHtml().replace(
      '</table>\n</body>',
      `${rows}</table>\n</body>`
    )
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow(/supported limits/)
  })

  it.each([
    [
      'wrong accession',
      createFilingDetailHtml().replaceAll(ACCESSION, '0000036405-26-000002'),
    ],
    [
      'missing detail marker',
      createFilingDetailHtml().replace('Filing Detail', 'Other'),
    ],
    [
      'missing document marker',
      createFilingDetailHtml().replace('Document Format Files', 'Other'),
    ],
    ['NUL', `${createFilingDetailHtml()}\u0000`],
  ])('rejects malformed official detail: %s', (_label, html) => {
    expect(() =>
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: ACCESSION,
      })
    ).toThrow()
  })
})
