import { describe, expect, it } from 'vitest'
import { isSafeSecPrimaryDocumentPath } from './path'

describe('isSafeSecPrimaryDocumentPath', () => {
  it('accepts the real SEC NPORT-P XSLT viewer path shape', () => {
    expect(
      isSafeSecPrimaryDocumentPath('xslFormNPORT-P_X01/primary_doc.xml')
    ).toBe(true)
  })

  it('accepts a bare file name', () => {
    expect(isSafeSecPrimaryDocumentPath('primary_doc.xml')).toBe(true)
  })

  it('rejects an empty value', () => {
    expect(isSafeSecPrimaryDocumentPath('')).toBe(false)
  })

  it('rejects values with leading or trailing whitespace', () => {
    expect(isSafeSecPrimaryDocumentPath(' primary_doc.xml')).toBe(false)
    expect(isSafeSecPrimaryDocumentPath('primary_doc.xml ')).toBe(false)
  })

  it('rejects an absolute path', () => {
    expect(isSafeSecPrimaryDocumentPath('/etc/passwd')).toBe(false)
  })

  it('rejects a backslash', () => {
    expect(isSafeSecPrimaryDocumentPath('xsl\\primary_doc.xml')).toBe(false)
  })

  it('rejects path traversal segments', () => {
    expect(isSafeSecPrimaryDocumentPath('../primary_doc.xml')).toBe(false)
    expect(isSafeSecPrimaryDocumentPath('a/../b.xml')).toBe(false)
    expect(isSafeSecPrimaryDocumentPath('.')).toBe(false)
    expect(isSafeSecPrimaryDocumentPath('..')).toBe(false)
  })

  it('rejects empty segments', () => {
    expect(isSafeSecPrimaryDocumentPath('a//b.xml')).toBe(false)
    expect(isSafeSecPrimaryDocumentPath('a/')).toBe(false)
  })

  it('rejects segments with unsafe characters', () => {
    expect(isSafeSecPrimaryDocumentPath('a b.xml')).toBe(false)
    expect(isSafeSecPrimaryDocumentPath('a?b.xml')).toBe(false)
    expect(isSafeSecPrimaryDocumentPath('a#b.xml')).toBe(false)
    expect(isSafeSecPrimaryDocumentPath('https://evil.example/x')).toBe(false)
  })
})
