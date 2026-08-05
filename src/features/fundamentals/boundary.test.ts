import { describe, expect, it } from 'vitest'

const featureSources = import.meta.glob(
  ['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'],
  { eager: true, query: '?raw', import: 'default' }
) as Record<string, string>

const criticalFinancialSources = import.meta.glob(
  [
    '../../domain/contribution/**/*.ts',
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

describe('fundamentals UI boundary', () => {
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

  it('keeps financial features independent from the optional fundamentals UI', () => {
    // Isolamento original (Sprint 4, commit 6618cce): fundamentos era so
    // apresentacao, sem score/ranking/recomendacao - qualquer mencao a
    // "fundamentals" nos fluxos financeiros criticos seria acoplamento
    // acidental. Revisado deliberadamente pela Fase 5/6 do Sprint 16
    // (DEC-086): o motor de score le dado de fundamentos (data/fundamentals,
    // domain/fundamentals) para pontuar candidatos no laco guloso - decisao
    // explicita, nao um vazamento. O que continua proibido, sem excecao: a
    // feature de apresentacao opcional (features/fundamentals) e o runtime
    // read-only dela (application/context/fundamentals/runtime, ja coberto
    // por boundary.test.ts na propria pasta do runtime) - os fluxos
    // financeiros nunca dependem daquele modulo, so dos builders puros de
    // dominio e do repositorio de leitura.
    const source = Object.values(criticalFinancialSources).join('\n')
    expect(source).not.toMatch(/features\/fundamentals|fundamentals\/runtime/)
  })

  it('registers one protected route and an explicit UI-mode composition without env', () => {
    const source = Object.values(integrationSources).join('\n')
    expect(source).toContain('path="/fundamentos"')
    expect(source).toContain('createRealFundamentalsUiDependenciesV1')
    expect(source).toMatch(
      /getNavigationItems\([\s\S]*fundamentalsRuntime\.getCapability\(\)\.mode/
    )
    expect(source).not.toMatch(/import\.meta\.env|process\.env|SERVICE_ROLE/)
  })
})
