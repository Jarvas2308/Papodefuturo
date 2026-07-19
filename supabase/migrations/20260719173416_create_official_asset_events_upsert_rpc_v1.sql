create function public.upsert_official_asset_events_v1(input_batch jsonb)
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
        stored_fraction := pg_catalog.coalesce(
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
        incoming_fraction := pg_catalog.coalesce(
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
          stored_ingested_fraction := pg_catalog.coalesce(
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
          incoming_ingested_fraction := pg_catalog.coalesce(
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

comment on function public.upsert_official_asset_events_v1(jsonb) is
'Atomically classifies and writes canonical official asset event batches for server-side callers.';

revoke all on function public.upsert_official_asset_events_v1(jsonb) from public;
revoke all on function public.upsert_official_asset_events_v1(jsonb) from anon;
revoke all on function public.upsert_official_asset_events_v1(jsonb) from authenticated;
grant execute on function public.upsert_official_asset_events_v1(jsonb) to service_role;

revoke insert, update, delete, truncate
on table public.official_asset_events
from service_role;
