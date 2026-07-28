import { describe, expect, it } from 'vitest'

const featureSources = import.meta.glob(
  ['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'],
  { eager: true, query: '?raw', import: 'default' }
) as Record<string, string>

const criticalFinancialSources = import.meta.glob(
  [
    '../contribution/**/*.{ts,tsx}',
    '../portfolio/**/*.{ts,tsx}',
    '../history/**/*.{ts,tsx}',
  ],
  { eager: true, query: '?raw', import: 'default' }
) as Record<string, string>

const integrationSources = import.meta.glob(
  [
    '../../app/AppComposition.tsx',
    '../../app/router/AppRouter.tsx',
    '../../components/layout/Sidebar.tsx',
    '../../lib/navigation.ts',
  ],
  { eager: true, query: '?raw', import: 'default' }
) as Record<string, string>

describe('official events UI boundary', () => {
  it('depends on the runtime and never imports server, storage, repository or providers', () => {
    const forbidden = [
      '/storage/',
      '/repository/',
      '/server/',
      '/providers/',
      '/backfill/',
      'supabase',
      'service_role',
      'process.env',
      'node:fs',
      'child_process',
    ]
    for (const [path, source] of Object.entries(featureSources)) {
      const normalizedSource = source.replaceAll('\\', '/')
      for (const fragment of forbidden) {
        expect(normalizedSource, `${path} contains ${fragment}`).not.toContain(
          fragment
        )
      }
    }
  })

  it('does not use unsafe HTML, embedded documents, persistence or logging', () => {
    const source = Object.values(featureSources).join('\n')
    for (const forbidden of [
      'dangerouslySetInnerHTML',
      '.innerHTML',
      '<iframe',
      '<embed',
      'localStorage',
      'sessionStorage',
      'console.',
      'fetch(',
    ]) {
      expect(source).not.toContain(forbidden)
    }
  })

  it('keeps financial features independent from the optional UI', () => {
    const source = Object.values(criticalFinancialSources).join('\n')
    expect(source).not.toContain('official-events')
  })

  it('registers one protected route and an explicit UI-mode composition without env', () => {
    const source = Object.values(integrationSources).join('\n')
    expect(source).toContain('path="/eventos-oficiais"')
    expect(source).toContain('createRealOfficialEventsUiDependenciesV1')
    expect(source).toContain('getNavigationItems(runtime.getCapability().mode)')
    expect(source).not.toMatch(/import\.meta\.env|process\.env|SERVICE_ROLE/)
  })

  it('keeps keyboard and focus behavior explicit in the details dialog', () => {
    const dialog = featureSources['./components/OfficialEventDetailsDialog.tsx']
    expect(dialog).toContain("event.key === 'Escape'")
    expect(dialog).toContain("event.key !== 'Tab'")
    expect(dialog).toContain('returnFocusTarget?.focus()')
  })
})
