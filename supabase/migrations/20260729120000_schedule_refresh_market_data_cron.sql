-- Agendamento automatico de refresh-market-data (Sprint 5, DEC-054).
--
-- DEC-052/DEC-053 ja resolveram o pre-requisito: dados de mercado sao
-- globais (market_asset_prices, market_exchange_rates) e a Edge Function
-- aceita um chamador de confianca server-side via
-- Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>, sem sessao de usuario.
-- Falta so o agendamento em si: pg_cron dispara a chamada HTTP via pg_net
-- a cada hora, alinhado com a janela de freshness de 60 minutos usada pelo
-- core da funcao (MARKET_DATA_FRESHNESS_MS).
--
-- O valor do service_role key nunca entra numa migration versionada. O job
-- de cron le o segredo em tempo de execucao via Supabase Vault
-- (vault.decrypted_secrets), referenciado aqui só pelo nome
-- 'refresh_market_data_service_role_key'. O segredo em si e inserido por uma
-- acao operacional separada, fora do controle de versao, antes do primeiro
-- disparo agendado.

create extension if not exists pg_net;
create extension if not exists pg_cron;

select cron.schedule(
  'refresh-market-data-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://vxjrncwfysglinfktifz.supabase.co/functions/v1/refresh-market-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'refresh_market_data_service_role_key'
      )
    ),
    body := jsonb_build_object('trigger', 'pg_cron')
  ) as request_id;
  $$
);
