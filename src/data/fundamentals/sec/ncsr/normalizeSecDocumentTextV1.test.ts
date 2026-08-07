import { describe, expect, it } from 'vitest'
import { normalizeSecDocumentTextV1 } from './normalizeSecDocumentTextV1'

// Recorte REAL do HTML do N-CSR de VNQ (accession 0001104659-26-036013),
// com os atributos `style` encurtados para caber no teste. A estrutura -
// `<td>` por célula, texto seguido de quebra de linha, sem espaço entre
// as tags - é a do documento original.
const REAL_TABLE_ROW_HTML = `<tr style="page-break-inside:avoid"><td style="text-align:left">Total Distributions
</td><td style="text-align:right">(3.472)
</td><td style="text-align:right">(3.434)
</td></tr>`

describe('normalizeSecDocumentTextV1', () => {
  it('turns a real filing table row into space-separated tokens', () => {
    expect(normalizeSecDocumentTextV1(REAL_TABLE_ROW_HTML)).toBe(
      'Total Distributions (3.472) (3.434)'
    )
  })

  it('never glues two adjacent cells into a single token', () => {
    expect(normalizeSecDocumentTextV1('<td>2026</td><td>2025</td>')).toBe(
      '2026 2025'
    )
  })

  it('decodes the entities the filing actually uses for spacing and dashes', () => {
    expect(
      normalizeSecDocumentTextV1(
        '<td>Return&nbsp;of&#8194;Capital</td><td>&#8212;</td><td>&mdash;</td>'
      )
    ).toBe('Return of Capital — —')
  })

  it('drops comments, scripts and styles entirely', () => {
    expect(
      normalizeSecDocumentTextV1(
        '<style>td{color:red}</style><!-- hidden --><script>x=1</script><td>2026</td>'
      )
    ).toBe('2026')
  })

  it('preserves the ampersand of a fund name', () => {
    expect(normalizeSecDocumentTextV1('<td>Smith &amp; Co Fund</td>')).toBe(
      'Smith & Co Fund'
    )
  })
})
