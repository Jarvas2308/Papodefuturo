-- Sprint 12 (DEC-071): npm run check:health precisa ler cron.job_run_details,
-- mas esse schema não é exposto via PostgREST (nem deveria — é infraestrutura
-- interna do pg_cron, não dado de aplicação). Mesmo padrão já usado no
-- restante do projeto para leitura controlada de schema interno: função
-- SECURITY DEFINER em `public`, granted só para `service_role`, nunca para
-- `authenticated` ou `anon`. O script chama via RPC normal, sem precisar de
-- conexão Postgres direta nem de expor `cron` na API.

create or replace function public.check_market_data_health_v1(
  input_job_name text default 'refresh-market-data-hourly',
  input_lookback_runs int default 24
)
returns jsonb
language plpgsql
security definer
set search_path = public, cron
as $$
declare
  result jsonb;
begin
  with recent_runs as (
    select jrd.status, jrd.start_time, jrd.end_time
    from cron.job_run_details jrd
    join cron.job j on j.jobid = jrd.jobid
    where j.jobname = input_job_name
    order by jrd.start_time desc
    limit input_lookback_runs
  ),
  last_run as (
    select status, start_time
    from recent_runs
    order by start_time desc
    limit 1
  )
  select jsonb_build_object(
    'job_name', input_job_name,
    'job_exists', exists(select 1 from cron.job where jobname = input_job_name),
    'job_active', (select active from cron.job where jobname = input_job_name),
    'runs_checked', (select count(*) from recent_runs),
    'succeeded_count', (select count(*) from recent_runs where status = 'succeeded'),
    'failed_count', (select count(*) from recent_runs where status != 'succeeded'),
    'last_run_status', (select status from last_run),
    'last_run_at', (select start_time from last_run),
    'minutes_since_last_run', (
      select round(extract(epoch from (now() - start_time)) / 60)
      from last_run
    )
  )
  into result;

  return result;
end;
$$;

revoke all on function public.check_market_data_health_v1(text, int) from public;
grant execute on function public.check_market_data_health_v1(text, int) to service_role;
