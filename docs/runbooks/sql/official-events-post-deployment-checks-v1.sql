-- Read-only checks for the controlled official-events deployment.
-- Run only after authorization and store the complete output as evidence.

-- 1. The four versions must be registered in this order.
select version
from supabase_migrations.schema_migrations
where version in (
  '20260719165850',
  '20260719173416',
  '20260719221733',
  '20260719235049'
)
order by version;

-- 2. Expected relations and column counts.
with expected(table_name, expected_columns) as (
  values
    ('official_asset_events', 58),
    ('official_event_backfill_runs', 17),
    ('official_event_backfill_jobs', 18)
), actual as (
  select columns.table_name, count(*)::integer as actual_columns
  from information_schema.columns as columns
  where columns.table_schema = 'public'
    and columns.table_name in (select expected.table_name from expected)
  group by columns.table_name
)
select
  expected.table_name,
  expected.expected_columns,
  actual.actual_columns,
  actual.actual_columns = expected.expected_columns as passed
from expected
left join actual using (table_name)
order by expected.table_name;

-- 3. Forbidden ownership columns must be absent.
select
  count(*) = 0 as passed,
  array_agg(columns.table_name || '.' || columns.column_name order by columns.table_name)
    filter (where columns.column_name is not null) as unexpected_columns
from information_schema.columns as columns
where columns.table_schema = 'public'
  and columns.table_name in (
    'official_asset_events',
    'official_event_backfill_runs',
    'official_event_backfill_jobs'
  )
  and columns.column_name in ('user_id', 'asset_id');

-- 4. Primary, unique, foreign-key, and check constraints.
select
  constraints.table_name,
  constraints.constraint_name,
  constraints.constraint_type
from information_schema.table_constraints as constraints
where constraints.table_schema = 'public'
  and constraints.table_name in (
    'official_asset_events',
    'official_event_backfill_runs',
    'official_event_backfill_jobs'
  )
order by constraints.table_name, constraints.constraint_type, constraints.constraint_name;

-- 5. No foreign key may target auth.users.
select
  count(*) = 0 as passed,
  array_agg(constraint_row.conname order by constraint_row.conname)
    filter (where constraint_row.conname is not null) as unexpected_constraints
from pg_constraint as constraint_row
join pg_class as relation on relation.oid = constraint_row.conrelid
join pg_namespace as namespace on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname in (
    'official_asset_events',
    'official_event_backfill_runs',
    'official_event_backfill_jobs'
  )
  and constraint_row.contype = 'f'
  and pg_get_constraintdef(constraint_row.oid) like '%auth.users%';

-- 6. Index inventory, including the timeline index.
select indexes.tablename, indexes.indexname, indexes.indexdef
from pg_indexes as indexes
where indexes.schemaname = 'public'
  and indexes.tablename in (
    'official_asset_events',
    'official_event_backfill_runs',
    'official_event_backfill_jobs'
  )
order by indexes.tablename, indexes.indexname;

-- 7. RLS must be enabled on all three relations.
select
  relation.relname as table_name,
  relation.relrowsecurity as rls_enabled,
  relation.relforcerowsecurity as rls_forced
from pg_class as relation
join pg_namespace as namespace on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname in (
    'official_asset_events',
    'official_event_backfill_runs',
    'official_event_backfill_jobs'
  )
order by relation.relname;

-- 8. Exactly one authenticated read policy is expected on event facts.
select
  policies.tablename,
  policies.policyname,
  policies.cmd,
  policies.roles,
  policies.qual,
  policies.with_check
from pg_policies as policies
where policies.schemaname = 'public'
  and policies.tablename in (
    'official_asset_events',
    'official_event_backfill_runs',
    'official_event_backfill_jobs'
  )
order by policies.tablename, policies.policyname;

-- 9. Direct table privileges: authenticated reads events only; checkpoint is closed.
select
  grants.table_name,
  grants.grantee,
  array_agg(grants.privilege_type order by grants.privilege_type) as privileges
from information_schema.role_table_grants as grants
where grants.table_schema = 'public'
  and grants.table_name in (
    'official_asset_events',
    'official_event_backfill_runs',
    'official_event_backfill_jobs'
  )
  and grants.grantee in ('anon', 'authenticated', 'service_role')
group by grants.table_name, grants.grantee
order by grants.table_name, grants.grantee;

-- 10. Function signatures, security mode, volatility, and fixed search path.
select
  procedures.proname,
  pg_catalog.oidvectortypes(procedures.proargtypes) as argument_types,
  case when procedures.prosecdef then 'definer' else 'invoker' end as security_mode,
  case procedures.provolatile
    when 'i' then 'immutable'
    when 's' then 'stable'
    else 'volatile'
  end as volatility,
  procedures.proconfig
from pg_proc as procedures
join pg_namespace as namespace on namespace.oid = procedures.pronamespace
where namespace.nspname = 'public'
  and procedures.proname in (
    'upsert_official_asset_events_v1',
    'get_official_event_backfill_snapshot_v1',
    'refresh_official_event_backfill_run_v1',
    'create_or_resume_official_event_backfill_v1',
    'claim_official_event_backfill_jobs_v1',
    'complete_official_event_backfill_job_v1',
    'fail_official_event_backfill_job_v1',
    'release_official_event_backfill_jobs_v1',
    'pause_official_event_backfill_v1',
    'finalize_official_event_backfill_v1',
    'get_official_asset_event_by_id_v1',
    'list_official_asset_events_v1'
  )
order by procedures.proname, argument_types;

-- 11. Effective function access by application roles.
select
  procedures.proname,
  pg_catalog.oidvectortypes(procedures.proargtypes) as argument_types,
  has_function_privilege('anon', procedures.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', procedures.oid, 'EXECUTE')
    as authenticated_can_execute,
  has_function_privilege('service_role', procedures.oid, 'EXECUTE')
    as service_role_can_execute
from pg_proc as procedures
join pg_namespace as namespace on namespace.oid = procedures.pronamespace
where namespace.nspname = 'public'
  and procedures.proname in (
    'upsert_official_asset_events_v1',
    'get_official_event_backfill_snapshot_v1',
    'refresh_official_event_backfill_run_v1',
    'create_or_resume_official_event_backfill_v1',
    'claim_official_event_backfill_jobs_v1',
    'complete_official_event_backfill_job_v1',
    'fail_official_event_backfill_job_v1',
    'release_official_event_backfill_jobs_v1',
    'pause_official_event_backfill_v1',
    'finalize_official_event_backfill_v1',
    'get_official_asset_event_by_id_v1',
    'list_official_asset_events_v1'
  )
order by procedures.proname, argument_types;

-- 12. Routine privilege rows retained as deployment evidence.
select
  privileges.routine_name,
  privileges.grantee,
  privileges.privilege_type
from information_schema.routine_privileges as privileges
where privileges.specific_schema = 'public'
  and privileges.routine_name in (
    'upsert_official_asset_events_v1',
    'get_official_event_backfill_snapshot_v1',
    'refresh_official_event_backfill_run_v1',
    'create_or_resume_official_event_backfill_v1',
    'claim_official_event_backfill_jobs_v1',
    'complete_official_event_backfill_job_v1',
    'fail_official_event_backfill_job_v1',
    'release_official_event_backfill_jobs_v1',
    'pause_official_event_backfill_v1',
    'finalize_official_event_backfill_v1',
    'get_official_asset_event_by_id_v1',
    'list_official_asset_events_v1'
  )
  and privileges.grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
order by privileges.routine_name, privileges.grantee;

-- 13. Initial deployment must leave every relation empty.
select 'official_asset_events' as table_name, count(*) as row_count
from public.official_asset_events
union all
select 'official_event_backfill_runs', count(*)
from public.official_event_backfill_runs
union all
select 'official_event_backfill_jobs', count(*)
from public.official_event_backfill_jobs
order by table_name;
