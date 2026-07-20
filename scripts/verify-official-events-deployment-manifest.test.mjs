import { createHash } from 'node:crypto'
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  EXPECTED_SOURCE_HEAD,
  verifyOfficialEventsDeploymentManifestV1,
} from './verify-official-events-deployment-manifest.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '..')
const sourceManifestPath = join(
  repositoryRoot,
  'docs',
  'runbooks',
  'official-events-deployment-manifest-v1.json'
)
const sourceMigrationsDirectory = join(repositoryRoot, 'supabase', 'migrations')
const temporaryDirectories = []

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'official-events-manifest-'))
  temporaryDirectories.push(root)
  const migrationsDirectory = join(root, 'migrations')
  mkdirSync(migrationsDirectory)
  const manifest = JSON.parse(readFileSync(sourceManifestPath, 'utf8'))
  for (const migration of manifest.migrations) {
    copyFileSync(
      join(sourceMigrationsDirectory, migration.filename),
      join(migrationsDirectory, migration.filename)
    )
  }
  const manifestPath = join(root, 'manifest.json')
  const save = () =>
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  save()
  const verify = () =>
    verifyOfficialEventsDeploymentManifestV1({
      manifestPath,
      migrationsDirectory,
    })
  return { manifest, manifestPath, migrationsDirectory, save, verify }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true })
})

describe('official events deployment manifest verifier', () => {
  it('accepts the valid deterministic manifest', () => {
    const input = fixture()
    const first = input.verify()
    const second = input.verify()
    expect(first).toEqual(second)
    expect(first.sourceHead).toBe(EXPECTED_SOURCE_HEAD)
    expect(first.migrations).toHaveLength(4)
  })

  it('rejects a divergent hash', () => {
    const input = fixture()
    input.manifest.migrations[0].sha256 = '0'.repeat(64)
    input.save()
    expect(input.verify).toThrow(/hash diverges/)
  })

  it('rejects a divergent size', () => {
    const input = fixture()
    input.manifest.migrations[0].sizeBytes += 1
    input.save()
    expect(input.verify).toThrow(/size diverges/)
  })

  it('rejects a missing migration', () => {
    const input = fixture()
    unlinkSync(
      join(input.migrationsDirectory, input.manifest.migrations[2].filename)
    )
    expect(input.verify).toThrow(/migration is missing/)
  })

  it('rejects a divergent order', () => {
    const input = fixture()
    ;[input.manifest.migrations[0], input.manifest.migrations[1]] = [
      input.manifest.migrations[1],
      input.manifest.migrations[0],
    ]
    input.save()
    expect(input.verify).toThrow(/migration order diverges/)
  })

  it('ignores an additional migration outside the approved inventory', () => {
    const input = fixture()
    writeFileSync(
      join(input.migrationsDirectory, '20990101000000_extra.sql'),
      '-- extra\n'
    )
    expect(input.verify()).toMatchObject({ activationState: 'disabled' })
  })

  it('rejects invalid JSON', () => {
    const input = fixture()
    writeFileSync(input.manifestPath, '{')
    expect(input.verify).toThrow(/JSON cannot be parsed/)
  })

  it('rejects an unsupported manifest version', () => {
    const input = fixture()
    input.manifest.manifestVersion = 'official-events-deployment-manifest.v2'
    input.save()
    expect(input.verify).toThrow(/manifestVersion is unsupported/)
  })

  it('rejects a divergent source head', () => {
    const input = fixture()
    input.manifest.sourceHead = '1'.repeat(40)
    input.save()
    expect(input.verify).toThrow(/sourceHead diverges/)
  })

  it('rejects migration paths outside the migrations directory', () => {
    const input = fixture()
    input.manifest.migrations[0].filename = '../migration.sql'
    input.save()
    expect(input.verify).toThrow(/filename escapes/)
  })

  it('contains no network, environment read, or write operation in the verifier', () => {
    const source = readFileSync(
      join(scriptDirectory, 'verify-official-events-deployment-manifest.mjs'),
      'utf8'
    )
    expect(source).not.toMatch(/\bfetch\b|node:https?|process\.env/)
    expect(source).not.toMatch(
      /writeFile|appendFile|createWriteStream|unlink|rename|rmSync|mkdirSync/
    )
    expect(createHash('sha256').update(source).digest('hex')).toMatch(
      /^[0-9a-f]{64}$/
    )
  })
})
