-- Sprint 16, Fase 1 (DEC-074): tabela de limiares configuraveis para o
-- motor por score. Cada sinal (ex.: P/VP de FII, spread de DY sobre
-- NTN-B) vira uma ou mais faixas: min/max do valor observado -> pontos.
-- `signal_key` prefixa a categoria (fii_/stock_/etf_) porque o vocabulario
-- e as metricas sao diferentes por categoria (docs/reference/*.md) - nunca
-- aplicar regra de uma categoria a ativo de outra, mesmo erro de fundo que
-- a v1 do documento de FII cometeu tratando papel como tijolo.
--
-- Vazia por design nesta migration: as faixas de
-- docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md sao propostas para o
-- usuario revisar, nao fato pronto para gravar - populacao real acontece
-- quando o motor de score (Fase 5) e escrito, para que regra e codigo que
-- a consome nasçam juntos.

create table public.signal_rules (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_key text not null,
  min_value numeric,
  max_value numeric,
  points smallint not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint signal_rules_signal_key_not_blank check (btrim(signal_key) <> ''),
  constraint signal_rules_range_check check (
    min_value is null or max_value is null or min_value <= max_value
  )
);

create trigger set_signal_rules_updated_at
before update on public.signal_rules
for each row
execute function public.set_updated_at();

alter table public.signal_rules enable row level security;

create policy "Users can select their own signal rules"
on public.signal_rules
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own signal rules"
on public.signal_rules
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own signal rules"
on public.signal_rules
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own signal rules"
on public.signal_rules
for delete
to authenticated
using (user_id = auth.uid());

create index signal_rules_user_id_signal_key_idx
on public.signal_rules (user_id, signal_key);

grant select, insert, update, delete on public.signal_rules to authenticated;

-- Peso do score no laco guloso (DEC-068, secao 5 do rascunho):
-- desvioAjustado = desvioCandidato - (score * pesoDoScoreEmPontosBase).
-- Fica em user_preferences porque e uma preferencia unica por usuario, nao
-- uma tabela propria. Default de 50 pontos-base por ponto de score e valor
-- de partida mecanico, nao julgamento financeiro - ajustavel a qualquer
-- momento na tela de configuracoes.
alter table public.user_preferences
  add column score_weight_basis_points smallint not null default 50;

alter table public.user_preferences
  add constraint user_preferences_score_weight_check
  check (score_weight_basis_points >= 0);
