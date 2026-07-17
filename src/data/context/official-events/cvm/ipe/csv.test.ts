import { describe, expect, it } from 'vitest'
import { CVM_IPE_HEADERS, MAX_CVM_IPE_CSV_ROWS } from './constants'
import { parseOfficialCvmIpeCsv } from './csv'
import { createFixtureCsv, createFixtureRow } from './testFixtures'

describe('parseOfficialCvmIpeCsv', () => {
  it.each(['\r\n', '\n'])('parses %j line endings', (separator) => {
    const csv = [
      CVM_IPE_HEADERS.join(';'),
      Object.values(createFixtureRow()).join(';'),
    ].join(separator)
    expect(parseOfficialCvmIpeCsv(csv)).toHaveLength(1)
  })

  it('accepts a UTF BOM on the first header', () => {
    expect(
      parseOfficialCvmIpeCsv(`\uFEFF${createFixtureCsv([createFixtureRow()])}`)
    ).toHaveLength(1)
  })

  it('parses quoted delimiters, escaped quotes and embedded newlines', () => {
    const row = createFixtureRow()
    const values = Object.values(row)
    values[7] = '"Assunto; com ""aspas""\ne nova linha"'
    const parsed = parseOfficialCvmIpeCsv(
      `${CVM_IPE_HEADERS.join(';')}\n${values.join(';')}`
    )
    expect(parsed[0].subject).toBe('Assunto; com "aspas"\ne nova linha')
  })

  it('preserves CRLF inside a quoted field', () => {
    const values = Object.values(createFixtureRow())
    values[7] = '"primeira linha\r\nsegunda linha"'
    expect(
      parseOfficialCvmIpeCsv(
        `${CVM_IPE_HEADERS.join(';')}\r\n${values.join(';')}`
      )[0].subject
    ).toBe('primeira linha\r\nsegunda linha')
  })

  it('rejects quotes inside an unquoted field', () => {
    const values = Object.values(createFixtureRow())
    values[7] = 'Deliberação em "AGO" oficial'
    expect(() =>
      parseOfficialCvmIpeCsv(
        `${CVM_IPE_HEADERS.join(';')}\n${values.join(';')}`
      )
    ).toThrow(/quote inside an unquoted field/)
  })

  it('preserves empty fields, including the final field', () => {
    const parsed = parseOfficialCvmIpeCsv(
      createFixtureCsv([
        createFixtureRow({ Tipo: '', Especie: '', Link_Download: '' }),
      ])
    )[0]
    expect(parsed.documentType).toBe('')
    expect(parsed.species).toBe('')
    expect(parsed.downloadLink).toBe('')
  })

  it('accepts the final row without a newline', () => {
    const csv = createFixtureCsv([createFixtureRow()])
    expect(csv.endsWith('\n')).toBe(false)
    expect(parseOfficialCvmIpeCsv(csv)).toHaveLength(1)
  })

  it('preserves all audited raw fields in semantic properties', () => {
    const parsed = parseOfficialCvmIpeCsv(
      createFixtureCsv([createFixtureRow({ Assunto: 'Campo auditado' })])
    )[0]
    expect(parsed).toMatchObject({
      rowNumber: 2,
      companyName: 'BANCO DO BRASIL S.A.',
      subject: 'Campo auditado',
      presentationType: 'AP - Apresentação',
    })
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype)
    expect(
      Object.values(parsed).every((_value, index) =>
        Object.hasOwn(parsed, Object.keys(parsed)[index])
      )
    ).toBe(true)
  })

  it('keeps rowNumber based on logical records when a field is multiline', () => {
    const first = Object.values(createFixtureRow())
    first[7] = '"linha 1\nlinha 2"'
    const second = Object.values(
      createFixtureRow({ Protocolo_Entrega: 'second' })
    )
    const parsed = parseOfficialCvmIpeCsv(
      [CVM_IPE_HEADERS.join(';'), first.join(';'), second.join(';')].join('\n')
    )
    expect(parsed.map(({ rowNumber }) => rowNumber)).toEqual([2, 3])
  })

  it('returns fresh plain rows on every parse', () => {
    const csv = createFixtureCsv([createFixtureRow()])
    const first = parseOfficialCvmIpeCsv(csv)
    first[0].subject = 'changed'
    const second = parseOfficialCvmIpeCsv(csv)
    expect(second[0].subject).toBe('Evento oficial')
    expect(Object.getPrototypeOf(second[0])).toBe(Object.prototype)
  })

  it('removes BOM only from the first header and preserves BOM in data', () => {
    const row = createFixtureRow({ Assunto: '\uFEFFpreservado' })
    const parsed = parseOfficialCvmIpeCsv(`\uFEFF${createFixtureCsv([row])}`)
    expect(parsed[0].subject).toBe('\uFEFFpreservado')
  })

  it('rejects an unterminated quoted field', () => {
    expect(() =>
      parseOfficialCvmIpeCsv(`${CVM_IPE_HEADERS.join(';')}\n"unterminated`)
    ).toThrow(/unterminated/)
  })

  it('rejects content after a closing quote', () => {
    const values = Object.values(createFixtureRow())
    values[7] = '"closed"invalid'
    expect(() =>
      parseOfficialCvmIpeCsv(
        `${CVM_IPE_HEADERS.join(';')}\n${values.join(';')}`
      )
    ).toThrow(/after a closing quote/)
  })

  it('rejects NUL anywhere in the CSV', () => {
    expect(() =>
      parseOfficialCvmIpeCsv(
        createFixtureCsv([createFixtureRow({ Assunto: 'antes\0depois' })])
      )
    ).toThrow(/NUL/)
  })

  it('rejects bare CR outside a quoted field', () => {
    const values = Object.values(createFixtureRow())
    values[7] = 'antes\rdepois'
    expect(() =>
      parseOfficialCvmIpeCsv(
        `${CVM_IPE_HEADERS.join(';')}\n${values.join(';')}`
      )
    ).toThrow(/CR line ending/)
  })

  it('rejects duplicate headers', () => {
    const headers = [...CVM_IPE_HEADERS]
    headers[1] = headers[0]
    expect(() => parseOfficialCvmIpeCsv(headers.join(';'))).toThrow(/duplicate/)
  })

  it('rejects missing, extra or reordered headers', () => {
    expect(() =>
      parseOfficialCvmIpeCsv(CVM_IPE_HEADERS.slice(1).join(';'))
    ).toThrow(/schema/)
    expect(() =>
      parseOfficialCvmIpeCsv(`${CVM_IPE_HEADERS.join(';')};Extra`)
    ).toThrow(/schema/)
    expect(() =>
      parseOfficialCvmIpeCsv([...CVM_IPE_HEADERS].reverse().join(';'))
    ).toThrow(/schema/)
  })

  it('rejects a structurally impossible row width', () => {
    expect(() =>
      parseOfficialCvmIpeCsv(`${CVM_IPE_HEADERS.join(';')}\nonly-one-column`)
    ).toThrow(/column count/)
  })

  it('rejects a row with more columns than the header', () => {
    expect(() =>
      parseOfficialCvmIpeCsv(
        `${createFixtureCsv([createFixtureRow()])};unexpected`
      )
    ).toThrow(/column count/)
  })

  it('rejects more than sixty-four columns', () => {
    expect(() =>
      parseOfficialCvmIpeCsv(Array.from({ length: 65 }, () => 'x').join(';'))
    ).toThrow(/column count limit/)
  })

  it('rejects an uncontrolled row count', () => {
    const content = `${CVM_IPE_HEADERS.join(';')}\n${'\n'.repeat(
      MAX_CVM_IPE_CSV_ROWS + 1
    )}`
    expect(() => parseOfficialCvmIpeCsv(content)).toThrow(/row count/)
  })
})
