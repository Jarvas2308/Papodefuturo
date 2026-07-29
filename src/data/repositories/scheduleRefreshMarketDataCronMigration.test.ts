import { describe, expect, it } from 'vitest'
import migration from '../../../supabase/migrations/20260729120000_schedule_refresh_market_data_cron.sql?raw'

describe('schedule_refresh_market_data_cron migration', () => {
  it('enables pg_net and pg_cron', () => {
    expect(migration).toContain('create extension if not exists pg_net')
    expect(migration).toContain('create extension if not exists pg_cron')
  })

  it('schedules an hourly job matching the 60-minute freshness window', () => {
    expect(migration).toContain(
      "cron.schedule(\n  'refresh-market-data-hourly'"
    )
    expect(migration).toContain("'0 * * * *'")
  })

  it('calls the refresh-market-data function over HTTP via pg_net', () => {
    expect(migration).toContain('net.http_post(')
    expect(migration).toContain(
      "url := 'https://vxjrncwfysglinfktifz.supabase.co/functions/v1/refresh-market-data'"
    )
  })

  it('never hardcodes the service_role key, reading it from Vault by name instead', () => {
    expect(migration).not.toMatch(/service_role.{0,20}eyJ/i)
    expect(migration).toContain('vault.decrypted_secrets')
    expect(migration).toContain(
      "where name = 'refresh_market_data_service_role_key'"
    )
  })
})
