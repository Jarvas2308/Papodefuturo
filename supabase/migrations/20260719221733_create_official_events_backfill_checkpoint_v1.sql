create table public.official_event_backfill_runs (
  backfill_version text not null,
  plan_id text primary key,
  plan_hash text not null unique,
  plan_payload jsonb not null,
  failure_mode text not null,
  retry_failed boolean not null,
  max_attempts_per_job integer not null,
  status text not null,
  total_jobs integer not null,
  pending_jobs integer not null,
  running_jobs integer not null,
  succeeded_jobs integer not null,
  failed_jobs integer not null,
  conflict_jobs integer not null,
  created_at text not null,
  updated_at text not null,
  completed_at text,

  constraint official_event_backfill_runs_version_check check (
    backfill_version = 'official-events-backfill-plan.v1'
  ),
  constraint official_event_backfill_runs_plan_id_check check (
    plan_id = btrim(plan_id)
    and plan_id ~ '^official-events-backfill:v1:[0-9a-f]{16}$'
  ),
  constraint official_event_backfill_runs_plan_hash_check check (
    plan_hash = btrim(plan_hash)
    and plan_hash ~ '^fnv1a64:[0-9a-f]{16}$'
  ),
  constraint official_event_backfill_runs_payload_check check (
    jsonb_typeof(plan_payload) = 'object'
    and plan_payload ->> 'backfillVersion' = backfill_version
    and plan_payload ->> 'planId' = plan_id
    and plan_payload ->> 'planHash' = plan_hash
    and jsonb_typeof(plan_payload -> 'sources') = 'array'
    and jsonb_array_length(plan_payload -> 'sources') > 0
    and jsonb_typeof(plan_payload -> 'jobs') = 'array'
    and jsonb_array_length(plan_payload -> 'jobs') = total_jobs
  ),
  constraint official_event_backfill_runs_failure_mode_check check (
    failure_mode in ('continue', 'stop')
  ),
  constraint official_event_backfill_runs_attempts_check check (
    max_attempts_per_job between 1 and 10
  ),
  constraint official_event_backfill_runs_status_check check (
    status in (
      'pending',
      'running',
      'completed',
      'completed-with-failures',
      'paused'
    )
  ),
  constraint official_event_backfill_runs_counters_check check (
    total_jobs between 1 and 1000
    and pending_jobs >= 0
    and running_jobs >= 0
    and succeeded_jobs >= 0
    and failed_jobs >= 0
    and conflict_jobs >= 0
    and pending_jobs + running_jobs + succeeded_jobs + failed_jobs
      + conflict_jobs = total_jobs
  ),
  constraint official_event_backfill_runs_timestamps_check check (
    created_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
    and updated_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
    and updated_at::timestamptz >= created_at::timestamptz
    and (
      (
        status in ('completed', 'completed-with-failures')
        and completed_at is not null
        and completed_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
        and completed_at::timestamptz >= created_at::timestamptz
      )
      or (
        status not in ('completed', 'completed-with-failures')
        and completed_at is null
      )
    )
  )
);

create table public.official_event_backfill_jobs (
  plan_id text not null,
  job_id text not null,
  ordinal integer not null,
  provider text not null,
  job_payload jsonb not null,
  status text not null,
  attempt_count integer not null,
  lease_owner text,
  lease_acquired_at text,
  lease_expires_at text,
  started_at text,
  completed_at text,
  fetched_event_count integer not null,
  persisted_attempt_count integer not null,
  rejected_item_count integer not null,
  result_summary jsonb,
  error_summary jsonb,
  updated_at text not null,

  constraint official_event_backfill_jobs_pkey primary key (plan_id, job_id),
  constraint official_event_backfill_jobs_plan_ordinal_key unique (
    plan_id,
    ordinal
  ),
  constraint official_event_backfill_jobs_plan_fkey foreign key (plan_id)
    references public.official_event_backfill_runs(plan_id)
    on delete restrict,
  constraint official_event_backfill_jobs_id_check check (
    job_id = btrim(job_id)
    and job_id ~ '^official-events-backfill:v1:'
  ),
  constraint official_event_backfill_jobs_ordinal_check check (
    ordinal between 0 and 999
  ),
  constraint official_event_backfill_jobs_provider_check check (
    provider in ('cvm-ipe', 'cvm-fund-delivery', 'sec-edgar')
  ),
  constraint official_event_backfill_jobs_payload_check check (
    jsonb_typeof(job_payload) = 'object'
    and job_payload ->> 'jobId' = job_id
    and job_payload ->> 'provider' = provider
    and (
      (
        provider = 'cvm-ipe'
        and jsonb_typeof(job_payload -> 'year') = 'number'
      )
      or (
        provider = 'cvm-fund-delivery'
        and jsonb_typeof(job_payload -> 'year') = 'number'
        and jsonb_typeof(job_payload -> 'month') = 'number'
      )
      or (
        provider = 'sec-edgar'
        and jsonb_typeof(job_payload -> 'fromDate') = 'string'
        and jsonb_typeof(job_payload -> 'toDate') = 'string'
      )
    )
  ),
  constraint official_event_backfill_jobs_status_check check (
    status in ('pending', 'running', 'succeeded', 'failed', 'conflict')
  ),
  constraint official_event_backfill_jobs_counters_check check (
    attempt_count between 0 and 10
    and fetched_event_count >= 0
    and persisted_attempt_count >= 0
    and rejected_item_count >= 0
  ),
  constraint official_event_backfill_jobs_lease_check check (
    (
      status = 'running'
      and lease_owner is not null
      and lease_owner = btrim(lease_owner)
      and lease_owner <> ''
      and lease_acquired_at is not null
      and lease_expires_at is not null
      and started_at is not null
      and completed_at is null
      and lease_acquired_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
      and lease_expires_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
      and lease_expires_at::timestamptz > lease_acquired_at::timestamptz
    )
    or (
      status <> 'running'
      and lease_owner is null
      and lease_acquired_at is null
      and lease_expires_at is null
    )
  ),
  constraint official_event_backfill_jobs_completion_check check (
    (
      status in ('succeeded', 'failed', 'conflict')
      and started_at is not null
      and completed_at is not null
      and result_summary is not null
    )
    or (
      status in ('pending', 'running')
      and completed_at is null
      and result_summary is null
      and error_summary is null
    )
  ),
  constraint official_event_backfill_jobs_summary_check check (
    (result_summary is null or jsonb_typeof(result_summary) = 'object')
    and (error_summary is null or jsonb_typeof(error_summary) = 'object')
    and (status <> 'succeeded' or error_summary is null)
  ),
  constraint official_event_backfill_jobs_timestamps_check check (
    updated_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
    and (
      started_at is null
      or started_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
    )
    and (
      completed_at is null
      or (
        completed_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
        and started_at is not null
        and completed_at::timestamptz >= started_at::timestamptz
      )
    )
  )
);

create index official_event_backfill_runs_status_idx
on public.official_event_backfill_runs (status);

create index official_event_backfill_runs_updated_at_idx
on public.official_event_backfill_runs (updated_at);

create index official_event_backfill_jobs_status_idx
on public.official_event_backfill_jobs (status);

create index official_event_backfill_jobs_provider_idx
on public.official_event_backfill_jobs (provider);

create index official_event_backfill_jobs_lease_expires_at_idx
on public.official_event_backfill_jobs (lease_expires_at)
where status = 'running';

create index official_event_backfill_jobs_updated_at_idx
on public.official_event_backfill_jobs (updated_at);

alter table public.official_event_backfill_runs enable row level security;
alter table public.official_event_backfill_jobs enable row level security;

revoke all on table public.official_event_backfill_runs
from public, anon, authenticated, service_role;
revoke all on table public.official_event_backfill_jobs
from public, anon, authenticated, service_role;

create function public.get_official_event_backfill_snapshot_v1(
  input_plan_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  snapshot jsonb;
begin
  select pg_catalog.jsonb_build_object(
    'backfillVersion', run.backfill_version,
    'planId', run.plan_id,
    'planHash', run.plan_hash,
    'failureMode', run.failure_mode,
    'retryFailed', run.retry_failed,
    'maxAttemptsPerJob', run.max_attempts_per_job,
    'status', run.status,
    'totalJobs', run.total_jobs,
    'pendingJobs', run.pending_jobs,
    'runningJobs', run.running_jobs,
    'succeededJobs', run.succeeded_jobs,
    'failedJobs', run.failed_jobs,
    'conflictJobs', run.conflict_jobs,
    'createdAt', run.created_at,
    'updatedAt', run.updated_at,
    'completedAt', run.completed_at,
    'jobs', pg_catalog.coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'jobId', job.job_id,
          'ordinal', job.ordinal,
          'provider', job.provider,
          'job', job.job_payload,
          'status', job.status,
          'attemptCount', job.attempt_count,
          'leaseOwner', job.lease_owner,
          'leaseAcquiredAt', job.lease_acquired_at,
          'leaseExpiresAt', job.lease_expires_at,
          'startedAt', job.started_at,
          'completedAt', job.completed_at,
          'fetchedEventCount', job.fetched_event_count,
          'persistedAttemptCount', job.persisted_attempt_count,
          'rejectedItemCount', job.rejected_item_count,
          'resultSummary', job.result_summary,
          'errorSummary', job.error_summary,
          'updatedAt', job.updated_at
        ) order by job.ordinal
      )
      from public.official_event_backfill_jobs as job
      where job.plan_id = run.plan_id
    ), '[]'::jsonb)
  )
  into snapshot
  from public.official_event_backfill_runs as run
  where run.plan_id = input_plan_id;

  if snapshot is null then
    raise exception using
      errcode = 'P0002',
      message = 'official event backfill plan was not found';
  end if;
  return snapshot;
end;
$$;

create function public.refresh_official_event_backfill_run_v1(
  input_plan_id text,
  input_now text
)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  update public.official_event_backfill_runs as run
  set
    pending_jobs = counts.pending_jobs,
    running_jobs = counts.running_jobs,
    succeeded_jobs = counts.succeeded_jobs,
    failed_jobs = counts.failed_jobs,
    conflict_jobs = counts.conflict_jobs,
    updated_at = input_now
  from (
    select
      pg_catalog.count(*) filter (where job.status = 'pending')::integer
        as pending_jobs,
      pg_catalog.count(*) filter (where job.status = 'running')::integer
        as running_jobs,
      pg_catalog.count(*) filter (where job.status = 'succeeded')::integer
        as succeeded_jobs,
      pg_catalog.count(*) filter (where job.status = 'failed')::integer
        as failed_jobs,
      pg_catalog.count(*) filter (where job.status = 'conflict')::integer
        as conflict_jobs
    from public.official_event_backfill_jobs as job
    where job.plan_id = input_plan_id
  ) as counts
  where run.plan_id = input_plan_id;
$$;

create function public.create_or_resume_official_event_backfill_v1(
  input_plan jsonb,
  input_now text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  existing public.official_event_backfill_runs%rowtype;
  item jsonb;
  source_item jsonb;
  expected_ordinal integer := 0;
  key_count integer;
begin
  if input_now !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$' then
    raise exception using errcode = '22023', message = 'invalid checkpoint timestamp';
  end if;
  perform input_now::timestamptz;
  if input_plan is null or pg_catalog.jsonb_typeof(input_plan) <> 'object' then
    raise exception using errcode = '22023', message = 'backfill plan must be an object';
  end if;
  select pg_catalog.count(*) into key_count
  from pg_catalog.jsonb_object_keys(input_plan);
  if key_count <> 9
    or input_plan ->> 'backfillVersion' <> 'official-events-backfill-plan.v1'
    or pg_catalog.jsonb_typeof(input_plan -> 'jobs') <> 'array'
    or pg_catalog.jsonb_typeof(input_plan -> 'sources') <> 'array'
    or pg_catalog.jsonb_array_length(input_plan -> 'sources') = 0
    or pg_catalog.jsonb_array_length(input_plan -> 'jobs') = 0
    or pg_catalog.jsonb_array_length(input_plan -> 'jobs') > 1000
    or (input_plan ->> 'totalJobs')::integer
      <> pg_catalog.jsonb_array_length(input_plan -> 'jobs')
  then
    raise exception using errcode = '22023', message = 'backfill plan shape is invalid';
  end if;
  if (
    select pg_catalog.count(distinct value ->> 'provider')
    from pg_catalog.jsonb_array_elements(input_plan -> 'sources')
  ) <> pg_catalog.jsonb_array_length(input_plan -> 'sources') then
    raise exception using errcode = '22023', message = 'backfill providers must be unique';
  end if;
  for source_item in
    select value from pg_catalog.jsonb_array_elements(input_plan -> 'sources')
  loop
    select pg_catalog.count(*) into key_count
    from pg_catalog.jsonb_object_keys(source_item);
    if pg_catalog.jsonb_typeof(source_item) <> 'object'
      or not (
        (
          source_item ->> 'provider' = 'cvm-ipe'
          and key_count = 3
          and pg_catalog.jsonb_typeof(source_item -> 'fromYear') = 'number'
          and pg_catalog.jsonb_typeof(source_item -> 'toYear') = 'number'
        )
        or (
          source_item ->> 'provider' = 'cvm-fund-delivery'
          and key_count = 3
          and (source_item ->> 'fromMonth') ~ '^[0-9]{4}-[0-9]{2}$'
          and (source_item ->> 'toMonth') ~ '^[0-9]{4}-[0-9]{2}$'
        )
        or (
          source_item ->> 'provider' = 'sec-edgar'
          and key_count = 4
          and (source_item ->> 'fromDate') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
          and (source_item ->> 'toDate') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
          and pg_catalog.jsonb_typeof(source_item -> 'windowDays') = 'number'
        )
      )
    then
      raise exception using errcode = '22023', message = 'backfill source shape is invalid';
    end if;
  end loop;

  perform pg_catalog.pg_advisory_xact_lock(6248546366347822271);
  select * into existing
  from public.official_event_backfill_runs
  where plan_id = input_plan ->> 'planId'
  for update;

  if found then
    if existing.plan_hash <> input_plan ->> 'planHash'
      or existing.plan_payload <> input_plan
    then
      raise exception using errcode = '23505', message = 'backfill plan identity conflict';
    end if;
    if input_now::timestamptz < existing.updated_at::timestamptz then
      raise exception using errcode = '22023', message = 'checkpoint clock moved backwards';
    end if;
    if existing.status = 'paused' then
      update public.official_event_backfill_runs
      set status = 'running', updated_at = input_now
      where plan_id = existing.plan_id;
    end if;
    return public.get_official_event_backfill_snapshot_v1(existing.plan_id);
  end if;

  insert into public.official_event_backfill_runs (
    backfill_version, plan_id, plan_hash, plan_payload, failure_mode,
    retry_failed, max_attempts_per_job, status, total_jobs, pending_jobs,
    running_jobs, succeeded_jobs, failed_jobs, conflict_jobs, created_at,
    updated_at, completed_at
  ) values (
    input_plan ->> 'backfillVersion', input_plan ->> 'planId',
    input_plan ->> 'planHash', input_plan, input_plan ->> 'failureMode',
    (input_plan ->> 'retryFailed')::boolean,
    (input_plan ->> 'maxAttemptsPerJob')::integer, 'pending',
    pg_catalog.jsonb_array_length(input_plan -> 'jobs'),
    pg_catalog.jsonb_array_length(input_plan -> 'jobs'), 0, 0, 0, 0,
    input_now, input_now, null
  );

  for item in select value from pg_catalog.jsonb_array_elements(input_plan -> 'jobs')
  loop
    if pg_catalog.jsonb_typeof(item) <> 'object'
      or (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(item)) <> 2
      or (item ->> 'ordinal')::integer <> expected_ordinal
      or pg_catalog.jsonb_typeof(item -> 'job') <> 'object'
    then
      raise exception using errcode = '22023', message = 'backfill job plan is invalid';
    end if;
    select pg_catalog.count(*) into key_count
    from pg_catalog.jsonb_object_keys(item -> 'job');
    if not (
      (
        item -> 'job' ->> 'provider' = 'cvm-ipe'
        and key_count = 3
      )
      or (
        item -> 'job' ->> 'provider' = 'cvm-fund-delivery'
        and key_count = 4
      )
      or (
        item -> 'job' ->> 'provider' = 'sec-edgar'
        and key_count = 4
      )
    ) then
      raise exception using errcode = '22023', message = 'backfill executor job shape is invalid';
    end if;
    insert into public.official_event_backfill_jobs (
      plan_id, job_id, ordinal, provider, job_payload, status, attempt_count,
      lease_owner, lease_acquired_at, lease_expires_at, started_at, completed_at,
      fetched_event_count, persisted_attempt_count, rejected_item_count,
      result_summary, error_summary, updated_at
    ) values (
      input_plan ->> 'planId', item -> 'job' ->> 'jobId', expected_ordinal,
      item -> 'job' ->> 'provider', item -> 'job', 'pending', 0,
      null, null, null, null, null, 0, 0, 0, null, null, input_now
    );
    expected_ordinal := expected_ordinal + 1;
  end loop;
  return public.get_official_event_backfill_snapshot_v1(input_plan ->> 'planId');
end;
$$;

create function public.claim_official_event_backfill_jobs_v1(
  input_plan_id text,
  input_worker_id text,
  input_limit integer,
  input_lease_duration_seconds integer,
  input_now text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  run public.official_event_backfill_runs%rowtype;
  claimed_ids text[];
  snapshot jsonb;
begin
  if input_worker_id is null or input_worker_id = '' or input_worker_id <> btrim(input_worker_id)
    or input_worker_id !~ '^[A-Za-z0-9._:-]+$' or length(input_worker_id) > 128
    or input_limit not between 1 and 100
    or input_lease_duration_seconds not between 30 and 3600
    or input_now !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
  then
    raise exception using errcode = '22023', message = 'backfill claim input is invalid';
  end if;
  select * into strict run
  from public.official_event_backfill_runs
  where plan_id = input_plan_id
  for update;
  if input_now::timestamptz < run.updated_at::timestamptz then
    raise exception using errcode = '22023', message = 'checkpoint clock moved backwards';
  end if;
  if run.status in ('completed', 'completed-with-failures', 'paused') then
    return '[]'::jsonb;
  end if;

  with candidates as (
    select job.plan_id, job.job_id
    from public.official_event_backfill_jobs as job
    where job.plan_id = input_plan_id
      and job.attempt_count < run.max_attempts_per_job
      and (
        job.status = 'pending'
        or (job.status = 'running' and job.lease_expires_at::timestamptz <= input_now::timestamptz)
        or (job.status = 'failed' and run.retry_failed)
      )
    order by job.ordinal
    for update skip locked
    limit input_limit
  ), claimed as (
    update public.official_event_backfill_jobs as job
    set
      status = 'running',
      attempt_count = job.attempt_count + 1,
      lease_owner = input_worker_id,
      lease_acquired_at = input_now,
      lease_expires_at = pg_catalog.to_char(
        (
          input_now::timestamptz
          + pg_catalog.make_interval(secs => input_lease_duration_seconds)
        ) at time zone 'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
      ),
      started_at = input_now,
      completed_at = null,
      result_summary = null,
      error_summary = null,
      updated_at = input_now
    from candidates
    where job.plan_id = candidates.plan_id and job.job_id = candidates.job_id
    returning job.job_id, job.ordinal
  )
  select pg_catalog.array_agg(claimed.job_id order by claimed.ordinal)
  into claimed_ids
  from claimed;

  if claimed_ids is null then return '[]'::jsonb; end if;
  update public.official_event_backfill_runs
  set status = 'running', completed_at = null
  where plan_id = input_plan_id;
  perform public.refresh_official_event_backfill_run_v1(input_plan_id, input_now);
  snapshot := public.get_official_event_backfill_snapshot_v1(input_plan_id);
  return (
    select pg_catalog.jsonb_agg(value order by (value ->> 'ordinal')::integer)
    from pg_catalog.jsonb_array_elements(snapshot -> 'jobs')
    where value ->> 'jobId' = any(claimed_ids)
  );
end;
$$;

create function public.complete_official_event_backfill_job_v1(
  input_plan_id text,
  input_job_id text,
  input_worker_id text,
  input_now text,
  input_summary jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  run public.official_event_backfill_runs%rowtype;
  job public.official_event_backfill_jobs%rowtype;
  snapshot jsonb;
  summary_key_count integer;
begin
  select * into strict run from public.official_event_backfill_runs
  where plan_id = input_plan_id for update;
  if input_now !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
    or input_now::timestamptz < run.updated_at::timestamptz
  then
    raise exception using errcode = '22023', message = 'invalid checkpoint timestamp';
  end if;
  select * into strict job from public.official_event_backfill_jobs
  where plan_id = input_plan_id and job_id = input_job_id for update;
  select pg_catalog.count(*) into summary_key_count
  from pg_catalog.jsonb_object_keys(input_summary);
  if job.status <> 'running' or job.lease_owner <> input_worker_id
    or job.lease_expires_at::timestamptz <= input_now::timestamptz
    or pg_catalog.jsonb_typeof(input_summary) <> 'object'
    or summary_key_count <> 3
    or (input_summary ->> 'fetchedEventCount') !~ '^(0|[1-9][0-9]*)$'
    or (input_summary ->> 'persistedAttemptCount') !~ '^(0|[1-9][0-9]*)$'
    or (input_summary ->> 'rejectedItemCount') !~ '^(0|[1-9][0-9]*)$'
    or (input_summary ->> 'fetchedEventCount')::numeric > 2147483647
    or (input_summary ->> 'persistedAttemptCount')::numeric > 2147483647
    or (input_summary ->> 'rejectedItemCount')::numeric > 2147483647
  then
    raise exception using errcode = '55000', message = 'backfill job lease or summary is invalid';
  end if;
  update public.official_event_backfill_jobs set
    status = 'succeeded', lease_owner = null, lease_acquired_at = null,
    lease_expires_at = null, completed_at = input_now,
    fetched_event_count = (input_summary ->> 'fetchedEventCount')::integer,
    persisted_attempt_count = (input_summary ->> 'persistedAttemptCount')::integer,
    rejected_item_count = (input_summary ->> 'rejectedItemCount')::integer,
    result_summary = input_summary, error_summary = null, updated_at = input_now
  where plan_id = input_plan_id and job_id = input_job_id;
  perform public.refresh_official_event_backfill_run_v1(input_plan_id, input_now);
  snapshot := public.get_official_event_backfill_snapshot_v1(input_plan_id);
  return (select value from pg_catalog.jsonb_array_elements(snapshot -> 'jobs')
    where value ->> 'jobId' = input_job_id);
end;
$$;

create function public.fail_official_event_backfill_job_v1(
  input_plan_id text,
  input_job_id text,
  input_worker_id text,
  input_now text,
  input_disposition text,
  input_summary jsonb,
  input_error jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  run public.official_event_backfill_runs%rowtype;
  job public.official_event_backfill_jobs%rowtype;
  snapshot jsonb;
  summary_key_count integer;
  error_key_count integer;
begin
  select * into strict run from public.official_event_backfill_runs
  where plan_id = input_plan_id for update;
  if input_now !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
    or input_now::timestamptz < run.updated_at::timestamptz
  then
    raise exception using errcode = '22023', message = 'invalid checkpoint timestamp';
  end if;
  select * into strict job from public.official_event_backfill_jobs
  where plan_id = input_plan_id and job_id = input_job_id for update;
  select pg_catalog.count(*) into summary_key_count
  from pg_catalog.jsonb_object_keys(input_summary);
  if input_error is not null then
    select pg_catalog.count(*) into error_key_count
    from pg_catalog.jsonb_object_keys(input_error);
  end if;
  if job.status <> 'running' or job.lease_owner <> input_worker_id
    or job.lease_expires_at::timestamptz <= input_now::timestamptz
    or input_disposition not in ('failed', 'conflict')
    or pg_catalog.jsonb_typeof(input_summary) <> 'object'
    or summary_key_count <> 3
    or (input_summary ->> 'fetchedEventCount') !~ '^(0|[1-9][0-9]*)$'
    or (input_summary ->> 'persistedAttemptCount') !~ '^(0|[1-9][0-9]*)$'
    or (input_summary ->> 'rejectedItemCount') !~ '^(0|[1-9][0-9]*)$'
    or (input_summary ->> 'fetchedEventCount')::numeric > 2147483647
    or (input_summary ->> 'persistedAttemptCount')::numeric > 2147483647
    or (input_summary ->> 'rejectedItemCount')::numeric > 2147483647
    or (input_error is not null and pg_catalog.jsonb_typeof(input_error) <> 'object')
    or (input_error is not null and error_key_count <> 3)
    or (input_error is not null and (
      input_error ->> 'category' is null
      or input_error ->> 'category' = ''
      or input_error ->> 'category' <> btrim(input_error ->> 'category')
      or input_error ->> 'code' is null
      or input_error ->> 'code' = ''
      or input_error ->> 'code' <> btrim(input_error ->> 'code')
      or input_error ->> 'message' is null
      or input_error ->> 'message' = ''
      or input_error ->> 'message' <> btrim(input_error ->> 'message')
    ))
  then
    raise exception using errcode = '55000', message = 'backfill failure input is invalid';
  end if;
  update public.official_event_backfill_jobs set
    status = input_disposition, lease_owner = null, lease_acquired_at = null,
    lease_expires_at = null, completed_at = input_now,
    fetched_event_count = (input_summary ->> 'fetchedEventCount')::integer,
    persisted_attempt_count = (input_summary ->> 'persistedAttemptCount')::integer,
    rejected_item_count = (input_summary ->> 'rejectedItemCount')::integer,
    result_summary = input_summary, error_summary = input_error, updated_at = input_now
  where plan_id = input_plan_id and job_id = input_job_id;
  perform public.refresh_official_event_backfill_run_v1(input_plan_id, input_now);
  snapshot := public.get_official_event_backfill_snapshot_v1(input_plan_id);
  return (select value from pg_catalog.jsonb_array_elements(snapshot -> 'jobs')
    where value ->> 'jobId' = input_job_id);
end;
$$;

create function public.release_official_event_backfill_jobs_v1(
  input_plan_id text,
  input_job_ids jsonb,
  input_worker_id text,
  input_now text,
  input_pause_plan boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  run public.official_event_backfill_runs%rowtype;
  requested_count integer;
  owned_count integer;
  snapshot jsonb;
begin
  select * into strict run from public.official_event_backfill_runs
  where plan_id = input_plan_id for update;
  if input_job_ids is null
    or pg_catalog.jsonb_typeof(input_job_ids) <> 'array'
    or input_pause_plan is null
    or input_worker_id is null
    or input_worker_id = ''
    or input_worker_id <> btrim(input_worker_id)
    or input_worker_id !~ '^[A-Za-z0-9._:-]+$'
    or length(input_worker_id) > 128
    or input_now !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
    or input_now::timestamptz < run.updated_at::timestamptz
  then
    raise exception using errcode = '22023', message = 'backfill release input is invalid';
  end if;
  requested_count := pg_catalog.jsonb_array_length(input_job_ids);
  if requested_count = 0 then
    raise exception using errcode = '22023', message = 'released job IDs cannot be empty';
  end if;
  with owned_jobs as (
    select job.job_id
    from public.official_event_backfill_jobs as job
    where job.plan_id = input_plan_id
      and job.job_id in (
        select pg_catalog.jsonb_array_elements_text(input_job_ids)
      )
      and job.status = 'running'
      and job.lease_owner = input_worker_id
      and job.lease_expires_at::timestamptz > input_now::timestamptz
    for update
  )
  select pg_catalog.count(*) into owned_count from owned_jobs;
  if owned_count <> requested_count
    or requested_count <> (
      select pg_catalog.count(distinct value)
      from pg_catalog.jsonb_array_elements_text(input_job_ids)
    )
  then
    raise exception using errcode = '55000', message = 'released jobs are not fully owned';
  end if;
  update public.official_event_backfill_jobs set
    status = 'pending', attempt_count = attempt_count - 1,
    lease_owner = null, lease_acquired_at = null, lease_expires_at = null,
    started_at = null, updated_at = input_now
  where plan_id = input_plan_id
    and job_id in (select pg_catalog.jsonb_array_elements_text(input_job_ids));
  perform public.refresh_official_event_backfill_run_v1(input_plan_id, input_now);
  if input_pause_plan then
    update public.official_event_backfill_runs
    set status = 'paused', updated_at = input_now
    where plan_id = input_plan_id;
  end if;
  snapshot := public.get_official_event_backfill_snapshot_v1(input_plan_id);
  return (
    select pg_catalog.coalesce(
      pg_catalog.jsonb_agg(value order by (value ->> 'ordinal')::integer),
      '[]'::jsonb
    )
    from pg_catalog.jsonb_array_elements(snapshot -> 'jobs')
    where value ->> 'jobId' in (
      select pg_catalog.jsonb_array_elements_text(input_job_ids)
    )
  );
end;
$$;

create function public.pause_official_event_backfill_v1(
  input_plan_id text,
  input_now text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  run public.official_event_backfill_runs%rowtype;
begin
  select * into strict run from public.official_event_backfill_runs
  where plan_id = input_plan_id for update;
  if input_now !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
    or input_now::timestamptz < run.updated_at::timestamptz
  then
    raise exception using errcode = '22023', message = 'invalid checkpoint timestamp';
  end if;
  if exists (
    select 1 from public.official_event_backfill_jobs
    where plan_id = input_plan_id and status = 'running'
  ) then
    raise exception using errcode = '55000', message = 'running jobs prevent pause';
  end if;
  update public.official_event_backfill_runs
  set status = 'paused', updated_at = input_now
  where plan_id = input_plan_id and status in ('pending', 'running');
  return public.get_official_event_backfill_snapshot_v1(input_plan_id);
end;
$$;

create function public.finalize_official_event_backfill_v1(
  input_plan_id text,
  input_now text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  run public.official_event_backfill_runs%rowtype;
begin
  select * into strict run from public.official_event_backfill_runs
  where plan_id = input_plan_id for update;
  if input_now !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$'
    or input_now::timestamptz < run.updated_at::timestamptz
  then
    raise exception using errcode = '22023', message = 'invalid checkpoint timestamp';
  end if;
  if run.status in ('completed', 'completed-with-failures') then
    return public.get_official_event_backfill_snapshot_v1(input_plan_id);
  end if;
  if not exists (
    select 1 from public.official_event_backfill_jobs as job
    where job.plan_id = input_plan_id
      and (
        job.status in ('pending', 'running')
        or (
          job.status = 'failed'
          and run.retry_failed
          and job.attempt_count < run.max_attempts_per_job
        )
      )
  ) then
    update public.official_event_backfill_runs
    set
      status = case
        when failed_jobs > 0 or conflict_jobs > 0
          then 'completed-with-failures'
        else 'completed'
      end,
      completed_at = input_now,
      updated_at = input_now
    where plan_id = input_plan_id;
  end if;
  return public.get_official_event_backfill_snapshot_v1(input_plan_id);
end;
$$;

comment on table public.official_event_backfill_runs is
'Global deterministic official-event backfill plans and aggregate checkpoints.';
comment on table public.official_event_backfill_jobs is
'Bounded official-event backfill jobs with resumable leases and safe summaries.';

revoke all on function public.refresh_official_event_backfill_run_v1(text, text)
from public, anon, authenticated, service_role;

revoke all on function public.get_official_event_backfill_snapshot_v1(text)
from public, anon, authenticated;
grant execute on function public.get_official_event_backfill_snapshot_v1(text)
to service_role;

revoke all on function public.create_or_resume_official_event_backfill_v1(jsonb, text)
from public, anon, authenticated;
grant execute on function public.create_or_resume_official_event_backfill_v1(jsonb, text)
to service_role;

revoke all on function public.claim_official_event_backfill_jobs_v1(text, text, integer, integer, text)
from public, anon, authenticated;
grant execute on function public.claim_official_event_backfill_jobs_v1(text, text, integer, integer, text)
to service_role;

revoke all on function public.complete_official_event_backfill_job_v1(text, text, text, text, jsonb)
from public, anon, authenticated;
grant execute on function public.complete_official_event_backfill_job_v1(text, text, text, text, jsonb)
to service_role;

revoke all on function public.fail_official_event_backfill_job_v1(text, text, text, text, text, jsonb, jsonb)
from public, anon, authenticated;
grant execute on function public.fail_official_event_backfill_job_v1(text, text, text, text, text, jsonb, jsonb)
to service_role;

revoke all on function public.release_official_event_backfill_jobs_v1(text, jsonb, text, text, boolean)
from public, anon, authenticated;
grant execute on function public.release_official_event_backfill_jobs_v1(text, jsonb, text, text, boolean)
to service_role;

revoke all on function public.pause_official_event_backfill_v1(text, text)
from public, anon, authenticated;
grant execute on function public.pause_official_event_backfill_v1(text, text)
to service_role;

revoke all on function public.finalize_official_event_backfill_v1(text, text)
from public, anon, authenticated;
grant execute on function public.finalize_official_event_backfill_v1(text, text)
to service_role;
