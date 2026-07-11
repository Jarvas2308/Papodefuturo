# Plano de Schema Supabase

## 1. Objetivo

Este documento registra o schema planejado do Supabase para o Papo de Futuro e o
estado aplicado atual das primeiras migrations.

Nenhuma alteração real no banco é executada por este documento. Alterações no
Supabase continuam acontecendo somente por migrations revisadas e aplicadas em
ciclos próprios.

## 2. Estado Atual

- Projeto Supabase: `Papodefuturo`.
- Project ref: `vxjrncwfysglinfktifz`.
- Região informada: `us-east-1`.
- Migrations aplicadas no Supabase real:
  - `20260709211527_create_profiles`;
  - `20260709214124_fix_profiles_advisors`;
  - `20260709220231_revoke_rls_auto_enable_execute`;
  - `20260710022454_create_assets`;
  - `20260710140822_create_purchases`;
  - `20260710174244_create_asset_prices`.
- Schema `public` possui as tabelas reais `profiles`, `assets`, `purchases` e
  `asset_prices`.
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
- Advisors atuais de segurança estão limpos.
- Advisors atuais de performance têm somente avisos informativos `unused_index`
  para índices de `assets`, `purchases` e `asset_prices` ainda não usados.
- Sem Edge Functions.
- Aplicação ainda usa mocks e telas demonstrativas.
- Factory isolada de cliente Supabase já criada no app.
- Dependência `@supabase/supabase-js` já instalada.
- Ainda não existe consumo de Supabase em runtime pelas telas.
- Ainda não existe conexão de dados reais com telas.
- Ainda não existem autenticação frontend real, backend, APIs ou dados reais no
  app.

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
- A integração com o app deve ser gradual, sem substituir todos os mocks de uma
  vez.
- Dados demonstrativos devem permanecer disponíveis até a leitura real estar
  validada.

## 4. Tabelas Planejadas

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

As demais tabelas deste plano, além de `profiles`, `assets`, `purchases` e
`asset_prices`, ainda não foram criadas no Supabase real.

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
  tem 0 linhas e o app ainda não faz consultas reais;
- ativo pertence ao usuário;
- ticker não é único globalmente, apenas dentro do escopo do usuário;
- categorias devem permanecer compatíveis com o domínio demonstrativo atual;
- ainda não há dados reais em `assets`;
- `assets` ainda não está conectada às telas;
- o app ainda usa mocks.

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
  tem 0 linhas e o app ainda não faz consultas reais;
- ainda não há dados reais em `purchases`;
- `purchases` ainda não está conectada às telas;
- o app ainda usa mocks;
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
  tem 0 linhas e o app ainda não faz consultas reais;
- ainda não há dados reais em `asset_prices`;
- `asset_prices` ainda não está conectada às telas;
- o app ainda usa mocks;
- inicialmente pode suportar cotação manual;
- source aceita `manual` e `market-provider`;
- histórico de preços deve ser consultado por ativo e data de preço;
- no futuro pode receber integração por API;
- integrações externas não fazem parte deste plano inicial.

### allocation_targets

Finalidade:

- guardar metas de alocação por ativo ou categoria.

Campos sugeridos:

- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `target_type text`;
- `asset_id uuid nullable references assets(id)`;
- `category text nullable`;
- `target_basis_points integer`;
- `created_at timestamptz`;
- `updated_at timestamptz`.

Observações:

- soma das metas por escopo deve tender a 10.000 basis points;
- validações complexas podem começar na aplicação e depois evoluir para
  constraints;
- metas por categoria e por ativo devem permanecer coerentes com o domínio da
  tela Estratégia.

### contribution_plans

Finalidade:

- registrar planos de aporte calculados futuramente.

Campos sugeridos:

- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `amount_minor integer/bigint`;
- `currency text`;
- `status text`;
- `created_at timestamptz`;
- `updated_at timestamptz`.

Observações:

- um plano representa uma simulação ou decisão futura;
- status deve ser modelado antes de qualquer confirmação operacional.

### contribution_plan_items

Finalidade:

- itens sugeridos dentro de um plano de aporte.

Campos sugeridos:

- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `contribution_plan_id uuid references contribution_plans(id)`;
- `asset_id uuid references assets(id)`;
- `suggested_amount_minor integer/bigint`;
- `suggested_quantity numeric nullable`;
- `reason text`;
- `created_at timestamptz`.

Observações:

- item pertence a um plano de aporte;
- `user_id` facilita RLS e auditoria;
- justificativas devem ser explicativas, não recomendação financeira.

## 5. Relacionamentos

- Usuário -> `profiles`.
- Usuário -> `assets`.
- Usuário -> `purchases`.
- `assets` -> `purchases`.
- `assets` -> `asset_prices`.
- Usuário -> `allocation_targets`.
- `contribution_plans` -> `contribution_plan_items`.
- `assets` -> `contribution_plan_items`.

## 6. RLS Planejado

Estratégia futura:

- habilitar RLS em todas as tabelas com `user_id`;
- usuário autenticado só deve selecionar, inserir, atualizar e deletar linhas
  cujo `user_id = auth.uid()`;
- `profiles.id` deve corresponder a `auth.uid()`;
- evitar policies públicas;
- nenhuma tabela deve ficar aberta anonimamente;
- policies devem ser específicas por operação;
- revisar advisors de segurança depois das migrations;
- confirmar grants e exposição pela Data API antes de conectar o frontend.

Este documento não define SQL final obrigatório. As policies reais devem ser
criadas e revisadas em ciclo próprio.

## 7. Ordem Sugerida de Migrations Futuras

1. Extensões necessárias, se houver.
2. `profiles` — aplicada.
3. `assets` — aplicada.
4. `purchases` — aplicada.
5. `asset_prices` — aplicada.
6. `allocation_targets` — pendente.
7. `contribution_plans` — pendente.
8. `contribution_plan_items` — pendente.
9. Índices.
10. Triggers de `updated_at`.
11. RLS.
12. Policies.
13. Types gerados para TypeScript.

## 8. Índices Planejados

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
- `allocation_targets(user_id)`;
- `contribution_plan_items(contribution_plan_id)`.

## 9. Integração Gradual com o App

Ordem futura recomendada:

1. Criar migrations.
2. Gerar types.
3. Criar repositories.
4. Manter mocks como fallback temporário.
5. Conectar leitura de `assets`.
6. Conectar `purchases`.
7. Recalcular carteira com dados reais.
8. Conectar strategy/metas.
9. Conectar Novo Aporte.
10. Remover mocks só depois de estabilidade.

## 10. Estado Fora do Escopo Atual do App

- Nenhuma tela consome Supabase em runtime.
- Nenhuma rota foi conectada ao banco real.
- Nenhum mock foi substituído por dados reais.
- Nenhuma persistência real foi conectada ao frontend.
- Nenhum dado real foi inserido ou acessado pelo app.
- Nenhuma autenticação frontend real foi criada.
- Nenhum backend foi criado.
- Nenhuma API foi criada.
- Nenhuma tabela além de `public.profiles`, `public.assets`, `public.purchases`
  e `public.asset_prices` foi criada no Supabase real.
- As próximas tabelas pendentes são `allocation_targets`, `contribution_plans` e
  `contribution_plan_items`.
- O próximo passo provável é criar a migration de `allocation_targets`, ainda sem
  conectar telas.
