import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const MANIFEST_VERSION = 'official-events-deployment-manifest.v1'
export const EXPECTED_SOURCE_HEAD = '66dc336fb78bef03580bc2a454196b318269cda0'
export const EXPECTED_SOURCE_BASE = '2808fc3cc385613c0f9914c24b8beb238409e7b9'

const EXPECTED_MIGRATIONS = [
  '20260719165850_create_official_asset_events.sql',
  '20260719173416_create_official_asset_events_upsert_rpc_v1.sql',
  '20260719221733_create_official_events_backfill_checkpoint_v1.sql',
  '20260719235049_create_official_asset_events_read_rpcs_v1.sql',
]

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '..')
const defaultManifestPath = join(
  repositoryRoot,
  'docs',
  'runbooks',
  'official-events-deployment-manifest-v1.json'
)
const defaultMigrationsDirectory = join(
  repositoryRoot,
  'supabase',
  'migrations'
)

function fail(message) {
  throw new Error(`Official events deployment manifest is invalid: ${message}`)
}

function assertObject(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    fail(`${name} must be an object`)
  return value
}

function assertStringArray(value, name) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some(
      (item) =>
        typeof item !== 'string' || item.length === 0 || item !== item.trim()
    )
  )
    fail(`${name} must be a non-empty array of unpadded strings`)
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function assertMigrationPath(filename, migrationsDirectory) {
  if (
    typeof filename !== 'string' ||
    basename(filename) !== filename ||
    !/^\d{14}_[a-z0-9_]+\.sql$/.test(filename)
  )
    fail('migration filename escapes or violates the migrations directory')
  const candidate = resolve(migrationsDirectory, filename)
  if (dirname(candidate) !== resolve(migrationsDirectory))
    fail('migration path is outside the migrations directory')
  return candidate
}

export function verifyOfficialEventsDeploymentManifestV1(options = {}) {
  const manifestPath = options.manifestPath ?? defaultManifestPath
  const migrationsDirectory =
    options.migrationsDirectory ?? defaultMigrationsDirectory
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch {
    fail('JSON cannot be parsed')
  }
  assertObject(manifest, 'manifest')
  if (manifest.manifestVersion !== MANIFEST_VERSION)
    fail('manifestVersion is unsupported')
  if (
    typeof manifest.preparedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
      manifest.preparedAt
    ) ||
    Number.isNaN(Date.parse(manifest.preparedAt))
  )
    fail('preparedAt must be a canonical UTC timestamp')
  if (manifest.sourceHead !== EXPECTED_SOURCE_HEAD)
    fail('sourceHead diverges from the audited series')
  if (manifest.sourceBase !== EXPECTED_SOURCE_BASE)
    fail('sourceBase diverges from the audited series')
  if (manifest.activationState !== 'disabled')
    fail('activationState must remain disabled')
  assertStringArray(manifest.preDeploymentGates, 'preDeploymentGates')
  assertStringArray(manifest.postDeploymentChecks, 'postDeploymentChecks')
  assertObject(manifest.expectedObjects, 'expectedObjects')
  if (
    !Array.isArray(manifest.migrations) ||
    manifest.migrations.length !== EXPECTED_MIGRATIONS.length
  )
    fail('migration inventory has an unexpected length')

  const verified = manifest.migrations.map((rawMigration, index) => {
    const migration = assertObject(rawMigration, `migrations[${index}]`)
    const expectedFilename = EXPECTED_MIGRATIONS[index]
    const migrationPath = assertMigrationPath(
      migration.filename,
      migrationsDirectory
    )
    if (
      migration.ordinal !== index + 1 ||
      migration.filename !== expectedFilename
    )
      fail('migration order diverges')
    let stats
    try {
      stats = statSync(migrationPath)
    } catch {
      fail(`migration is missing: ${migration.filename}`)
    }
    if (!stats.isFile()) fail(`migration is not a file: ${migration.filename}`)
    if (migration.sizeBytes !== stats.size)
      fail(`migration size diverges: ${migration.filename}`)
    const actualSha256 = sha256(migrationPath)
    if (migration.sha256 !== actualSha256)
      fail(`migration hash diverges: ${migration.filename}`)
    const creates = assertObject(
      migration.creates,
      `creates for ${migration.filename}`
    )
    for (const field of ['tables', 'functions', 'indexes']) {
      if (!Array.isArray(creates[field]))
        fail(`${field} must be an array for ${migration.filename}`)
    }
    if (!Array.isArray(migration.dependsOn))
      fail(`dependsOn must be an array for ${migration.filename}`)
    if (
      migration.dependsOn.some(
        (dependency) =>
          !EXPECTED_MIGRATIONS.slice(0, index).includes(dependency)
      )
    )
      fail(`dependency order diverges: ${migration.filename}`)
    if (!['low', 'medium', 'high'].includes(migration.riskLevel))
      fail(`riskLevel is invalid: ${migration.filename}`)
    if (
      !['reversible', 'conditionally-reversible', 'forward-fix-only'].includes(
        migration.rollbackClass
      )
    )
      fail(`rollbackClass is invalid: ${migration.filename}`)
    return {
      ordinal: migration.ordinal,
      filename: migration.filename,
      sha256: actualSha256,
      sizeBytes: stats.size,
    }
  })

  return {
    manifestVersion: manifest.manifestVersion,
    sourceHead: manifest.sourceHead,
    sourceBase: manifest.sourceBase,
    activationState: manifest.activationState,
    migrations: verified,
    fingerprint: createHash('sha256')
      .update(canonicalJson(manifest))
      .digest('hex'),
  }
}

const invokedPath = process.argv[1]
if (
  invokedPath &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  try {
    const result = verifyOfficialEventsDeploymentManifestV1()
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : 'Manifest verification failed'
    )
    process.exitCode = 1
  }
}
