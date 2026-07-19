create table public.official_asset_events (
  storage_schema_version text not null,
  domain_schema_version text not null,
  event_id text primary key,
  deduplication_key text not null,
  asset_category text not null,
  asset_market text not null,
  asset_ticker text not null,
  asset_official_name text not null,
  asset_regulatory_identity_key text not null,
  cnpj text,
  cvm_code text,
  isin text,
  registrant_cik text,
  series_id text,
  class_contract_id text,
  event_type text not null,
  classification_justification text,
  source text not null,
  source_type text not null,
  language text not null,
  jurisdiction text not null,
  status text not null,
  supersedes_event_id text,
  document_identity_kind text not null,
  document_identity_value text not null,
  source_document_id text,
  regulatory_document_id text,
  accession_number text,
  protocol_number text,
  canonical_url text,
  fingerprint text,
  original_url text,
  occurred_at_precision text,
  occurred_at_date date,
  occurred_at_instant_utc text,
  occurred_at_raw text,
  occurred_at_source_offset text,
  published_at_precision text not null,
  published_at_date date,
  published_at_instant_utc text,
  published_at_raw text not null,
  published_at_source_offset text,
  title text not null,
  summary text,
  association_evidence jsonb not null,
  related_documents jsonb not null,
  provenance_raw_fields jsonb not null,
  provenance_source_system text not null,
  provenance_source_type text not null,
  raw_document_type text not null,
  raw_document_category text,
  parser_version text not null,
  mapping_version text not null,
  terms_audited_at date not null,
  attribution text,
  source_payload_hash text not null,
  ingested_at text not null,
  updated_at text not null,

  constraint official_events_deduplication_key_unique
    unique (deduplication_key),
  constraint official_events_schema_versions_check check (
    storage_schema_version = 'official-asset-event-storage-record.v1'
    and domain_schema_version = 'official-asset-event.v1'
  ),
  constraint official_events_required_text_check check (
    event_id <> '' and event_id = btrim(event_id)
    and deduplication_key <> '' and deduplication_key = btrim(deduplication_key)
    and asset_ticker <> '' and asset_ticker = btrim(asset_ticker)
    and asset_official_name <> '' and asset_official_name = btrim(asset_official_name)
    and asset_regulatory_identity_key <> ''
    and asset_regulatory_identity_key = btrim(asset_regulatory_identity_key)
    and document_identity_value <> ''
    and document_identity_value = btrim(document_identity_value)
    and title <> '' and title = btrim(title) and char_length(title) <= 500
    and raw_document_type <> '' and raw_document_type = btrim(raw_document_type)
    and char_length(raw_document_type) <= 500
    and parser_version <> '' and parser_version = btrim(parser_version)
    and char_length(parser_version) <= 200
    and mapping_version <> '' and mapping_version = btrim(mapping_version)
    and char_length(mapping_version) <= 200
    and source_payload_hash <> ''
    and source_payload_hash = btrim(source_payload_hash)
  ),
  constraint official_events_optional_text_limits_check check (
    (
      summary is null
      or (summary <> '' and summary = btrim(summary) and char_length(summary) <= 4000)
    )
    and (
      classification_justification is null
      or (
        classification_justification <> ''
        and classification_justification = btrim(classification_justification)
        and char_length(classification_justification) <= 1000
      )
    )
    and (
      raw_document_category is null
      or (
        raw_document_category <> ''
        and raw_document_category = btrim(raw_document_category)
        and char_length(raw_document_category) <= 500
      )
    )
    and (
      attribution is null
      or (
        attribution <> ''
        and attribution = btrim(attribution)
        and char_length(attribution) <= 1000
      )
    )
  ),
  constraint official_events_optional_identifiers_check check (
    (supersedes_event_id is null or (supersedes_event_id <> '' and supersedes_event_id = btrim(supersedes_event_id)))
    and (source_document_id is null or (source_document_id <> '' and source_document_id = btrim(source_document_id)))
    and (
      regulatory_document_id is null
      or (
        regulatory_document_id <> ''
        and regulatory_document_id = btrim(regulatory_document_id)
      )
    )
    and (accession_number is null or (accession_number <> '' and accession_number = btrim(accession_number)))
    and (protocol_number is null or (protocol_number <> '' and protocol_number = btrim(protocol_number)))
    and (fingerprint is null or (fingerprint <> '' and fingerprint = btrim(fingerprint)))
  ),
  constraint official_events_event_type_check check (
    event_type in (
      'regulatory-filing',
      'earnings-release',
      'periodic-report',
      'material-fact',
      'market-communication',
      'dividend-or-distribution',
      'capital-structure-change',
      'offering-or-issuance',
      'shareholder-meeting',
      'management-change',
      'merger-acquisition-or-reorganization',
      'legal-or-regulatory-action',
      'fund-policy-change',
      'fund-manager-or-administrator-change',
      'other-official-event'
    )
  ),
  constraint official_events_classification_check check (
    (
      event_type = 'other-official-event'
      and classification_justification is not null
      and classification_justification <> ''
    )
    or (
      event_type <> 'other-official-event'
      and classification_justification is null
    )
  ),
  constraint official_events_asset_identity_check check (
    (
      asset_category = 'brazilian-stock'
      and asset_market = 'BR'
      and jurisdiction = 'BR'
      and language = 'pt-BR'
      and cnpj is not null
      and cnpj ~ '^[0-9]{14}$'
      and cvm_code is not null
      and cvm_code ~ '^[0-9]{6}$'
      and isin is null
      and registrant_cik is null
      and series_id is null
      and class_contract_id is null
    )
    or (
      asset_category = 'real-estate-fund'
      and asset_market = 'BR'
      and jurisdiction = 'BR'
      and language = 'pt-BR'
      and cnpj is not null
      and cnpj ~ '^[0-9]{14}$'
      and cvm_code is null
      and (isin is null or isin ~ '^BR[A-Z0-9]{10}$')
      and registrant_cik is null
      and series_id is null
      and class_contract_id is null
    )
    or (
      asset_category = 'international-etf'
      and asset_market = 'US'
      and jurisdiction = 'US'
      and language = 'en-US'
      and cnpj is null
      and cvm_code is null
      and isin is null
      and registrant_cik is not null
      and registrant_cik ~ '^[0-9]{10}$'
      and series_id is not null
      and series_id ~ '^S[0-9]{9}$'
      and class_contract_id is not null
      and class_contract_id ~ '^C[0-9]{9}$'
    )
  ),
  constraint official_events_source_check check (
    source_type = 'regulator'
    and provenance_source_type = 'regulator'
    and provenance_source_system = source
    and (
      (source = 'cvm-ipe' and asset_category = 'brazilian-stock' and asset_market = 'BR')
      or (
        source = 'cvm-fund-delivery'
        and asset_category = 'real-estate-fund'
        and asset_market = 'BR'
      )
      or (source = 'sec-edgar' and asset_category = 'international-etf' and asset_market = 'US')
    )
  ),
  constraint official_events_document_identity_check check (
    (
      document_identity_kind = 'source-document-id'
      and source_document_id is not null
      and source_document_id = document_identity_value
    )
    or (
      document_identity_kind = 'regulatory-document-id'
      and regulatory_document_id is not null
      and regulatory_document_id = document_identity_value
    )
    or (
      document_identity_kind = 'accession-number'
      and accession_number is not null
      and accession_number = document_identity_value
    )
    or (
      document_identity_kind = 'protocol-number'
      and protocol_number is not null
      and protocol_number = document_identity_value
    )
    or (
      document_identity_kind = 'canonical-url'
      and canonical_url is not null
      and canonical_url = document_identity_value
    )
    or (
      document_identity_kind = 'fingerprint'
      and fingerprint is not null
      and fingerprint = document_identity_value
    )
  ),
  constraint official_events_occurred_at_check check (
    (
      occurred_at_precision is null
      and occurred_at_date is null
      and occurred_at_instant_utc is null
      and occurred_at_raw is null
      and occurred_at_source_offset is null
    )
    or (
      occurred_at_precision = 'date'
      and occurred_at_date is not null
      and occurred_at_instant_utc is null
      and occurred_at_raw = occurred_at_date::text
      and occurred_at_source_offset is null
    )
    or (
      occurred_at_precision = 'unknown'
      and occurred_at_date is null
      and occurred_at_instant_utc is null
      and occurred_at_source_offset is null
    )
    or (
      occurred_at_precision = 'minute'
      and occurred_at_date is null
      and occurred_at_instant_utc ~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\.[0-9]{3}Z$'
      and substring(occurred_at_instant_utc from 1 for 19)::timestamp is not null
      and occurred_at_raw ~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}T([01][0-9]|2[0-3]):[0-5][0-9](Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])$'
      and substring(occurred_at_raw from 1 for 10)::date is not null
      and occurred_at_source_offset ~ '^(Z|[+-](0[0-9]|1[0-3]):[0-5][0-9]|[+-]14:00)$'
      and right(occurred_at_raw, char_length(occurred_at_source_offset)) = occurred_at_source_offset
    )
    or (
      occurred_at_precision = 'second'
      and occurred_at_date is null
      and occurred_at_instant_utc ~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\.[0-9]{3}Z$'
      and substring(occurred_at_instant_utc from 1 for 19)::timestamp is not null
      and occurred_at_raw ~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,9})?(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])$'
      and substring(occurred_at_raw from 1 for 10)::date is not null
      and occurred_at_source_offset ~ '^(Z|[+-](0[0-9]|1[0-3]):[0-5][0-9]|[+-]14:00)$'
      and right(occurred_at_raw, char_length(occurred_at_source_offset)) = occurred_at_source_offset
    )
  ),
  constraint official_events_published_at_check check (
    (
      published_at_precision = 'date'
      and published_at_date is not null
      and published_at_instant_utc is null
      and published_at_raw = published_at_date::text
      and published_at_source_offset is null
    )
    or (
      published_at_precision = 'minute'
      and published_at_date is null
      and published_at_instant_utc ~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\.[0-9]{3}Z$'
      and substring(published_at_instant_utc from 1 for 19)::timestamp is not null
      and published_at_raw ~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}T([01][0-9]|2[0-3]):[0-5][0-9](Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])$'
      and substring(published_at_raw from 1 for 10)::date is not null
      and published_at_source_offset ~ '^(Z|[+-](0[0-9]|1[0-3]):[0-5][0-9]|[+-]14:00)$'
      and right(published_at_raw, char_length(published_at_source_offset)) = published_at_source_offset
    )
    or (
      published_at_precision = 'second'
      and published_at_date is null
      and published_at_instant_utc ~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\.[0-9]{3}Z$'
      and substring(published_at_instant_utc from 1 for 19)::timestamp is not null
      and published_at_raw ~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,9})?(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])$'
      and substring(published_at_raw from 1 for 10)::date is not null
      and published_at_source_offset ~ '^(Z|[+-](0[0-9]|1[0-3]):[0-5][0-9]|[+-]14:00)$'
      and right(published_at_raw, char_length(published_at_source_offset)) = published_at_source_offset
    )
  ),
  constraint official_events_status_check check (
    status in ('original', 'amendment', 'correction', 'replacement', 'cancellation')
    and (
      (status = 'original' and supersedes_event_id is null)
      or (status <> 'original' and supersedes_event_id is not null)
    )
    and (supersedes_event_id is null or supersedes_event_id <> event_id)
  ),
  constraint official_events_json_shapes_check check (
    jsonb_typeof(association_evidence) = 'array'
    and jsonb_array_length(association_evidence) > 0
    and jsonb_typeof(related_documents) = 'array'
    and jsonb_typeof(provenance_raw_fields) = 'object'
  ),
  constraint official_events_url_check check (
    (canonical_url is null or canonical_url ~ '^https://')
    and (original_url is null or original_url ~ '^https://')
    and (
      (
        source = 'cvm-ipe'
        and (canonical_url is null or canonical_url ~ '^https://www\.rad\.cvm\.gov\.br(/|$)')
        and (original_url is null or original_url ~ '^https://www\.rad\.cvm\.gov\.br(/|$)')
      )
      or (
        source = 'cvm-fund-delivery'
        and canonical_url is null
        and original_url is null
      )
      or (
        source = 'sec-edgar'
        and (canonical_url is null or canonical_url ~ '^https://www\.sec\.gov(/|$)')
        and (original_url is null or original_url ~ '^https://www\.sec\.gov(/|$)')
      )
    )
  ),
  constraint official_events_internal_timestamps_check check (
    ingested_at ~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,9})?Z$'
    and updated_at ~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,9})?Z$'
    and (
      substring(updated_at from 1 for 19)::timestamp,
      coalesce(
        rpad(substring(updated_at from '\.([0-9]{1,9})Z$'), 9, '0'),
        '000000000'
      )::integer
    ) >= (
      substring(ingested_at from 1 for 19)::timestamp,
      coalesce(
        rpad(substring(ingested_at from '\.([0-9]{1,9})Z$'), 9, '0'),
        '000000000'
      )::integer
    )
  )
);

create index official_asset_events_asset_identity_idx
on public.official_asset_events (asset_regulatory_identity_key);

create index official_asset_events_asset_category_idx
on public.official_asset_events (asset_category);

create index official_asset_events_asset_market_idx
on public.official_asset_events (asset_market);

create index official_asset_events_asset_ticker_idx
on public.official_asset_events (asset_ticker);

create index official_asset_events_source_idx
on public.official_asset_events (source);

create index official_asset_events_event_type_idx
on public.official_asset_events (event_type);

create index official_asset_events_status_idx
on public.official_asset_events (status);

create index official_asset_events_supersedes_idx
on public.official_asset_events (supersedes_event_id)
where supersedes_event_id is not null;

create index official_asset_events_document_identity_idx
on public.official_asset_events (
  source,
  document_identity_kind,
  document_identity_value
);

create index official_asset_events_published_date_idx
on public.official_asset_events (published_at_date desc)
where published_at_date is not null;

create index official_asset_events_published_instant_idx
on public.official_asset_events (published_at_instant_utc desc)
where published_at_instant_utc is not null;

create index official_asset_events_occurred_date_idx
on public.official_asset_events (occurred_at_date desc)
where occurred_at_date is not null;

create index official_asset_events_occurred_instant_idx
on public.official_asset_events (occurred_at_instant_utc desc)
where occurred_at_instant_utc is not null;

alter table public.official_asset_events enable row level security;

create policy "Authenticated users can read global official asset events"
on public.official_asset_events
for select
to authenticated
using (true);

revoke all on table public.official_asset_events from public;
revoke all on table public.official_asset_events from anon;
revoke all on table public.official_asset_events from authenticated;

grant select on table public.official_asset_events to authenticated;
grant select, insert, update, delete on table public.official_asset_events to service_role;
