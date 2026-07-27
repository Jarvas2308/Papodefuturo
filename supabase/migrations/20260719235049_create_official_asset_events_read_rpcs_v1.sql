create function public.get_official_asset_event_by_id_v1(input_event_id text)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select pg_catalog.to_jsonb(event_row)
  from public.official_asset_events as event_row
  where event_row.event_id = input_event_id
    and input_event_id is not null
    and input_event_id <> ''
    and input_event_id = pg_catalog.btrim(input_event_id)
    and input_event_id !~ '[[:cntrl:]]'
  limit 1;
$$;

create function public.list_official_asset_events_v1(input_query jsonb)
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
      'items', pg_catalog.coalesce((
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

create index official_asset_events_published_timeline_v1_idx
on public.official_asset_events (
  (
    case
      when published_at_precision = 'date' then published_at_date
      else pg_catalog.make_date(
        pg_catalog.substr(published_at_instant_utc, 1, 4)::integer,
        pg_catalog.substr(published_at_instant_utc, 6, 2)::integer,
        pg_catalog.substr(published_at_instant_utc, 9, 2)::integer
      )
    end
  ) desc,
  (
    case published_at_precision
      when 'second' then 2
      when 'minute' then 1
      else 0
    end
  ) desc,
  (
    case
      when published_at_precision = 'date' then ''
      else published_at_instant_utc
    end
  ) desc,
  event_id desc
);

revoke execute on function public.get_official_asset_event_by_id_v1(text)
from public, anon;
revoke execute on function public.list_official_asset_events_v1(jsonb)
from public, anon;

grant execute on function public.get_official_asset_event_by_id_v1(text)
to authenticated, service_role;
grant execute on function public.list_official_asset_events_v1(jsonb)
to authenticated, service_role;
