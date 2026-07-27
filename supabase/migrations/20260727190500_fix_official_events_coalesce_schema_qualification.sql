-- Post-deployment smoke tests against the real official-events schema found
-- that `pg_catalog.coalesce(...)` is invalid: COALESCE is a reserved SQL
-- construct, not a regular catalog function, and cannot be schema-qualified.
-- `CREATE FUNCTION` accepted the invalid reference at creation time, but
-- every call that reaches the affected expression fails at runtime with
-- `42883: function pg_catalog.coalesce(jsonb, jsonb) does not exist`.
--
-- This migration is a forward fix. It does not edit an applied migration; it
-- replaces the four affected function bodies with `create or replace
-- function`, changing only the invalid `pg_catalog.coalesce` references to
-- plain `coalesce`. Signatures, language, volatility, security mode and
-- search_path are unchanged, so existing grants are preserved.

create or replace function public.upsert_official_asset_events_v1(input_batch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  batch_count integer;
  expected_index integer := 0;
  input_index integer;
  item_keys integer;
  record_keys integer;
  item_json jsonb;
  incoming_record jsonb;
  normalized_record jsonb;
  stored_record jsonb;
  collision_record jsonb;
  write_record jsonb;
  result_item jsonb;
  result_items jsonb := '[]'::jsonb;
  working_records jsonb := '{}'::jsonb;
  working_deduplication jsonb := '{}'::jsonb;
  write_records jsonb := '{}'::jsonb;
  event_id text;
  deduplication_key text;
  deduplication_event_id text;
  disposition text;
  conflict_reason text;
  previous_updated_at text;
  stored_updated_at text;
  stored_second timestamp without time zone;
  incoming_second timestamp without time zone;
  stored_fraction integer;
  incoming_fraction integer;
  stored_ingested_second timestamp without time zone;
  incoming_ingested_second timestamp without time zone;
  stored_ingested_fraction integer;
  incoming_ingested_fraction integer;
  has_immutable_change boolean;
  inserted_count integer := 0;
  updated_count integer := 0;
  unchanged_count integer := 0;
  stale_ignored_count integer := 0;
  conflict_count integer := 0;
begin
  if input_batch is null
    or pg_catalog.jsonb_typeof(input_batch) <> 'array'
  then
    raise exception using
      errcode = '22023',
      message = 'official asset events batch must be an array';
  end if;

  batch_count := pg_catalog.jsonb_array_length(input_batch);
  if batch_count > 500 then
    raise exception using
      errcode = '22023',
      message = 'official asset events batch exceeds 500 records';
  end if;

  for item_json in
    select value
    from pg_catalog.jsonb_array_elements(input_batch)
  loop
    if pg_catalog.jsonb_typeof(item_json) <> 'object' then
      raise exception using
        errcode = '22023',
        message = 'official asset events batch item must be an object';
    end if;

    select pg_catalog.count(*)
    into item_keys
    from pg_catalog.jsonb_object_keys(item_json);

    if item_keys <> 2
      or not (item_json ? 'inputIndex')
      or not (item_json ? 'record')
    then
      raise exception using
        errcode = '22023',
        message = 'official asset events batch item has invalid fields';
    end if;

    if pg_catalog.jsonb_typeof(item_json -> 'inputIndex') <> 'number'
      or (item_json ->> 'inputIndex') !~ '^(0|[1-9][0-9]*)$'
    then
      raise exception using
        errcode = '22023',
        message = 'official asset events inputIndex must be a non-negative integer';
    end if;

    input_index := (item_json ->> 'inputIndex')::integer;
    if input_index <> expected_index then
      raise exception using
        errcode = '22023',
        message = 'official asset events inputIndex sequence is invalid';
    end if;

    incoming_record := item_json -> 'record';
    if pg_catalog.jsonb_typeof(incoming_record) <> 'object' then
      raise exception using
        errcode = '22023',
        message = 'official asset events record must be an object';
    end if;

    select pg_catalog.count(*)
    into record_keys
    from pg_catalog.jsonb_object_keys(incoming_record);

    normalized_record := pg_catalog.to_jsonb(
      pg_catalog.jsonb_populate_record(
        null::public.official_asset_events,
        incoming_record
      )
    );
    if record_keys <> 58 or normalized_record <> incoming_record then
      raise exception using
        errcode = '22023',
        message = 'official asset events record shape is invalid';
    end if;

    expected_index := expected_index + 1;
  end loop;

  if batch_count = 0 then
    return pg_catalog.jsonb_build_object(
      'attempted', 0,
      'inserted', 0,
      'updated', 0,
      'unchanged', 0,
      'staleIgnored', 0,
      'conflicts', 0,
      'items', '[]'::jsonb
    );
  end if;

  -- Stable contract-specific key: official_asset_events.upsert.v1.
  perform pg_catalog.pg_advisory_xact_lock(7043501046513418791);

  for item_json in
    select value
    from pg_catalog.jsonb_array_elements(input_batch)
  loop
    input_index := (item_json ->> 'inputIndex')::integer;
    incoming_record := item_json -> 'record';
    event_id := incoming_record ->> 'event_id';
    deduplication_key := incoming_record ->> 'deduplication_key';
    disposition := null;
    conflict_reason := null;
    previous_updated_at := null;
    stored_updated_at := null;
    stored_record := null;
    collision_record := null;
    deduplication_event_id := null;

    if working_records ? event_id then
      stored_record := working_records -> event_id;
    else
      select pg_catalog.to_jsonb(stored)
      into stored_record
      from public.official_asset_events as stored
      where stored.event_id = event_id;
    end if;

    if working_deduplication ? deduplication_key then
      deduplication_event_id := working_deduplication ->> deduplication_key;
    else
      select stored.event_id
      into deduplication_event_id
      from public.official_asset_events as stored
      where stored.deduplication_key = deduplication_key;
    end if;

    if stored_record is not null
      and stored_record ->> 'deduplication_key' <> deduplication_key
    then
      disposition := 'conflict';
      conflict_reason := 'event-id-collision';
      previous_updated_at := stored_record ->> 'updated_at';
      stored_updated_at := previous_updated_at;
    elsif deduplication_event_id is not null
      and deduplication_event_id <> event_id
    then
      if working_records ? deduplication_event_id then
        collision_record := working_records -> deduplication_event_id;
      else
        select pg_catalog.to_jsonb(stored)
        into collision_record
        from public.official_asset_events as stored
        where stored.event_id = deduplication_event_id;
      end if;
      disposition := 'conflict';
      conflict_reason := 'deduplication-key-collision';
      previous_updated_at := collision_record ->> 'updated_at';
      stored_updated_at := previous_updated_at;
    elsif stored_record is null then
      disposition := 'inserted';
      stored_updated_at := incoming_record ->> 'updated_at';
      working_records := pg_catalog.jsonb_set(
        working_records,
        array[event_id],
        incoming_record,
        true
      );
      working_deduplication := pg_catalog.jsonb_set(
        working_deduplication,
        array[deduplication_key],
        pg_catalog.to_jsonb(event_id),
        true
      );
      write_records := pg_catalog.jsonb_set(
        write_records,
        array[input_index::text],
        incoming_record,
        true
      );
    else
      select pg_catalog.bool_or(
        (stored_record -> immutable_field)
          is distinct from (incoming_record -> immutable_field)
      )
      into has_immutable_change
      from pg_catalog.unnest(array[
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
        'supersedes_event_id'
      ]) as immutable_field;

      previous_updated_at := stored_record ->> 'updated_at';
      stored_updated_at := previous_updated_at;

      if has_immutable_change then
        disposition := 'conflict';
        conflict_reason := 'immutable-identity-change';
      else
        stored_second := pg_catalog.substring(
          stored_record ->> 'updated_at',
          1,
          19
        )::timestamp;
        incoming_second := pg_catalog.substring(
          incoming_record ->> 'updated_at',
          1,
          19
        )::timestamp;
        stored_fraction := coalesce(
          pg_catalog.rpad(
            pg_catalog.substring(
              stored_record ->> 'updated_at',
              '\.([0-9]{1,9})Z$'
            ),
            9,
            '0'
          ),
          '000000000'
        )::integer;
        incoming_fraction := coalesce(
          pg_catalog.rpad(
            pg_catalog.substring(
              incoming_record ->> 'updated_at',
              '\.([0-9]{1,9})Z$'
            ),
            9,
            '0'
          ),
          '000000000'
        )::integer;

        if (incoming_second, incoming_fraction) < (stored_second, stored_fraction) then
          disposition := 'stale-ignored';
        elsif (incoming_second, incoming_fraction) = (stored_second, stored_fraction) then
          if stored_record = incoming_record then
            disposition := 'unchanged';
          else
            disposition := 'conflict';
            conflict_reason := 'same-version-payload-divergence';
          end if;
        elsif (stored_record - 'ingested_at' - 'updated_at')
          = (incoming_record - 'ingested_at' - 'updated_at')
        then
          disposition := 'unchanged';
        else
          disposition := 'updated';
          stored_ingested_second := pg_catalog.substring(
            stored_record ->> 'ingested_at',
            1,
            19
          )::timestamp;
          incoming_ingested_second := pg_catalog.substring(
            incoming_record ->> 'ingested_at',
            1,
            19
          )::timestamp;
          stored_ingested_fraction := coalesce(
            pg_catalog.rpad(
              pg_catalog.substring(
                stored_record ->> 'ingested_at',
                '\.([0-9]{1,9})Z$'
              ),
              9,
              '0'
            ),
            '000000000'
          )::integer;
          incoming_ingested_fraction := coalesce(
            pg_catalog.rpad(
              pg_catalog.substring(
                incoming_record ->> 'ingested_at',
                '\.([0-9]{1,9})Z$'
              ),
              9,
              '0'
            ),
            '000000000'
          )::integer;
          write_record := incoming_record;
          if (stored_ingested_second, stored_ingested_fraction)
            < (incoming_ingested_second, incoming_ingested_fraction)
          then
            write_record := pg_catalog.jsonb_set(
              write_record,
              array['ingested_at'],
              stored_record -> 'ingested_at',
              false
            );
          end if;
          stored_updated_at := write_record ->> 'updated_at';
          working_records := pg_catalog.jsonb_set(
            working_records,
            array[event_id],
            write_record,
            true
          );
          working_deduplication := pg_catalog.jsonb_set(
            working_deduplication,
            array[deduplication_key],
            pg_catalog.to_jsonb(event_id),
            true
          );
          write_records := pg_catalog.jsonb_set(
            write_records,
            array[input_index::text],
            write_record,
            true
          );
        end if;
      end if;
    end if;

    if disposition = 'inserted' then
      inserted_count := inserted_count + 1;
    elsif disposition = 'updated' then
      updated_count := updated_count + 1;
    elsif disposition = 'unchanged' then
      unchanged_count := unchanged_count + 1;
    elsif disposition = 'stale-ignored' then
      stale_ignored_count := stale_ignored_count + 1;
    else
      conflict_count := conflict_count + 1;
    end if;

    result_items := result_items || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'inputIndex', input_index,
        'eventId', event_id,
        'deduplicationKey', deduplication_key,
        'disposition', disposition,
        'previousUpdatedAt', previous_updated_at,
        'storedUpdatedAt', stored_updated_at,
        'conflictReason', conflict_reason,
        'duplicateOfInputIndex', null
      )
    );
  end loop;

  if conflict_count = 0 then
    for result_item in
      select value
      from pg_catalog.jsonb_array_elements(result_items)
    loop
      if result_item ->> 'disposition' in ('inserted', 'updated') then
        write_record := write_records -> (result_item ->> 'inputIndex');
        if result_item ->> 'disposition' = 'inserted' then
          insert into public.official_asset_events
          select populated.*
          from pg_catalog.jsonb_populate_record(
            null::public.official_asset_events,
            write_record
          ) as populated;
        else
          update public.official_asset_events as stored
          set
            event_type = incoming.event_type,
            classification_justification = incoming.classification_justification,
            source_document_id = incoming.source_document_id,
            regulatory_document_id = incoming.regulatory_document_id,
            accession_number = incoming.accession_number,
            protocol_number = incoming.protocol_number,
            canonical_url = incoming.canonical_url,
            fingerprint = incoming.fingerprint,
            original_url = incoming.original_url,
            occurred_at_precision = incoming.occurred_at_precision,
            occurred_at_date = incoming.occurred_at_date,
            occurred_at_instant_utc = incoming.occurred_at_instant_utc,
            occurred_at_raw = incoming.occurred_at_raw,
            occurred_at_source_offset = incoming.occurred_at_source_offset,
            published_at_precision = incoming.published_at_precision,
            published_at_date = incoming.published_at_date,
            published_at_instant_utc = incoming.published_at_instant_utc,
            published_at_raw = incoming.published_at_raw,
            published_at_source_offset = incoming.published_at_source_offset,
            title = incoming.title,
            summary = incoming.summary,
            association_evidence = incoming.association_evidence,
            related_documents = incoming.related_documents,
            provenance_raw_fields = incoming.provenance_raw_fields,
            provenance_source_system = incoming.provenance_source_system,
            provenance_source_type = incoming.provenance_source_type,
            raw_document_type = incoming.raw_document_type,
            raw_document_category = incoming.raw_document_category,
            parser_version = incoming.parser_version,
            mapping_version = incoming.mapping_version,
            terms_audited_at = incoming.terms_audited_at,
            attribution = incoming.attribution,
            source_payload_hash = incoming.source_payload_hash,
            ingested_at = incoming.ingested_at,
            updated_at = incoming.updated_at
          from pg_catalog.jsonb_populate_record(
            null::public.official_asset_events,
            write_record
          ) as incoming
          where stored.event_id = incoming.event_id;
        end if;
      end if;
    end loop;
  end if;

  return pg_catalog.jsonb_build_object(
    'attempted', batch_count,
    'inserted', inserted_count,
    'updated', updated_count,
    'unchanged', unchanged_count,
    'staleIgnored', stale_ignored_count,
    'conflicts', conflict_count,
    'items', result_items
  );
end;
$$;

create or replace function public.get_official_event_backfill_snapshot_v1(
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
    'jobs', coalesce((
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

create or replace function public.release_official_event_backfill_jobs_v1(
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
    select coalesce(
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

create or replace function public.list_official_asset_events_v1(input_query jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public
as $$
declare
  query_key_count integer;
  filter_name text;
  filter_limit integer;
  input_limit integer;
  input_cursor jsonb;
  cursor_key_count integer;
  cursor_calendar_date date;
  cursor_precision_rank integer;
  cursor_instant_sort_key text;
  cursor_event_id text;
  published_from_date date;
  published_to_date date;
begin
  if input_query is null
    or pg_catalog.jsonb_typeof(input_query) <> 'object'
  then
    raise exception using
      errcode = '22023',
      message = 'official asset event read query must be an object';
  end if;

  select pg_catalog.count(*)::integer
  into query_key_count
  from pg_catalog.jsonb_object_keys(input_query);

  if query_key_count <> 9
    or not input_query ? 'asset_regulatory_identity_keys'
    or not input_query ? 'tickers'
    or not input_query ? 'sources'
    or not input_query ? 'event_types'
    or not input_query ? 'statuses'
    or not input_query ? 'published_from'
    or not input_query ? 'published_to'
    or not input_query ? 'limit'
    or not input_query ? 'cursor'
  then
    raise exception using
      errcode = '22023',
      message = 'official asset event read query shape is invalid';
  end if;

  foreach filter_name in array array[
    'asset_regulatory_identity_keys',
    'tickers',
    'sources',
    'event_types',
    'statuses'
  ]
  loop
    if pg_catalog.jsonb_typeof(input_query -> filter_name) <> 'null' then
      if pg_catalog.jsonb_typeof(input_query -> filter_name) <> 'array' then
        raise exception using errcode = '22023', message = 'official asset event read filter must be an array or null';
      end if;
      filter_limit := case filter_name
        when 'asset_regulatory_identity_keys' then 12
        when 'tickers' then 12
        when 'sources' then 3
        when 'event_types' then 15
        when 'statuses' then 5
      end;
      if pg_catalog.jsonb_array_length(input_query -> filter_name) not between 1 and filter_limit
        or exists (
          select 1
          from pg_catalog.jsonb_array_elements(input_query -> filter_name) as item(value)
          where pg_catalog.jsonb_typeof(item.value) <> 'string'
            or item.value #>> '{}' = ''
            or item.value #>> '{}' <> pg_catalog.btrim(item.value #>> '{}')
        )
        or (
          select pg_catalog.count(*)
          from pg_catalog.jsonb_array_elements_text(input_query -> filter_name)
        ) <> (
          select pg_catalog.count(distinct value)
          from pg_catalog.jsonb_array_elements_text(input_query -> filter_name) as item(value)
        )
      then
        raise exception using errcode = '22023', message = 'official asset event read filter is invalid';
      end if;
    end if;
  end loop;

  if pg_catalog.jsonb_typeof(input_query -> 'tickers') <> 'null'
    and exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(input_query -> 'tickers') as item(value)
      where item.value not in (
        'BBAS3', 'ITSA4', 'TAEE11', 'WEGE3', 'PSSA3', 'KNRI11',
        'VISC11', 'XPLG11', 'HGRU11', 'VOO', 'VNQ', 'VEA'
      )
    )
  then
    raise exception using errcode = '22023', message = 'official asset event ticker filter is invalid';
  end if;

  if pg_catalog.jsonb_typeof(input_query -> 'sources') <> 'null'
    and exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(input_query -> 'sources') as item(value)
      where item.value not in ('cvm-ipe', 'cvm-fund-delivery', 'sec-edgar')
    )
  then
    raise exception using errcode = '22023', message = 'official asset event source filter is invalid';
  end if;

  if pg_catalog.jsonb_typeof(input_query -> 'event_types') <> 'null'
    and exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(input_query -> 'event_types') as item(value)
      where item.value not in (
        'regulatory-filing', 'earnings-release', 'periodic-report',
        'material-fact', 'market-communication', 'dividend-or-distribution',
        'capital-structure-change', 'offering-or-issuance',
        'shareholder-meeting', 'management-change',
        'merger-acquisition-or-reorganization', 'legal-or-regulatory-action',
        'fund-policy-change', 'fund-manager-or-administrator-change',
        'other-official-event'
      )
    )
  then
    raise exception using errcode = '22023', message = 'official asset event type filter is invalid';
  end if;

  if pg_catalog.jsonb_typeof(input_query -> 'statuses') <> 'null'
    and exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(input_query -> 'statuses') as item(value)
      where item.value not in (
        'original', 'amendment', 'correction', 'replacement', 'cancellation'
      )
    )
  then
    raise exception using errcode = '22023', message = 'official asset event status filter is invalid';
  end if;

  if pg_catalog.jsonb_typeof(input_query -> 'limit') <> 'number'
    or input_query ->> 'limit' !~ '^(?:[1-9]|[1-9][0-9]|100)$'
  then
    raise exception using errcode = '22023', message = 'official asset event read limit is invalid';
  end if;
  input_limit := (input_query ->> 'limit')::integer;

  if pg_catalog.jsonb_typeof(input_query -> 'published_from') <> 'null' then
    if pg_catalog.jsonb_typeof(input_query -> 'published_from') <> 'string'
      or input_query ->> 'published_from' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    then
      raise exception using errcode = '22023', message = 'published_from is invalid';
    end if;
    published_from_date := (input_query ->> 'published_from')::date;
  end if;
  if pg_catalog.jsonb_typeof(input_query -> 'published_to') <> 'null' then
    if pg_catalog.jsonb_typeof(input_query -> 'published_to') <> 'string'
      or input_query ->> 'published_to' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    then
      raise exception using errcode = '22023', message = 'published_to is invalid';
    end if;
    published_to_date := (input_query ->> 'published_to')::date;
  end if;
  if published_from_date is not null
    and published_to_date is not null
    and published_from_date > published_to_date
  then
    raise exception using errcode = '22023', message = 'published date range is inverted';
  end if;

  input_cursor := input_query -> 'cursor';
  if pg_catalog.jsonb_typeof(input_cursor) <> 'null' then
    if pg_catalog.jsonb_typeof(input_cursor) <> 'object' then
      raise exception using errcode = '22023', message = 'official asset event cursor must be an object or null';
    end if;
    select pg_catalog.count(*)::integer
    into cursor_key_count
    from pg_catalog.jsonb_object_keys(input_cursor);
    if cursor_key_count <> 4
      or not input_cursor ? 'published_calendar_date'
      or not input_cursor ? 'published_precision_rank'
      or not input_cursor ? 'published_instant_sort_key'
      or not input_cursor ? 'event_id'
      or pg_catalog.jsonb_typeof(input_cursor -> 'published_calendar_date') <> 'string'
      or pg_catalog.jsonb_typeof(input_cursor -> 'published_precision_rank') <> 'number'
      or pg_catalog.jsonb_typeof(input_cursor -> 'published_instant_sort_key') <> 'string'
      or pg_catalog.jsonb_typeof(input_cursor -> 'event_id') <> 'string'
      or input_cursor ->> 'published_calendar_date' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      or input_cursor ->> 'published_precision_rank' !~ '^[0-2]$'
      or input_cursor ->> 'event_id' = ''
      or input_cursor ->> 'event_id' <> pg_catalog.btrim(input_cursor ->> 'event_id')
      or input_cursor ->> 'event_id' ~ '[[:cntrl:]]'
    then
      raise exception using errcode = '22023', message = 'official asset event cursor shape is invalid';
    end if;
    cursor_calendar_date := (input_cursor ->> 'published_calendar_date')::date;
    cursor_precision_rank := (input_cursor ->> 'published_precision_rank')::integer;
    cursor_instant_sort_key := input_cursor ->> 'published_instant_sort_key';
    cursor_event_id := input_cursor ->> 'event_id';
    if (cursor_precision_rank = 0 and cursor_instant_sort_key <> '')
      or (
        cursor_precision_rank > 0
        and cursor_instant_sort_key !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\.[0-9]{3}Z$'
      )
      or (
        cursor_precision_rank > 0
        and pg_catalog.substr(cursor_instant_sort_key, 1, 10)
          <> (input_cursor ->> 'published_calendar_date')
      )
    then
      raise exception using errcode = '22023', message = 'official asset event cursor values are invalid';
    end if;
  end if;

  return (
    with normalized as (
      select
        event_row.*,
        case
          when event_row.published_at_precision = 'date'
            then event_row.published_at_date
          else pg_catalog.make_date(
            pg_catalog.substr(event_row.published_at_instant_utc, 1, 4)::integer,
            pg_catalog.substr(event_row.published_at_instant_utc, 6, 2)::integer,
            pg_catalog.substr(event_row.published_at_instant_utc, 9, 2)::integer
          )
        end as published_calendar_date,
        case event_row.published_at_precision
          when 'second' then 2
          when 'minute' then 1
          else 0
        end as published_precision_rank,
        case
          when event_row.published_at_precision = 'date' then ''
          else event_row.published_at_instant_utc
        end as published_instant_sort_key
      from public.official_asset_events as event_row
    ),
    filtered as (
      select normalized.*
      from normalized
      where (
          pg_catalog.jsonb_typeof(input_query -> 'asset_regulatory_identity_keys') = 'null'
          or normalized.asset_regulatory_identity_key in (
            select value
            from pg_catalog.jsonb_array_elements_text(
              input_query -> 'asset_regulatory_identity_keys'
            ) as item(value)
          )
        )
        and (
          pg_catalog.jsonb_typeof(input_query -> 'tickers') = 'null'
          or normalized.asset_ticker in (
            select value
            from pg_catalog.jsonb_array_elements_text(input_query -> 'tickers') as item(value)
          )
        )
        and (
          pg_catalog.jsonb_typeof(input_query -> 'sources') = 'null'
          or normalized.source in (
            select value
            from pg_catalog.jsonb_array_elements_text(input_query -> 'sources') as item(value)
          )
        )
        and (
          pg_catalog.jsonb_typeof(input_query -> 'event_types') = 'null'
          or normalized.event_type in (
            select value
            from pg_catalog.jsonb_array_elements_text(input_query -> 'event_types') as item(value)
          )
        )
        and (
          pg_catalog.jsonb_typeof(input_query -> 'statuses') = 'null'
          or normalized.status in (
            select value
            from pg_catalog.jsonb_array_elements_text(input_query -> 'statuses') as item(value)
          )
        )
        and (published_from_date is null or normalized.published_calendar_date >= published_from_date)
        and (published_to_date is null or normalized.published_calendar_date <= published_to_date)
        and (
          pg_catalog.jsonb_typeof(input_cursor) = 'null'
          or (
            normalized.published_calendar_date,
            normalized.published_precision_rank,
            normalized.published_instant_sort_key,
            normalized.event_id
          ) < (
            cursor_calendar_date,
            cursor_precision_rank,
            cursor_instant_sort_key,
            cursor_event_id
          )
        )
    ),
    paged as (
      select filtered.*
      from filtered
      order by
        filtered.published_calendar_date desc,
        filtered.published_precision_rank desc,
        filtered.published_instant_sort_key desc,
        filtered.event_id desc
      limit input_limit + 1
    ),
    returned as (
      select paged.*
      from paged
      order by
        paged.published_calendar_date desc,
        paged.published_precision_rank desc,
        paged.published_instant_sort_key desc,
        paged.event_id desc
      limit input_limit
    )
    select pg_catalog.jsonb_build_object(
      'items', coalesce((
        select pg_catalog.jsonb_agg(
          pg_catalog.to_jsonb(returned_row)
            - 'published_calendar_date'
            - 'published_precision_rank'
            - 'published_instant_sort_key'
          order by
            returned_row.published_calendar_date desc,
            returned_row.published_precision_rank desc,
            returned_row.published_instant_sort_key desc,
            returned_row.event_id desc
        )
        from returned as returned_row
      ), '[]'::jsonb),
      'returned', (select pg_catalog.count(*) from returned),
      'limit', input_limit,
      'has_more', exists (
        select 1
        from paged
        offset input_limit
      ),
      'last_item_cursor', case
        when exists (select 1 from paged offset input_limit) then (
          select pg_catalog.jsonb_build_object(
            'published_calendar_date', pg_catalog.to_char(
              returned_row.published_calendar_date,
              'YYYY-MM-DD'
            ),
            'published_precision_rank', returned_row.published_precision_rank,
            'published_instant_sort_key', returned_row.published_instant_sort_key,
            'event_id', returned_row.event_id
          )
          from returned as returned_row
          order by
            returned_row.published_calendar_date asc,
            returned_row.published_precision_rank asc,
            returned_row.published_instant_sort_key asc,
            returned_row.event_id asc
          limit 1
        )
        else null
      end
    )
  );
end;
$$;
