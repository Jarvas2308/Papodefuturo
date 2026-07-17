import { describe, expect, it } from 'vitest'
import {
  buildOfficialEventFingerprintV1,
  normalizeOfficialEventUrlV1,
  selectOfficialEventDocumentIdentityV1,
} from './documentIdentity'
import { createDocumentIdentifiers } from './testFixtures'

describe('official event URL normalization', () => {
  it('accepts and canonicalizes HTTPS URLs without network access', () => {
    expect(normalizeOfficialEventUrlV1('https://example.com/document')).toBe(
      'https://example.com/document'
    )
  })

  it('rejects HTTP', () => {
    expect(() =>
      normalizeOfficialEventUrlV1('http://example.com/document')
    ).toThrow(/HTTPS/)
  })

  it('rejects outer URL whitespace instead of silently trimming it', () => {
    expect(() =>
      normalizeOfficialEventUrlV1(' https://example.com/document')
    ).toThrow(/outer whitespace/)
  })

  it('rejects embedded credentials', () => {
    expect(() =>
      normalizeOfficialEventUrlV1('https://user:secret@example.com/doc')
    ).toThrow(/credentials/)
  })

  it('removes fragments', () => {
    expect(normalizeOfficialEventUrlV1('https://example.com/doc#page=2')).toBe(
      'https://example.com/doc'
    )
  })

  it('removes only known tracking parameters', () => {
    expect(
      normalizeOfficialEventUrlV1(
        'https://example.com/doc?id=7&utm_source=x&utm_medium=y&gclid=z&fbclid=w'
      )
    ).toBe('https://example.com/doc?id=7')
  })

  it('preserves and sorts functional query parameters', () => {
    expect(
      normalizeOfficialEventUrlV1('https://example.com/doc?z=2&a=3&a=1')
    ).toBe('https://example.com/doc?a=1&a=3&z=2')
  })

  it('normalizes an empty query consistently', () => {
    expect(normalizeOfficialEventUrlV1('https://example.com/doc?')).toBe(
      'https://example.com/doc'
    )
  })

  it('preserves an empty functional parameter value', () => {
    expect(
      normalizeOfficialEventUrlV1('https://example.com/doc?download=')
    ).toBe('https://example.com/doc?download=')
  })

  it('removes tracking parameters case-insensitively', () => {
    expect(
      normalizeOfficialEventUrlV1(
        'https://example.com/doc?UTM_SOURCE=x&FbClId=y&id=1'
      )
    ).toBe('https://example.com/doc?id=1')
  })

  it('removes a fragment that contains query-like text', () => {
    expect(
      normalizeOfficialEventUrlV1('https://example.com/doc?id=1#page?x=2')
    ).toBe('https://example.com/doc?id=1')
  })

  it('normalizes an explicit default HTTPS port', () => {
    expect(normalizeOfficialEventUrlV1('https://example.com:443/doc')).toBe(
      'https://example.com/doc'
    )
  })

  it('preserves an explicit non-default HTTPS port', () => {
    expect(normalizeOfficialEventUrlV1('https://example.com:8443/doc')).toBe(
      'https://example.com:8443/doc'
    )
  })

  it('normalizes a Unicode host deterministically to punycode', () => {
    expect(normalizeOfficialEventUrlV1('https://exemplo.ação.br/doc')).toBe(
      'https://exemplo.xn--ao-siap.br/doc'
    )
  })

  it('preserves percent-encoded path semantics', () => {
    expect(normalizeOfficialEventUrlV1('https://example.com/a%2Fb/doc')).toBe(
      'https://example.com/a%2Fb/doc'
    )
  })

  it('preserves percent-encoded functional query semantics', () => {
    expect(
      normalizeOfficialEventUrlV1(
        'https://example.com/doc?redirect=%2Ffolder%2Fitem'
      )
    ).toBe('https://example.com/doc?redirect=%2Ffolder%2Fitem')
  })

  it('rejects percent-encoded credentials', () => {
    expect(() =>
      normalizeOfficialEventUrlV1('https://us%65r:secr%65t@example.com/doc')
    ).toThrow(/credentials/)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/plain,content',
    'file:///tmp/document',
    '//example.com/document',
  ])('rejects unsupported or relative URL %s', (value) => {
    expect(() => normalizeOfficialEventUrlV1(value)).toThrow()
  })
})

describe('official event document identity', () => {
  it.each([
    ['sourceDocumentId', 'source-document-id'],
    ['regulatoryDocumentId', 'regulatory-document-id'],
    ['accessionNumber', 'accession-number'],
    ['protocolNumber', 'protocol-number'],
    ['canonicalUrl', 'canonical-url'],
    ['fingerprint', 'fingerprint'],
  ] as const)('selects %s at its documented priority', (field, kind) => {
    const identifiers = createDocumentIdentifiers({
      sourceDocumentId: null,
      regulatoryDocumentId: null,
      accessionNumber: null,
      protocolNumber: null,
      canonicalUrl: null,
      fingerprint: null,
      [field]:
        field === 'canonicalUrl'
          ? 'https://example.com/doc'
          : field === 'fingerprint'
            ? 'fnv1a64:0123456789abcdef'
            : 'identity-value',
    })
    expect(selectOfficialEventDocumentIdentityV1(identifiers)).toMatchObject({
      kind,
    })
  })

  it('uses the first available identifier only', () => {
    expect(
      selectOfficialEventDocumentIdentityV1(createDocumentIdentifiers())
    ).toMatchObject({
      kind: 'source-document-id',
      value: 'cvm:ipe:document-1',
    })
  })

  it('rejects complete absence', () => {
    expect(() =>
      selectOfficialEventDocumentIdentityV1(
        createDocumentIdentifiers({
          sourceDocumentId: null,
          regulatoryDocumentId: null,
          accessionNumber: null,
          protocolNumber: null,
          canonicalUrl: null,
          fingerprint: null,
        })
      )
    ).toThrow(/at least one identifier/)
  })

  it('treats whitespace-only identifiers as absent consistently', () => {
    expect(
      selectOfficialEventDocumentIdentityV1(
        createDocumentIdentifiers({
          sourceDocumentId: ' ',
          regulatoryDocumentId: 'reg-1',
        })
      ).kind
    ).toBe('regulatory-document-id')
  })

  it('rejects outer whitespace on a non-empty identifier', () => {
    expect(() =>
      selectOfficialEventDocumentIdentityV1(
        createDocumentIdentifiers({ sourceDocumentId: ' document-1 ' })
      )
    ).toThrow(/outer whitespace/)
  })

  it('builds a deterministic deduplication key', () => {
    const identifiers = createDocumentIdentifiers()
    expect(selectOfficialEventDocumentIdentityV1(identifiers)).toEqual(
      selectOfficialEventDocumentIdentityV1(identifiers)
    )
  })

  it('rejects a malformed fallback fingerprint', () => {
    expect(() =>
      selectOfficialEventDocumentIdentityV1(
        createDocumentIdentifiers({
          sourceDocumentId: null,
          canonicalUrl: null,
          fingerprint: 'fnv1a64:ABC',
        })
      )
    ).toThrow(/fingerprint/)
  })
})

describe('official event fallback fingerprint', () => {
  const input = {
    source: 'cvm-ipe',
    assetIdentityKey: 'asset-key',
    eventType: 'material-fact',
    publishedAt: { precision: 'date', date: '2026-07-15', raw: '2026-07-15' },
    canonicalUrl: 'https://example.com/doc',
    title: 'Title',
  } as const

  it('has a fixed audited FNV-1a value', () => {
    expect(buildOfficialEventFingerprintV1(input)).toBe(
      'fnv1a64:4ceef6425cb33725'
    )
  })

  it('uses exactly sixteen lowercase hexadecimal characters', () => {
    expect(buildOfficialEventFingerprintV1(input)).toMatch(
      /^fnv1a64:[0-9a-f]{16}$/
    )
  })

  it('is deterministic', () => {
    expect(buildOfficialEventFingerprintV1(input)).toBe(
      buildOfficialEventFingerprintV1(input)
    )
  })

  it('changes when a relevant field changes', () => {
    expect(
      buildOfficialEventFingerprintV1({ ...input, title: 'Other title' })
    ).not.toBe(buildOfficialEventFingerprintV1(input))
  })

  it('does not accept ingestion timestamps as fingerprint input', () => {
    expect(Object.keys(input)).not.toContain('ingestedAt')
    expect(Object.keys(input)).not.toContain('updatedAt')
  })
})
