import { describe, expect, it } from 'vitest'
import { normalizeCvmDescription } from './normalizeDescription'

describe('normalizeCvmDescription', () => {
  it('applies Unicode NFC normalization', () => {
    expect(normalizeCvmDescription('Patrimo\u0302nio Líquido')).toBe(
      normalizeCvmDescription('Patrimônio Líquido')
    )
  })

  it('normalizes casing', () => {
    expect(normalizeCvmDescription('Ativo Total')).toBe('ATIVO TOTAL')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeCvmDescription('  Ativo Total  ')).toBe('ATIVO TOTAL')
  })

  it('collapses internal whitespace', () => {
    expect(normalizeCvmDescription('Ativo\t  Total')).toBe('ATIVO TOTAL')
  })

  it('does not remove accents', () => {
    expect(normalizeCvmDescription('Líquido')).not.toBe(
      normalizeCvmDescription('Liquido')
    )
  })

  it('does not remove punctuation or replace slashes', () => {
    expect(normalizeCvmDescription('Lucro/Prejuízo')).toBe('LUCRO/PREJUÍZO')
    expect(normalizeCvmDescription('Lucro/Prejuízo')).not.toBe(
      normalizeCvmDescription('Lucro ou Prejuízo')
    )
  })
})
