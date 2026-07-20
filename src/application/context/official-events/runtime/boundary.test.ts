import { describe, expect, it } from 'vitest'

const runtimeSources = import.meta.glob(
  ['./*.ts', '!./*.test.ts', '!./testFixtures.ts'],
  {
    eager: true,
    query: '?raw',
    import: 'default',
  }
) as Record<string, string>

const criticalFinancialSources = import.meta.glob(
  [
    '../../../../domain/contribution/**/*.ts',
    '../../../../domain/technicalDossier/**/*.ts',
    '../../../../features/contribution/**/*.{ts,tsx}',
    '../../../../pages/NewContributionPage.tsx',
    '../../../../pages/PortfolioPage.tsx',
    '../../../../pages/HistoryPage.tsx',
  ],
  { eager: true, query: '?raw', import: 'default' }
) as Record<string, string>

describe('OfficialEventsRuntimeV1 browser and financial boundaries', () => {
  it('does not import server-only, providers, executor, backfill or service role', () => {
    const source = Object.values(runtimeSources).join('\n')
    expect(source).not.toMatch(
      /src\/server|\/server\/|providers|executor|backfill|service[_ -]?role/i
    )
  })

  it('does not use browser globals, environment, filesystem or child processes', () => {
    const source = Object.values(runtimeSources).join('\n')
    expect(source).not.toMatch(
      /process\.env|\bwindow\b|\bdocument\b|localStorage|node:fs|child_process/
    )
  })

  it('does not create a client, singleton, React hook or component', () => {
    const source = Object.values(runtimeSources).join('\n')
    expect(source).not.toMatch(
      /createClient\s*\(|use[A-Z]\w*\s*\(|from ['"]react['"]|\.tsx|singleton/i
    )
  })

  it('does not execute Date or random environmental sources', () => {
    const source = Object.values(runtimeSources).join('\n')
    expect(source).not.toMatch(
      /Date\.now|new Date|Math\.random|crypto\.randomUUID/
    )
  })

  it('is not imported by critical financial flows', () => {
    const source = Object.values(criticalFinancialSources).join('\n')
    expect(source).not.toMatch(/official-events\/runtime|officialEventsRuntime/)
  })

  it('contains no automatic Supabase or repository operation at module scope', () => {
    const source = Object.values(runtimeSources).join('\n')
    expect(source).not.toMatch(/void\s+createSupabaseOfficialEventsRuntimeV1/)
    expect(source).not.toMatch(/export\s+const\s+runtime\s*=/)
  })
})
