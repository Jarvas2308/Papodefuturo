import { describe, expect, it } from 'vitest'
import backfillIndex from './index.ts?raw'
import inMemorySource from './inMemoryCheckpoint.ts?raw'
import orchestratorSource from './orchestrator.ts?raw'
import plannerSource from './planner.ts?raw'
import supabaseSource from './supabaseCheckpoint.ts?raw'
import applicationEntry from '../../../../main.tsx?raw'
import dataBarrel from '../../../../data/context/official-events/index.ts?raw'

const sources = [
  backfillIndex,
  inMemorySource,
  orchestratorSource,
  plannerSource,
  supabaseSource,
]

describe('official events backfill server-only boundary', () => {
  it('contains no browser APIs, secrets, env reads, or automatic execution', () => {
    for (const source of sources) {
      expect(source).not.toMatch(
        /process\.env|service[_-]?role[_-]?key|\bwindow\b|\bdocument\b|localStorage|sessionStorage|crypto\.randomUUID|Date\.now|Math\.random/
      )
      expect(source).not.toMatch(/createClient\s*\(/)
    }
  })

  it('contains no React, provider, UI, or direct table dependency', () => {
    for (const source of sources) {
      expect(source).not.toMatch(
        /from ['"]react|\.tsx['"]|official_asset_events|\.from\s*\(/
      )
    }
  })

  it('is not exported by application or data barrels', () => {
    expect(applicationEntry).not.toContain('backfill')
    expect(dataBarrel).not.toContain('backfill')
  })
})
