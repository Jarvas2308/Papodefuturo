# Plano de Schema Supabase

## 1. Objetivo

Este documento registra o schema planejado do Supabase para o Papo de Futuro e o
estado aplicado atual das primeiras migrations.

Nenhuma alteração real no banco é executada por este documento. Alterações no
Supabase continuam acontecendo somente por migrations revisadas e aplicadas em
ciclos próprios.

## 2. Estado Atual

Esta seção documenta o estado no momento em que as cinco primeiras tabelas
foram aplicadas. Migrations posteriores (`exchange_rates`,
`fundamental_snapshots`, `official_asset_events` e as tabelas de checkpoint de
backfill) estão documentadas em `docs/ROADMAP.md` e `docs/PROJECT_HANDOFF.md`
seção 9, que são a fonte mais atual. As telas autenticadas hoje consomem dados
reais destas cinco tabelas — não usam mocks para carteira, compras, cotações
ou metas; o modo demo continua disponível apenas quando o ambiente Supabase
não está configurado.

- Projeto Supabase: `Papodefuturo`.
- Project ref: `vxjrncwfysglinfktifz`.
- Região informada: `us-east-1`.
- Migrations aplicadas no Supabase real:
  - `20260709211527_create_profiles`;
  - `20260709214124_fix_profiles_advisors`;
  - `20260709220231_revoke_rls_auto_enable_execute`;
  - `20260710022454_create_assets`;
  - `20260710140822_create_purchases`;
  - `20260710174244_create_asset_prices`;
  - `20260713134642_create_allocation_targets`.
- Schema `public` possui as tabelas reais `profiles`, `assets`, `purchases`,
  `asset_prices` e `allocation_targets`.
- `public.profiles` está criada com RLS habilitado e 0 linhas.
- `profiles.id` é primary key e foreign key para `auth.users(id)`.
- Colunas atuais de `profiles`: `id uuid`, `name text`, `created_at timestamptz`
  com `default now()` e `updated_at timestamptz` com `default now()`.
- Policies de `profiles` foram corrigidas para usar `(select auth.uid())`.
- `public.set_updated_at()` teve `search_path` corrigido.
- Execução pública de `public.rls_auto_enable()` foi revogada.
- `public.assets` está criada com RLS habilitado e 0 linhas.
- `assets.id` é primary key e `assets.user_id` é foreign key para
  `auth.users(id)`.
- Colunas atuais de `assets`: `id uuid`, `user_id uuid`, `ticker text`,
  `name text`, `category text`, `market text`, `currency text`, `status text`
  com `default 'active'`, `created_at timestamptz` com `default now()` e
  `updated_at timestamptz` com `default now()`.
- Constraints de `assets` garantem ticker e nome não vazios, categorias do
  domínio atual, mercados `BR`, `US` e `INTERNAL`, moedas `BRL` e `USD`, e
  status `active` ou `inactive`.
- Policies de `assets` são restritas a `authenticated` e usam
  `(select auth.uid())`.
- `assets` possui índice único por `user_id + upper(ticker)` e índices
  auxiliares por usuário, categoria e status.
- `public.purchases` está criada com RLS habilitado e 0 linhas.
- `purchases.id` é primary key.
- `purchases.user_id` é foreign key para `auth.users(id)`.
- `purchases.asset_id` é foreign key para `public.assets(id)`.
- Colunas atuais de `purchases`: `id uuid`, `user_id uuid`, `asset_id uuid`,
  `quantity numeric`, `unit_price_minor bigint`, `total_amount_minor bigint`,
  `currency text`, `purchased_at date`, `status text` com
  `default 'confirmed'`, `notes text`, `created_at timestamptz` com
  `default now()` e `updated_at timestamptz` com `default now()`.
- Constraints de `purchases` garantem quantidade positiva, valores monetários
  não negativos, moedas `BRL` e `USD`, status `planned`, `confirmed` ou
  `cancelled`, e notas nulas ou não vazias.
- Policies de `purchases` são restritas a `authenticated`, usam
  `(select auth.uid())` e validam, em insert e update, que o ativo pertence ao
  usuário autenticado.
- `purchases` possui índices por usuário, ativo, usuário + ativo, usuário +
  data de compra e usuário + status.
- `public.asset_prices` está criada com RLS habilitado e 0 linhas.
- `asset_prices.id` é primary key.
- `asset_prices.user_id` é foreign key para `auth.users(id)`.
- `asset_prices.asset_id` é foreign key para `public.assets(id)`.
- Colunas atuais de `asset_prices`: `id uuid`, `user_id uuid`, `asset_id uuid`,
  `price_minor bigint`, `currency text`, `priced_at timestamptz`, `source text`
  com `default 'manual'` e `created_at timestamptz` com `default now()`.
- Constraints de `asset_prices` garantem preço positivo, moedas `BRL` e `USD`,
  e source `manual` ou `market-provider`.
- Policies de `asset_prices` são restritas a `authenticated`, usam
  `(select auth.uid())` e validam, em insert e update, que o ativo pertence ao
  usuário autenticado.
- `asset_prices` possui índices por usuário, ativo, usuário + ativo, usuário +
  data de preço e usuário + ativo + data de preço.
- `public.allocation_targets` está criada com RLS habilitado e 0 linhas.
- `allocation_targets.id` é primary key.
- `allocation_targets.user_id` é foreign key para `auth.users(id)`.
- `allocation_targets.asset_id` é foreign key nullable para `public.assets(id)`.
- Colunas atuais de `allocation_targets`: `id uuid`, `user_id uuid`,
  `target_type text`, `asset_id uuid`, `category text`,
  `target_basis_points integer`, `created_at timestamptz` com `default now()` e
  `updated_at timestamptz` com `default now()`.
- Constraints de `allocation_targets` garantem `target_type` `category` ou
  `asset`, categorias do domínio atual, `target_basis_points` entre 0 e 10.000,
  metas de categoria sem `asset_id` e metas de ativo com `asset_id`.
- `allocation_targets` possui trigger `set_allocation_targets_updated_at` usando
  `public.set_updated_at()`.
- Policies de `allocation_targets` são restritas a `authenticated`, usam
  `(select auth.uid())` e validam, em insert e update, que o ativo pertence ao
  usuário autenticado e que `assets.category = allocation_targets.category`.
- `allocation_targets` possui índices únicos parciais por usuário + categoria e
  usuário + ativo, além de índices auxiliares por usuário, usuário + tipo de meta
  e ativo não nulo.
- Advisors atuais de segurança estão limpos.
- Advisors atuais de performance têm somente avisos informativos `unused_index`
  para índices de `assets`, `purchases`, `asset_prices` e `allocation_targets`
  ainda não usados.
- Edge Function `refresh-market-data` publicada e ativa (ver
  `docs/PROJECT_HANDOFF.md` seção 5).
- Aplicação consome estas tabelas em runtime através de repositories reais nos
  fluxos autenticados; o modo demo permanece como fallback determinístico.
- Factory isolada de cliente Supabase criada no app.
- Dependência `@supabase/supabase-js` instalada.
- Autenticação frontend real via Supabase Auth, com fallback demo quando o
  ambiente não está configurado.

## 3. Princípios Técnicos

- Um usuário só deve acessar seus próprios dados.
- `auth.users` será a origem de identidade.
- Tabelas de dados do usuário devem conter `user_id`.
- RLS deve estar habilitado e revisado antes de qualquer conexão com telas.
- Valores financeiros devem ser armazenados em centavos ou unidades menores
  inteiras.
- Percentuais e metas devem usar basis points.
- Evitar floats para valores financeiros críticos.
- Tabelas persistentes devem ter `created_at` e `updated_at` quando fizer
  sentido auditar criação e alteração.
- Migrations devem ser pequenas, revisáveis e aplicadas em ordem controlada.
- A integração com o app foi gradual, sem substituir todos os mocks de uma vez;
  hoje as cinco tabelas abaixo estão conectadas e o modo demo segue disponível
  como fallback quando o ambiente não está configurado, não como etapa
  intermediária de migração.

## 4. Tabelas Aplicadas

### profiles

Finalidade:

- armazenar metadados básicos públicos ou privados do usuário da aplicação.

Campos sugeridos:

- `id uuid primary key references auth.users(id)`;
- `name text`;
- `created_at timestamptz`;
- `updated_at timestamptz`.

Observações:

- `profiles` já possui migrations versionadas e aplicadas no Supabase real;
- RLS está habilitado em `public.profiles`;
- as policies reais usam `(select auth.uid())`;
- a função `public.set_updated_at()` foi corrigida com `search_path` fixo;
- a execução pública de `public.rls_auto_enable()` foi revogada;
- os advisors atuais de segurança e performance estão limpos;
- `profiles.id` deve representar o mesmo identificador do usuário autenticado;
- a criação automática do perfil pode ser avaliada em ciclo próprio.

As demais tabelas deste plano, além de `profiles`, `assets`, `purchases`,
`asset_prices` e `allocation_targets`, ainda não foram criadas no Supabase real.

### assets

Finalidade:

- catálogo de ativos cadastrados pelo usuário.

Campos aplicados:

- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `ticker text`;
- `name text`;
- `category text`;
- `market text`;
- `currency text`;
- `status text`;
- `created_at timestamptz`;
- `updated_at timestamptz`.

Observações:

- `assets` já possui migration versionada e aplicada no Supabase real;
- RLS está habilitado em `public.assets`;
- as policies reais usam `(select auth.uid())`;
- existe índice único por `user_id + upper(ticker)`;
- existem índices auxiliares por usuário, categoria e status;
- os advisors de segurança estão limpos;
- os avisos `unused_index` atuais são informativos, esperados porque a tabela
  a tabela teve poucas linhas ou baixo volume de consulta no momento da
  auditoria;
- ativo pertence ao usuário;
- ticker não é único globalmente, apenas dentro do escopo do usuário;
- categorias devem permanecer compatíveis com o domínio atual;
- `assets` está conectada às telas via repository real; o modo demo continua
  disponível como fallback quando o ambiente Supabase não está configurado.

### purchases

Finalidade:

- registrar compras e aportes realizados.

Campos aplicados:

- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `asset_id uuid references assets(id)`;
- `quantity numeric`;
- `unit_price_minor bigint`;
- `total_amount_minor bigint`;
- `currency text`;
- `purchased_at date`;
- `status text`;
- `notes text`;
- `created_at timestamptz`;
- `updated_at timestamptz`.

Observações:

- `purchases` já possui migration versionada e aplicada no Supabase real;
- RLS está habilitado em `public.purchases`;
- as policies reais usam `(select auth.uid())`;
- as policies de insert e update validam que `asset_id` pertence ao usuário
  autenticado;
- existe trigger `set_purchases_updated_at` usando `public.set_updated_at()`;
- existem índices por usuário, ativo, usuário + ativo, usuário + data de compra
  e usuário + status;
- os advisors de segurança estão limpos;
- os avisos `unused_index` atuais são informativos, esperados porque a tabela
  a tabela teve poucas linhas ou baixo volume de consulta no momento da
  auditoria;
- `purchases` está conectada ao Histórico e à Carteira via `PurchaseRepository`;
  o modo demo continua disponível como fallback quando o ambiente Supabase não
  está configurado;
- posição da carteira deve ser calculada a partir das compras;
- não criar tabela `holdings` nesta etapa sem justificativa clara;
- vendas e eventos de renda podem exigir modelagem própria em ciclos futuros.

### asset_prices

Finalidade:

- armazenar cotações manuais ou futuras dos ativos.

Campos aplicados:

- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `asset_id uuid references assets(id)`;
- `price_minor bigint`;
- `currency text`;
- `priced_at timestamptz`;
- `source text`;
- `created_at timestamptz`.

Observações:

- `asset_prices` já possui migration versionada e aplicada no Supabase real;
- RLS está habilitado em `public.asset_prices`;
- as policies reais usam `(select auth.uid())`;
- as policies de insert e update validam que `asset_id` pertence ao usuário
  autenticado;
- existem índices por usuário, ativo, usuário + ativo, usuário + data de preço e
  usuário + ativo + data de preço;
- os advisors de segurança estão limpos;
- os avisos `unused_index` atuais são informativos, esperados porque a tabela
  a tabela teve poucas linhas ou baixo volume de consulta no momento da
  auditoria;
- desde `DEC-053`, `asset_prices` **não tem mais consumidor no app**: as
  telas leem `public.market_asset_prices` (global, `DEC-052`) via
  `AssetPriceRepository`. `asset_prices` permanece aplicada e intocada no
  schema, mantida até um ciclo futuro confirmar remoção;
- source aceita `manual` e `market-provider`, mas nenhuma linha nova é
  gravada aqui desde o cutover — ver `market_asset_prices` abaixo.

### market_asset_prices e market_exchange_rates (globais, `DEC-052`)

- tabelas novas e independentes, sem `user_id`, identidade por `ticker`
  (`market_asset_prices`) ou por par de moeda (`market_exchange_rates`),
  não FK para `assets`, que é por usuário;
- RLS com leitura para `authenticated` (`using (true)`), escrita exclusiva
  de `service_role` via RPC transacional (`upsert_market_asset_prices_v1`,
  `upsert_market_exchange_rates_v1`);
- a Edge Function `refresh-market-data` grava linhas reais com `source =
'market-provider'`, autenticada como `service_role` (`DEC-053`), sem
  depender de sessão de usuário;
- desde `DEC-054`, atualizadas automaticamente a cada hora via
  `pg_cron`/`pg_net` (job `refresh-market-data-hourly`), com o segredo
  `service_role` lido do Supabase Vault em tempo de execução, nunca
  versionado;
- `refresh-market-data` cobre B3 COTAHIST e Twelve Data (mercado
  internacional); ver `docs/PROJECT_HANDOFF.md` seção 9 para o estado mais
  recente auditado.

### allocation_targets

Finalidade:

- guardar metas de alocação por ativo ou categoria.

Campos aplicados:

- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `target_type text`;
- `asset_id uuid nullable references assets(id)`;
- `category text`;
- `target_basis_points integer`;
- `created_at timestamptz`;
- `updated_at timestamptz`.

Observações:

- `allocation_targets` já possui migration versionada e aplicada no Supabase
  real;
- migration real registrada: `20260713134642_create_allocation_targets`;
- arquivo versionado correspondente:
  `supabase/migrations/20260711200225_create_allocation_targets.sql`;
- RLS está habilitado em `public.allocation_targets`;
- as policies reais usam `(select auth.uid())`;
- existem 4 policies para `authenticated`;
- as policies de insert e update validam ownership do ativo;
- as policies de insert e update validam que `assets.category` corresponde a
  `allocation_targets.category`;
- existe trigger `set_allocation_targets_updated_at` usando
  `public.set_updated_at()`;
- `target_type` aceita somente `category` e `asset`;
- categorias permanecem alinhadas ao domínio atual;
- `target_basis_points` aceita valores entre 0 e 10.000;
- meta de categoria exige `asset_id is null`;
- meta de ativo exige `asset_id is not null`;
- existem índices únicos parciais por usuário + categoria e por usuário + ativo;
- existem índices auxiliares por usuário, usuário + tipo de meta e ativo não
  nulo;
- os advisors de segurança estão limpos;
- os avisos `unused_index` atuais são informativos, esperados porque a tabela
  a tabela teve poucas linhas ou baixo volume de consulta no momento da
  auditoria;
- `allocation_targets` está conectada à tela Estratégia, com escrita via RPC
  `replace_allocation_targets`; o modo demo continua disponível como fallback
  quando o ambiente Supabase não está configurado;
- a soma das metas a 10.000 basis points permanece validada na
  aplicação/domínio.

### contribution_plans

Finalidade:

- registrar planos de aporte apresentados, aceitos, rejeitados ou
  confirmados pelo usuário.

Campos aplicados (`DEC-055`, Sprint 6):

- `id uuid primary key`;
- `user_id uuid not null references auth.users(id) on delete cascade`;
- `input_amount_minor bigint not null`;
- `currency text not null` (`BRL` ou `USD`);
- `status text not null default 'draft'` (`draft`, `presented`, `accepted`,
  `rejected`, `confirmed`);
- `created_at timestamptz not null default now()`;
- `updated_at timestamptz not null default now()`, com trigger
  `set_updated_at`.

Observações:

- um plano representa uma simulação apresentada ao usuário, com decisão de
  aceite/rejeição e, quando aceito, confirmação ligada às compras reais;
- `ContributionPlan` no domínio corresponde diretamente a esta tabela;
- `contribution_plans` está aplicada, com RLS por `(select auth.uid())` e
  grants de CRUD completo para `authenticated`, mesmo padrão de
  `purchases`/`allocation_targets`;
- persistência é sempre ato explícito do usuário (simular → apresentar →
  aceitar/rejeitar → confirmar); o motor nunca persiste automaticamente.

### contribution_plan_items

Finalidade:

- itens sugeridos dentro de um plano de aporte, com link opcional para a
  compra real que os confirmou.

Campos aplicados (`DEC-055`, Sprint 6):

- `id uuid primary key`;
- `user_id uuid not null references auth.users(id) on delete cascade`;
- `contribution_plan_id uuid not null references contribution_plans(id) on delete cascade`;
- `asset_id uuid not null references assets(id) on delete restrict`;
- `planned_amount_minor bigint not null`;
- `currency text not null` (`BRL` ou `USD`);
- `purchase_id uuid references purchases(id) on delete set null`;
- `created_at timestamptz not null default now()`.

Observações:

- item pertence a um plano de aporte; unicidade por
  `(contribution_plan_id, asset_id)` — um item por ativo por plano;
- `user_id` denormalizado para simplificar RLS e auditoria;
- `ContributionPlanItem` no domínio corresponde diretamente a esta tabela;
- `plannedPurchase` no domínio é resolvido via `purchase_id`: fica `null`
  enquanto o plano não chega a `confirmed`, e aponta para a `Purchase` real
  registrada quando o usuário confirma a compra;
- `contribution_plan_items` está aplicada, com RLS validando ownership tanto
  do plano pai quanto do ativo nas policies de insert/update; grants de
  select/insert/update para `authenticated` (sem delete — itens são
  removidos apenas por cascade quando o plano é apagado).

## 5. Relacionamentos

- Usuário -> `profiles`.
- Usuário -> `assets`.
- Usuário -> `purchases`.
- `assets` -> `purchases`.
- `assets` -> `asset_prices`.
- Usuário -> `allocation_targets`.
- `contribution_plans` -> `contribution_plan_items`.
- `assets` -> `contribution_plan_items`.

## 6. RLS Aplicado

Estratégia em vigor, já aplicada às cinco tabelas por usuário:

- RLS habilitado em todas as tabelas com `user_id`;
- usuário autenticado só seleciona, insere, atualiza e deleta linhas cujo
  `user_id = auth.uid()`;
- `profiles.id` corresponde a `auth.uid()`;
- nenhuma policy pública; nenhuma tabela aberta anonimamente;
- policies específicas por operação;
- advisors de segurança revisados a cada migration;
- grants e exposição pela Data API confirmados antes de cada conexão real.

Eventos oficiais e fundamentos seguem estratégia diferente por serem dados
globais sem `user_id`: leitura para `authenticated`, escrita reservada a
`service_role` via RPC — ver `docs/PROJECT_HANDOFF.md` seção 9. A suíte pgTAP
`supabase/tests/database/rls_user_isolation.test.sql` (43 asserções) valida o
isolamento das tabelas por usuário no CI (`rls-pgtap`, `DEC-039`).

## 7. Ordem Sugerida de Migrations Futuras

1. Extensões necessárias, se houver.
2. `profiles` — aplicada.
3. `assets` — aplicada.
4. `purchases` — aplicada.
5. `asset_prices` — aplicada.
6. `allocation_targets` — aplicada.
7. `contribution_plans` — aplicada (`DEC-055`).
8. `contribution_plan_items` — aplicada (`DEC-055`).
9. Índices.
10. Triggers de `updated_at`.
11. RLS.
12. Policies.
13. Types gerados para TypeScript.

## 8. Índices Aplicados

- `assets(user_id)` — aplicado, com aviso informativo `unused_index` enquanto
  não houver consultas reais;
- `assets(user_id, upper(ticker))` — aplicado como índice único;
- `assets(user_id, category)` — aplicado, com aviso informativo `unused_index`
  enquanto não houver consultas reais;
- `assets(user_id, status)` — aplicado, com aviso informativo `unused_index`
  enquanto não houver consultas reais;
- `purchases(user_id)` — aplicado, com aviso informativo `unused_index`
  enquanto não houver consultas reais;
- `purchases(asset_id)` — aplicado, com aviso informativo `unused_index`
  enquanto não houver consultas reais;
- `purchases(user_id, asset_id)` — aplicado, com aviso informativo
  `unused_index` enquanto não houver consultas reais;
- `purchases(user_id, purchased_at)` — aplicado, com aviso informativo
  `unused_index` enquanto não houver consultas reais;
- `purchases(user_id, status)` — aplicado, com aviso informativo `unused_index`
  enquanto não houver consultas reais;
- `asset_prices(user_id)` — aplicado, com aviso informativo `unused_index`
  enquanto não houver consultas reais;
- `asset_prices(asset_id)` — aplicado, com aviso informativo `unused_index`
  enquanto não houver consultas reais;
- `asset_prices(user_id, asset_id)` — aplicado, com aviso informativo
  `unused_index` enquanto não houver consultas reais;
- `asset_prices(user_id, priced_at desc)` — aplicado, com aviso informativo
  `unused_index` enquanto não houver consultas reais;
- `asset_prices(user_id, asset_id, priced_at desc)` — aplicado, com aviso
  informativo `unused_index` enquanto não houver consultas reais;
- `allocation_targets(user_id)` — aplicado, com aviso informativo `unused_index`
  enquanto não houver consultas reais;
- `allocation_targets(user_id, target_type)` — aplicado, com aviso informativo
  `unused_index` enquanto não houver consultas reais;
- `allocation_targets(asset_id)` — aplicado como índice parcial para ativos não
  nulos, com aviso informativo `unused_index` enquanto não houver consultas
  reais;
- `allocation_targets(user_id, category)` — aplicado como índice único parcial
  para metas de categoria;
- `allocation_targets(user_id, asset_id)` — aplicado como índice único parcial
  para metas de ativo;
- `contribution_plans(user_id)` — aplicado;
- `contribution_plans(user_id, status)` — aplicado;
- `contribution_plan_items(contribution_plan_id)` — aplicado;
- `contribution_plan_items(user_id)` — aplicado;
- `contribution_plan_items(asset_id)` — aplicado;
- `contribution_plan_items(purchase_id)` — aplicado como índice parcial para
  itens já ligados a uma compra real.

## 9. Integração Gradual com o App

Ordem futura recomendada:

1. Gerar ou preparar os types do schema Supabase atual.
2. Criar repositories isolados.
3. Implementar Auth real.
4. Preparar seed do universo fechado de ativos.
5. Criar testes de isolamento por usuário.
6. Conectar leitura real de carteira.
7. Conectar Estratégia a `allocation_targets`.
8. Conectar compras.
9. Fazer Novo Aporte consumir dados reais.
10. Evoluir o motor estratégico real.
11. Conectar `contribution_plans` e `contribution_plan_items` ao fluxo real de
    apresentação, aceite e confirmação — concluído no Sprint 6 (`DEC-055`).

Mocks permanecem como fallback durante a integração gradual.

## 10. Estado atual desta seção (histórico corrigido)

Este documento descrevia, em ciclos anteriores, um app sem nenhuma tela
conectada a dados reais. Isso deixou de ser verdade: carteira, compras,
histórico, estratégia, cotações e câmbio consomem dados reais via
repositories, com Supabase Auth real e fallback demo apenas quando o ambiente
não está configurado. Backend real existe na forma de RPCs (`security
definer`) e da Edge Function `refresh-market-data`; não há um servidor HTTP
próprio além disso.

Estado real, com detalhe em `docs/PROJECT_HANDOFF.md`:

- as tabelas por usuário `profiles`, `assets`, `purchases`,
  `allocation_targets` estão aplicadas, conectadas e recebem dados reais nos
  fluxos autenticados;
- `asset_prices` e `exchange_rates` (por usuário, com `user_id`) permanecem
  aplicadas mas sem consumidor no app desde `DEC-053` — mantidas intocadas
  até um ciclo futuro confirmar remoção;
- `fundamental_snapshots` e `official_asset_events` são tabelas globais
  aplicadas, sem `user_id`;
- `market_asset_prices` e `market_exchange_rates` (`DEC-052`) também são
  globais, sem `user_id`, e são hoje a única fonte real de preços e câmbio
  consumida pelo app e pela Edge Function `refresh-market-data`, atualizada
  automaticamente a cada hora via `pg_cron`/`pg_net` (`DEC-054`);
- Sprint 5 do plano de sprints (dados de mercado globais + agendamento
  automático) está completo — ver `docs/ROADMAP.md`;
- `contribution_plans` e `contribution_plan_items` deixaram de ser
  "planejada e adiada" (`DEC-055`, Sprint 6): aplicadas, por usuário, RLS com
  `(select auth.uid())`, conectadas ao fluxo real de apresentação, aceite,
  rejeição e confirmação em `src/features/contribution`. `ContributionPlanItem.plannedPurchase`
  é resolvido via `purchase_id`, ligando cada item à `Purchase` real quando o
  plano é confirmado.

### Tabelas globais de apoio ao motor de score

Além das acima, o motor de score (`DEC-085` a `DEC-103`) usa tabelas
globais, sem `user_id`, todas com o mesmo padrão de acesso: RLS ligada,
`select` para `authenticated`, escrita exclusivamente por `service_role`
através de uma RPC `security definer` dedicada (sem DML direto, revogado
depois da criação da RPC).

Aplicadas em produção: `signal_rules` (esta é por usuário),
`market_reference_rates`, `market_valuation_ratios`,
`market_etf_valuations`, `provento_declaration_values` (`DEC-102`) e
`fii_monthly_dividend_yield`.

**Versionada e ainda NÃO aplicada em produção**:
`etf_distribution_values` (migration
`20260807130000_create_etf_distribution_values.sql`, `DEC-103`) — valor
anual de distribuição por cota e NAV de fim de exercício dos ETFs,
extraídos do N-CSR da SEC. Identidade `(ticker, fiscal_year_end_date)`,
sem coluna de versão (o documento publica um número por exercício) e sem
FK para `official_asset_events` (não existe evento SEC EDGAR em produção;
a identidade documental — CIK, accession e URL — fica na própria linha).
RPC de escrita: `upsert_etf_distribution_values_v1`. Nenhuma linha
escrita até agora.
