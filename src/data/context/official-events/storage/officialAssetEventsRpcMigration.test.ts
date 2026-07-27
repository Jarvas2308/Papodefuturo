import { describe, expect, it } from 'vitest'
import sql from '../../../../../supabase/migrations/20260719173416_create_official_asset_events_upsert_rpc_v1.sql?raw'

const normalizedSql = sql.replace(/\s+/g, ' ').trim()

describe('upsert_official_asset_events_v1 migration', () => {
  it('creates one JSONB RPC without creating another table', () => {
    expect(normalizedSql).toContain(
      'create function public.upsert_official_asset_events_v1(input_batch jsonb) returns jsonb'
    )
    expect(normalizedSql.match(/create function /g)).toHaveLength(1)
    expect(normalizedSql).not.toMatch(/create table /)
  })

  it('uses SECURITY DEFINER with a fixed trusted search_path', () => {
    expect(normalizedSql).toContain('security definer')
    expect(normalizedSql).toContain('set search_path = pg_catalog, public')
    expect(normalizedSql).not.toMatch(
      /\bexecute\s+(?:format\s*\(|['"]|[a-z_][a-z0-9_]*\s*(?:using|;))/i
    )
  })

  it('limits and validates the ordered JSONB envelope before locking', () => {
    expect(normalizedSql).toContain('if input_batch is null or')
    expect(normalizedSql).toContain("jsonb_typeof(input_batch) <> 'array'")
    expect(normalizedSql).toContain('if batch_count > 500')
    expect(normalizedSql).toContain('record_keys <> 58')
    expect(normalizedSql).toContain('input_index <> expected_index')
    expect(normalizedSql.indexOf('record_keys <> 58')).toBeLessThan(
      normalizedSql.indexOf('pg_advisory_xact_lock')
    )
  })

  it('serializes only writers with a constant transaction advisory lock', () => {
    expect(normalizedSql).toContain(
      'pg_advisory_xact_lock(7043501046513418791)'
    )
    expect(normalizedSql).not.toContain('pg_advisory_lock(')
    expect(normalizedSql.indexOf('pg_advisory_xact_lock')).toBeLessThan(
      normalizedSql.indexOf(
        'from public.official_asset_events as stored where stored.event_id'
      )
    )
  })

  it('classifies every contract disposition and conflict reason', () => {
    for (const disposition of [
      'inserted',
      'updated',
      'unchanged',
      'stale-ignored',
      'conflict',
    ]) {
      expect(normalizedSql).toContain(`'${disposition}'`)
    }
    for (const reason of [
      'event-id-collision',
      'deduplication-key-collision',
      'immutable-identity-change',
      'same-version-payload-divergence',
    ]) {
      expect(normalizedSql).toContain(`'${reason}'`)
    }
  })

  it('compares all immutable storage identity fields', () => {
    for (const field of [
      'storage_schema_version',
      'domain_schema_version',
      'event_id',
      'deduplication_key',
      'asset_category',
      'asset_market',
      'asset_ticker',
      'asset_official_name',
      'asset_regulatory_identity_key',
      'cnpj',
      'cvm_code',
      'isin',
      'registrant_cik',
      'series_id',
      'class_contract_id',
      'source',
      'source_type',
      'language',
      'jurisdiction',
      'document_identity_kind',
      'document_identity_value',
      'status',
      'supersedes_event_id',
    ]) {
      expect(normalizedSql).toContain(`'${field}'`)
    }
  })

  it('compares JSONB semantically and preserves nanosecond timestamp ordering', () => {
    expect(normalizedSql).toContain('stored_record = incoming_record')
    expect(normalizedSql).toContain(
      "stored_record - 'ingested_at' - 'updated_at'"
    )
    expect(normalizedSql).toContain('rpad( pg_catalog.substring(')
    expect(normalizedSql).not.toContain('updated_at::timestamptz')
  })

  it('preserves the earliest ingested_at and the newer updated_at', () => {
    expect(normalizedSql).toContain(
      "array['ingested_at'], stored_record -> 'ingested_at'"
    )
    expect(normalizedSql).toContain('updated_at = incoming.updated_at')
  })

  it('detects all conflicts before the first write', () => {
    const conflictGate = normalizedSql.indexOf('if conflict_count = 0 then')
    const firstInsert = normalizedSql.indexOf(
      'insert into public.official_asset_events'
    )
    const firstUpdate = normalizedSql.indexOf(
      'update public.official_asset_events as stored'
    )
    expect(conflictGate).toBeGreaterThan(0)
    expect(conflictGate).toBeLessThan(firstInsert)
    expect(conflictGate).toBeLessThan(firstUpdate)
  })

  it('never writes stale or conflicted records', () => {
    expect(normalizedSql).toContain(
      "if result_item ->> 'disposition' in ('inserted', 'updated') then"
    )
    expect(normalizedSql).toContain(
      "if (incoming_second, incoming_fraction) < (stored_second, stored_fraction) then disposition := 'stale-ignored'"
    )
    expect(normalizedSql).toContain(
      'elsif (incoming_second, incoming_fraction) = (stored_second, stored_fraction) then'
    )
    expect(normalizedSql).toContain(
      "conflict_reason := 'same-version-payload-divergence'"
    )
  })

  it('returns one ordered structured item per input', () => {
    for (const field of [
      'inputIndex',
      'eventId',
      'deduplicationKey',
      'disposition',
      'previousUpdatedAt',
      'storedUpdatedAt',
      'conflictReason',
      'duplicateOfInputIndex',
    ]) {
      expect(normalizedSql).toContain(`'${field}'`)
    }
  })

  it('allows execution only to service_role', () => {
    expect(normalizedSql).toContain(
      'revoke all on function public.upsert_official_asset_events_v1(jsonb) from public'
    )
    expect(normalizedSql).toContain(
      'revoke all on function public.upsert_official_asset_events_v1(jsonb) from anon'
    )
    expect(normalizedSql).toContain(
      'revoke all on function public.upsert_official_asset_events_v1(jsonb) from authenticated'
    )
    expect(normalizedSql).toContain(
      'grant execute on function public.upsert_official_asset_events_v1(jsonb) to service_role'
    )
  })

  it('revokes direct server-side writes while preserving the existing read policy', () => {
    expect(normalizedSql).toContain(
      'revoke insert, update, delete, truncate on table public.official_asset_events from service_role'
    )
    expect(normalizedSql).not.toMatch(
      /create policy|alter table .* row level security/
    )
  })

  it('uses only schema-qualified persistent objects', () => {
    expect(normalizedSql).not.toMatch(
      /(?:from|into|update|table) official_asset_events\b/
    )
  })

  it('does not add forbidden runtime infrastructure', () => {
    expect(normalizedSql).not.toMatch(
      /create trigger|cron|scheduler|edge function|materialized view|insert into auth\.|insert into public\.(?!official_asset_events)/i
    )
  })
})
