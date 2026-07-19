import { describe, expect, it } from 'vitest'

const browserSources = import.meta.glob(
  [
    '../../../components/**/*.{ts,tsx}',
    '../../../features/**/*.{ts,tsx}',
    '../../../pages/**/*.{ts,tsx}',
    '../../../data/index.ts',
    '../../../data/context/index.ts',
  ],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

const serverSources = import.meta.glob('./*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const productionServerSources = Object.fromEntries(
  Object.entries(serverSources).filter(([path]) => !path.endsWith('.test.ts'))
)

describe('official events server-only boundary', () => {
  it('is not imported or exported by browser modules', () => {
    Object.entries(browserSources).forEach(([path, source]) => {
      expect(source, path).not.toMatch(/server\/context\/official-events/)
      expect(source, path).not.toMatch(/official-events-server-execution/)
    })
  })

  it('contains no environment, browser, secret or singleton access', () => {
    Object.entries(productionServerSources).forEach(([path, source]) => {
      expect(source, path).not.toMatch(/process\.env|import\.meta\.env/)
      expect(source, path).not.toMatch(/\bwindow\b|\bdocument\b|localStorage/)
      expect(source, path).not.toMatch(/SERVICE_ROLE|serviceRole/)
      expect(source, path).not.toMatch(/createClient\s*\(/)
      expect(source, path).not.toMatch(/Authorization\s*:/)
      expect(source, path).not.toMatch(/Cookie\s*:/)
    })
  })

  it('uses the canonical persistence facade instead of the RPC', () => {
    const executor = productionServerSources['./executor.ts']
    expect(executor).toContain('persistOfficialAssetEventsV1')
    expect(executor).not.toContain('.rpc(')
    expect(executor).not.toContain('upsert_official_asset_events_v1')
  })
})
