-- Sprint 16, Fase 1 (DEC-074): fundação de schema para o motor por score.
-- `asset_type` só se aplica a FII (tijolo/papel/fof) — aplicar métrica de
-- tijolo (vacância, WALE) num fundo de papel é o erro de categoria que a v1
-- do documento de referência de FII cometeu. `asset_segment` cobre os três
-- vocabulários (FII, ação por regime, ETF por benchmark) porque cada ativo
-- só pertence a uma categoria — sem ambiguidade em ter uma coluna só.
--
-- Classificação de cada um dos 12 ativos do universo fechado, verificada em
-- fonte durante a pesquisa de docs/reference/ (FII, ações e ETF) nesta
-- sessão — não adivinhada. Ver docs/reference/*.md para a fonte de cada uma.

alter table public.assets
  add column asset_type text,
  add column asset_segment text;

alter table public.assets
  add constraint assets_asset_type_check check (
    asset_type is null or asset_type in ('tijolo', 'papel', 'fof')
  );

alter table public.assets
  add constraint assets_asset_segment_check check (
    asset_segment is null or asset_segment in (
      -- FII
      'shopping', 'lajes-corporativas', 'logistica', 'renda-urbana', 'hibrido',
      -- Ação, por regime (docs/reference/ACOES_BR_SETORES_E_METRICAS.md)
      'banco', 'seguradora', 'regulado', 'holding', 'industrial',
      -- ETF, por índice replicado (docs/reference/ETF_INTERNACIONAL_SEGMENTOS_E_METRICAS.md)
      'indice-amplo-us', 'reit-us', 'mercados-desenvolvidos-ex-us'
    )
  );

-- Backfill dos 12 ativos já semeados para o único usuário real hoje.
-- Idempotente por ticker — seguro reexecutar.
update public.assets set asset_type = 'tijolo', asset_segment = 'hibrido' where ticker = 'KNRI11';
update public.assets set asset_type = 'tijolo', asset_segment = 'shopping' where ticker = 'VISC11';
update public.assets set asset_type = 'tijolo', asset_segment = 'logistica' where ticker = 'XPLG11';
update public.assets set asset_type = 'tijolo', asset_segment = 'renda-urbana' where ticker = 'HGRU11';

update public.assets set asset_segment = 'banco' where ticker = 'BBAS3';
update public.assets set asset_segment = 'holding' where ticker = 'ITSA4';
update public.assets set asset_segment = 'regulado' where ticker = 'TAEE11';
update public.assets set asset_segment = 'industrial' where ticker = 'WEGE3';
update public.assets set asset_segment = 'seguradora' where ticker = 'PSSA3';

update public.assets set asset_segment = 'indice-amplo-us' where ticker = 'VOO';
update public.assets set asset_segment = 'reit-us' where ticker = 'VNQ';
update public.assets set asset_segment = 'mercados-desenvolvidos-ex-us' where ticker = 'VEA';
