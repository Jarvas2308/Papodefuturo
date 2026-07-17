import { describe, expect, it } from 'vitest'
import { CVM_FUND_DELIVERY_HEADERS } from './constants'
import { parseOfficialCvmFundDeliveryCsv } from './csv'
import {
  createFundDeliveryFixtureCsv,
  createFundDeliveryFixtureRow,
} from './testFixtures'

describe('parseOfficialCvmFundDeliveryCsv', () => {
  it.each(['\r\n', '\n'])(
    'parses %j line endings and all 11 fields',
    (separator) => {
      const csv = [
        CVM_FUND_DELIVERY_HEADERS.join(';'),
        Object.values(createFundDeliveryFixtureRow()).join(';'),
      ].join(separator)
      expect(parseOfficialCvmFundDeliveryCsv(csv)[0]).toMatchObject({
        rowNumber: 2,
        fundClassCnpj: '12005956000165',
        documentType: 'INFORM MENSAL',
        sourceSystem: 'FNET',
      })
    }
  )

  it('accepts BOM only on the first header', () => {
    expect(
      parseOfficialCvmFundDeliveryCsv(
        `\uFEFF${createFundDeliveryFixtureCsv([createFundDeliveryFixtureRow()])}`
      )
    ).toHaveLength(1)
  })

  it('parses quoted delimiters, escaped quotes and newlines', () => {
    const parsed = parseOfficialCvmFundDeliveryCsv(
      createFundDeliveryFixtureCsv([
        createFundDeliveryFixtureRow({
          Tipo_Apresentacao: 'Texto; "oficial"\nsegunda linha',
        }),
      ])
    )
    expect(parsed[0].presentationType).toBe('Texto; "oficial"\nsegunda linha')
  })

  it.each([
    '',
    CVM_FUND_DELIVERY_HEADERS.slice(1).join(';'),
    [...CVM_FUND_DELIVERY_HEADERS].reverse().join(';'),
    `${CVM_FUND_DELIVERY_HEADERS.join(';')};Extra`,
  ])('rejects an invalid schema %#', (csv) => {
    expect(() => parseOfficialCvmFundDeliveryCsv(csv)).toThrow()
  })

  it('rejects duplicate headers, NUL, invalid width and malformed quotes', () => {
    const duplicated = [...CVM_FUND_DELIVERY_HEADERS]
    duplicated[1] = duplicated[0]
    expect(() => parseOfficialCvmFundDeliveryCsv(duplicated.join(';'))).toThrow(
      /duplicate/
    )
    expect(() =>
      parseOfficialCvmFundDeliveryCsv(
        createFundDeliveryFixtureCsv([
          createFundDeliveryFixtureRow({ Ativo: 'S\0' }),
        ])
      )
    ).toThrow(/NUL/)
    expect(() =>
      parseOfficialCvmFundDeliveryCsv(
        `${CVM_FUND_DELIVERY_HEADERS.join(';')}\nonly-one`
      )
    ).toThrow(/column count/)
    expect(() =>
      parseOfficialCvmFundDeliveryCsv(
        `${CVM_FUND_DELIVERY_HEADERS.join(';')}\n"unterminated`
      )
    ).toThrow(/unterminated/)
  })

  it('returns fresh plain objects without mutating the source', () => {
    const csv = createFundDeliveryFixtureCsv([createFundDeliveryFixtureRow()])
    const first = parseOfficialCvmFundDeliveryCsv(csv)
    first[0].documentType = 'changed'
    const second = parseOfficialCvmFundDeliveryCsv(csv)
    expect(second[0].documentType).toBe('INFORM MENSAL')
    expect(Object.getPrototypeOf(second[0])).toBe(Object.prototype)
  })
})
