import { describe, expect, it } from 'vitest'
import sql from '../../../../../supabase/migrations/20260719235049_create_official_asset_events_read_rpcs_v1.sql?raw'

const normalizedSql = sql.replace(/\s+/g, ' ').trim()

describe('official_asset_events read RPC migration', () => {
  it('creates exactly the two approved functions and no persistent relation', () => {
    expect(normalizedSql).toContain(
      'create function public.get_official_asset_event_by_id_v1(input_event_id text) returns jsonb'
    )
    expect(normalizedSql).toContain(
      'create function public.list_official_asset_events_v1(input_query jsonb) returns jsonb'
    )
    expect(normalizedSql.match(/create function /g)).toHaveLength(2)
    expect(normalizedSql).not.toMatch(
      /create table|create view|create materialized view|create trigger/i
    )
  })

  it('keeps both reads stable, invoker-scoped and schema-qualified', () => {
    expect(normalizedSql.match(/stable security invoker/g)).toHaveLength(2)
    expect(
      normalizedSql.match(/set search_path = pg_catalog, public/g)
    ).toHaveLength(2)
    expect(normalizedSql).not.toContain('security definer')
    expect(normalizedSql).not.toMatch(/\bfrom official_asset_events\b/)
    expect(normalizedSql).not.toMatch(/\bexecute\s+(?:format\s*\(|['"])/i)
  })

  it('does not contain a write path or mutate existing security policy', () => {
    expect(normalizedSql).not.toMatch(
      /insert into|update public\.|delete from|truncate|create policy|drop policy|alter table/i
    )
    expect(normalizedSql).not.toMatch(/scheduler|cron|backfill|seed/i)
    expect(normalizedSql).toContain("input_event_id !~ '[[:cntrl:]]'")
    expect(normalizedSql).toContain(
      "input_cursor ->> 'event_id' ~ '[[:cntrl:]]'"
    )
  })

  it('grants execution only to authenticated and service_role', () => {
    expect(normalizedSql).toContain(
      'revoke execute on function public.get_official_asset_event_by_id_v1(text) from public, anon'
    )
    expect(normalizedSql).toContain(
      'revoke execute on function public.list_official_asset_events_v1(jsonb) from public, anon'
    )
    expect(normalizedSql).toContain(
      'grant execute on function public.get_official_asset_event_by_id_v1(text) to authenticated, service_role'
    )
    expect(normalizedSql).toContain(
      'grant execute on function public.list_official_asset_events_v1(jsonb) to authenticated, service_role'
    )
    expect(normalizedSql).not.toMatch(/grant execute .* to anon/)
  })

  it('supports only the approved structured filters and no text search', () => {
    for (const field of [
      'asset_regulatory_identity_keys',
      'tickers',
      'sources',
      'event_types',
      'statuses',
      'published_from',
      'published_to',
      'limit',
      'cursor',
    ]) {
      expect(normalizedSql).toContain(`'${field}'`)
    }
    expect(normalizedSql).not.toMatch(
      /plainto_tsquery|to_tsvector|websearch_to_tsquery|ilike|similarity/i
    )
    expect(normalizedSql).not.toMatch(
      /\buser_id\b|\basset_id\b|\bportfolio_id\b/
    )
  })

  it('uses the canonical four-part descending timeline order', () => {
    expect(normalizedSql).toContain(
      'filtered.published_calendar_date desc, filtered.published_precision_rank desc, filtered.published_instant_sort_key desc, filtered.event_id desc'
    )
    expect(normalizedSql).toContain(
      "when event_row.published_at_precision = 'date' then event_row.published_at_date"
    )
    expect(normalizedSql).toContain(
      "when 'second' then 2 when 'minute' then 1 else 0"
    )
    expect(normalizedSql).toContain(
      "when event_row.published_at_precision = 'date' then '' else event_row.published_at_instant_utc"
    )
    expect(normalizedSql).not.toMatch(/00:00:00|updated_at.*published/i)
  })

  it('applies the same lexicographic cursor tuple and limit plus one', () => {
    expect(normalizedSql).toContain(
      '( normalized.published_calendar_date, normalized.published_precision_rank, normalized.published_instant_sort_key, normalized.event_id ) < ( cursor_calendar_date, cursor_precision_rank, cursor_instant_sort_key, cursor_event_id )'
    )
    expect(normalizedSql).toContain('limit input_limit + 1')
    expect(normalizedSql).toContain('offset input_limit')
    expect(normalizedSql).toContain(
      "'returned', (select pg_catalog.count(*) from returned), 'limit', input_limit"
    )
    expect(normalizedSql).not.toMatch(
      /total_count|global_count|count\(\*\) over/i
    )
  })

  it('returns rows without leaking internal sort fields', () => {
    expect(normalizedSql).toContain("- 'published_calendar_date'")
    expect(normalizedSql).toContain("- 'published_precision_rank'")
    expect(normalizedSql).toContain("- 'published_instant_sort_key'")
    expect(normalizedSql).toContain("'last_item_cursor'")
  })

  it('adds only the matching timeline index without redundant identity indexes', () => {
    expect(normalizedSql).toContain(
      'create index official_asset_events_published_timeline_v1_idx on public.official_asset_events'
    )
    expect(normalizedSql.match(/create index /g)).toHaveLength(1)
    expect(normalizedSql).not.toContain('event_id_idx')
    expect(normalizedSql).not.toContain('deduplication_key_idx')
  })

  it('does not provide count, write, editorial or provider-specific APIs', () => {
    expect(normalizedSql).not.toMatch(
      /count_official|upsert_official|search_official|editorial|cvm_ipe|sec_edgar/i
    )
  })
})
