import { describe, expect, it } from 'vitest'
import sql from '../../../../../supabase/migrations/20260719165850_create_official_asset_events.sql?raw'

const normalizedSql = sql.replace(/\s+/g, ' ').trim()

describe('official_asset_events migration', () => {
  it('creates only the global official_asset_events table with the complete record shape', () => {
    expect(normalizedSql).toContain(
      'create table public.official_asset_events ('
    )
    expect(normalizedSql.match(/create table /g)).toHaveLength(1)
    expect(normalizedSql).not.toMatch(/\buser_id\b/)
    expect(normalizedSql).not.toMatch(/\basset_id\b/)
    expect(normalizedSql).not.toContain('references public.assets')
    expect(normalizedSql).not.toContain('references auth.users')
    expect(normalizedSql).not.toContain('editorial_asset_news')
  })

  it('uses event_id as primary key and deduplication_key as the only additional uniqueness', () => {
    expect(normalizedSql).toContain('event_id text primary key')
    expect(normalizedSql).toContain(
      'constraint official_events_deduplication_key_unique unique (deduplication_key)'
    )
    expect(normalizedSql.match(/\bunique\b/g)).toHaveLength(1)
    expect(normalizedSql).not.toMatch(
      /\bserial\b|generated .* identity|gen_random_uuid/i
    )
  })

  it('keeps the document identity discriminated without requiring every identifier', () => {
    for (const kind of [
      'source-document-id',
      'regulatory-document-id',
      'accession-number',
      'protocol-number',
      'canonical-url',
      'fingerprint',
    ]) {
      expect(normalizedSql).toContain(`document_identity_kind = '${kind}'`)
    }
    expect(normalizedSql).toContain(
      'source_document_id = document_identity_value'
    )
    expect(normalizedSql).toContain('source_document_id is not null')
    expect(normalizedSql).toContain(
      'regulatory_document_id = document_identity_value'
    )
  })

  it('enforces the three discriminated regulatory identities and canonical formats', () => {
    for (const category of [
      'brazilian-stock',
      'real-estate-fund',
      'international-etf',
    ]) {
      expect(normalizedSql).toContain(`asset_category = '${category}'`)
    }
    expect(normalizedSql).toContain("cnpj ~ '^[0-9]{14}$'")
    expect(normalizedSql).toContain('cnpj is not null')
    expect(normalizedSql).toContain("cvm_code ~ '^[0-9]{6}$'")
    expect(normalizedSql).toContain('cvm_code is not null')
    expect(normalizedSql).toContain("registrant_cik ~ '^[0-9]{10}$'")
    expect(normalizedSql).toContain('registrant_cik is not null')
    expect(normalizedSql).toContain("series_id ~ '^S[0-9]{9}$'")
    expect(normalizedSql).toContain('series_id is not null')
    expect(normalizedSql).toContain("class_contract_id ~ '^C[0-9]{9}$'")
    expect(normalizedSql).toContain('class_contract_id is not null')
  })

  it('closes source, category, market and provenance coherence', () => {
    expect(normalizedSql).toContain("source = 'cvm-ipe'")
    expect(normalizedSql).toContain("source = 'cvm-fund-delivery'")
    expect(normalizedSql).toContain("source = 'sec-edgar'")
    expect(normalizedSql).toContain("source_type = 'regulator'")
    expect(normalizedSql).toContain("provenance_source_type = 'regulator'")
    expect(normalizedSql).toContain('provenance_source_system = source')
  })

  it('preserves civil dates separately from lossless temporal strings', () => {
    expect(normalizedSql).toContain('occurred_at_date date')
    expect(normalizedSql).toContain('occurred_at_instant_utc text')
    expect(normalizedSql).toContain('published_at_date date')
    expect(normalizedSql).toContain('published_at_instant_utc text')
    expect(normalizedSql).toContain('ingested_at text not null')
    expect(normalizedSql).toContain('updated_at text not null')
    expect(normalizedSql).toContain(
      'substring(occurred_at_instant_utc from 1 for 19)::timestamp'
    )
    expect(normalizedSql).toContain(
      'substring(published_at_instant_utc from 1 for 19)::timestamp'
    )
    expect(normalizedSql).not.toMatch(/occurred_at[^,]*timestamptz/)
    expect(normalizedSql).not.toMatch(/published_at[^,]*timestamptz/)
  })

  it('supports absent, date, minute, second and unknown occurrence precision', () => {
    for (const precision of ['date', 'minute', 'second', 'unknown']) {
      expect(normalizedSql).toContain(`occurred_at_precision = '${precision}'`)
    }
    expect(normalizedSql).toContain('occurred_at_precision is null')
    expect(normalizedSql).not.toContain("published_at_precision = 'unknown'")
  })

  it('rejects an internal updated_at earlier than ingested_at without text ordering', () => {
    expect(normalizedSql).toContain(
      'constraint official_events_internal_timestamps_check'
    )
    expect(normalizedSql).toContain(
      'substring(updated_at from 1 for 19)::timestamp'
    )
    expect(normalizedSql).toContain(
      'substring(ingested_at from 1 for 19)::timestamp'
    )
    expect(normalizedSql).not.toContain('updated_at >= ingested_at')
  })

  it('preserves revisions without cascading or requiring an existing parent', () => {
    for (const status of [
      'original',
      'amendment',
      'correction',
      'replacement',
      'cancellation',
    ]) {
      expect(normalizedSql).toContain(`'${status}'`)
    }
    expect(normalizedSql).toContain('supersedes_event_id <> event_id')
    expect(normalizedSql).not.toContain('foreign key (supersedes_event_id)')
    expect(normalizedSql).not.toContain('on delete cascade')
  })

  it('checks the three JSONB structures at their safe SQL boundary', () => {
    expect(normalizedSql).toContain('association_evidence jsonb not null')
    expect(normalizedSql).toContain('related_documents jsonb not null')
    expect(normalizedSql).toContain('provenance_raw_fields jsonb not null')
    expect(normalizedSql).toContain(
      "jsonb_typeof(association_evidence) = 'array'"
    )
    expect(normalizedSql).toContain(
      'jsonb_array_length(association_evidence) > 0'
    )
    expect(normalizedSql).toContain(
      "jsonb_typeof(provenance_raw_fields) = 'object'"
    )
  })

  it('uses only audited HTTPS document hosts for each current provider', () => {
    expect(normalizedSql).toContain('www\\.rad\\.cvm\\.gov\\.br')
    expect(normalizedSql).toContain('www\\.sec\\.gov')
    expect(normalizedSql).toContain(
      "source = 'cvm-fund-delivery' and canonical_url is null and original_url is null"
    )
    expect(normalizedSql).not.toMatch(/javascript:|data:|file:|localhost/)
  })

  it('creates the query indexes without duplicating primary or unique indexes', () => {
    for (const index of [
      'official_asset_events_asset_identity_idx',
      'official_asset_events_asset_category_idx',
      'official_asset_events_asset_market_idx',
      'official_asset_events_asset_ticker_idx',
      'official_asset_events_source_idx',
      'official_asset_events_event_type_idx',
      'official_asset_events_status_idx',
      'official_asset_events_supersedes_idx',
      'official_asset_events_document_identity_idx',
      'official_asset_events_published_date_idx',
      'official_asset_events_published_instant_idx',
      'official_asset_events_occurred_date_idx',
      'official_asset_events_occurred_instant_idx',
    ]) {
      expect(normalizedSql).toContain(`create index ${index}`)
    }
    expect(normalizedSql).not.toContain(
      'create index official_asset_events_event_id_idx'
    )
    expect(normalizedSql).not.toContain(
      'create index official_asset_events_deduplication_key_idx'
    )
  })

  it('enables RLS and exposes only SELECT to authenticated clients', () => {
    expect(normalizedSql).toContain(
      'alter table public.official_asset_events enable row level security'
    )
    expect(normalizedSql).toContain('for select to authenticated using (true)')
    expect(normalizedSql).toContain(
      'revoke all on table public.official_asset_events from anon'
    )
    expect(normalizedSql).toContain(
      'revoke all on table public.official_asset_events from authenticated'
    )
    expect(normalizedSql).toContain(
      'grant select on table public.official_asset_events to authenticated'
    )
    expect(normalizedSql).not.toMatch(
      /grant (insert|update|delete|truncate).* to authenticated/
    )
    expect(normalizedSql).not.toMatch(/to anon using|to anon with check/)
  })

  it('grants the server-side service role the operations needed by the future adapter', () => {
    expect(normalizedSql).toContain(
      'grant select, insert, update, delete on table public.official_asset_events to service_role'
    )
  })

  it('does not add runtime ingestion mechanisms or mutate existing schema objects', () => {
    expect(normalizedSql).not.toMatch(
      /create (or replace )?function|create trigger|create (materialized )?view|cron|scheduler|rpc/i
    )
    expect(normalizedSql).not.toMatch(/insert into|seed/i)
    expect(normalizedSql).not.toMatch(
      /alter table public\.(?!official_asset_events)/
    )
  })
})
