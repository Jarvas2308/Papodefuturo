-- Sprint 16, Fase 4 (spread DY sobre TIPS, VNQ): segunda serie de
-- market_reference_rates (DEC-075 ja previa isso, comentario original da
-- tabela: "series deixa espaco pra outras taxas de referencia (ex.: TIPS 10
-- anos via FRED, Fase 4) sem tabela nova").
--
-- DFII10 (FRED, Fed de St. Louis) e' o "10-Year Treasury Inflation-Indexed
-- Security, Constant Maturity" - um rendimento sintetico interpolado para
-- maturidade constante de 10 anos, nao o rendimento de um titulo especifico
-- com data de vencimento real (diferente da NTN-B, que e' sempre "o titulo
-- IPCA+ de vencimento mais longo disponivel" e portanto tem maturity_date
-- real). Inventar uma data de vencimento pra essa serie violaria o principio
-- de nao criar dado que a fonte nao fornece - por isso maturity_date passa a
-- aceitar null, restrito por CHECK a exatamente as series sem titulo real
-- por tras.
--
-- Nao inclui ainda o sinal de score (spread DY de VNQ sobre TIPS): o DY
-- depende do valor do provento, que segue bloqueado pelo mesmo motivo do
-- FII/acao (so o evento de distribuicao foi ingerido, nao o valor - ver
-- ROADMAP.md). Este ciclo so guarda a taxa TIPS como infraestrutura, mesmo
-- padrao da Fase 2 com NTN-B.

alter table public.market_reference_rates
  alter column maturity_date drop not null;

alter table public.market_reference_rates
  drop constraint market_reference_rates_series_check;

alter table public.market_reference_rates
  add constraint market_reference_rates_series_check check (
    series in ('ntnb-longa', 'fred-dfii10')
  );

alter table public.market_reference_rates
  drop constraint market_reference_rates_source_check;

alter table public.market_reference_rates
  add constraint market_reference_rates_source_check check (
    source in ('tesouro-transparente', 'fred')
  );

alter table public.market_reference_rates
  add constraint market_reference_rates_maturity_date_by_series_check check (
    (series = 'ntnb-longa' and maturity_date is not null)
    or (series = 'fred-dfii10' and maturity_date is null)
  );
