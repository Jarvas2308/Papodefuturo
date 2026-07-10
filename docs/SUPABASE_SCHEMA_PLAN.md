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
  - `20260709220231_revoke_rls_auto_enable_execute`.
- Schema `public` possui somente a tabela real `profiles`.
- `public.profiles` está criada com RLS habilitado e 0 linhas.
- `profiles.id` é primary key e foreign key para `auth.users(id)`.
- Colunas atuais de `profiles`: `id uuid`, `name text`, `created_at timestamptz`
  com `default now()` e `updated_at timestamptz` com `default now()`.
- Policies de `profiles` foram corrigidas para usar `(select auth.uid())`.
- `public.set_updated_at()` teve `search_path` corrigido.
- Execução pública de `public.rls_auto_enable()` foi revogada.
- Advisors atuais de segurança e performance estão limpos.
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

As demais tabelas deste plano ainda não foram criadas no Supabase real.

### assets

Finalidade:

- catálogo de ativos cadastrados pelo usuário.

Campos sugeridos:

- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `ticker text`;
- `name text`;
- `asset_type text`;
- `currency text`;
- `category text`;
- `created_at timestamptz`;
- `updated_at timestamptz`.

Observações:

- ativo pertence ao usuário;
- ticker não deve ser necessariamente único globalmente;
- considerar unicidade por `user_id + ticker`;
- categorias devem permanecer compatíveis com o domínio demonstrativo atual.

### purchases

Finalidade:

- registrar compras e aportes realizados.

Campos sugeridos:

- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `asset_id uuid references assets(id)`;
- `quantity numeric`;
- `unit_price_minor integer/bigint`;
- `total_amount_minor integer/bigint`;
- `currency text`;
- `purchased_at date`;
- `notes text`;
- `created_at timestamptz`;
- `updated_at timestamptz`.

Observações:

- posição da carteira deve ser calculada a partir das compras;
- não criar tabela `holdings` nesta etapa sem justificativa clara;
- vendas e eventos de renda podem exigir modelagem própria em ciclos futuros.

### asset_prices

Finalidade:

- armazenar cotações manuais ou futuras dos ativos.

Campos sugeridos:

- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `asset_id uuid references assets(id)`;
- `price_minor integer/bigint`;
- `currency text`;
- `priced_at timestamptz`;
- `source text`;
- `created_at timestamptz`.

Observações:

- inicialmente pode suportar cotação manual;
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
3. `assets` — pendente.
4. `purchases` — pendente.
5. `asset_prices` — pendente.
6. `allocation_targets` — pendente.
7. `contribution_plans` — pendente.
8. `contribution_plan_items` — pendente.
9. Índices.
10. Triggers de `updated_at`.
11. RLS.
12. Policies.
13. Types gerados para TypeScript.

## 8. Índices Planejados

- `assets(user_id)`;
- `assets(user_id, ticker)`;
- `purchases(user_id)`;
- `purchases(asset_id)`;
- `purchases(user_id, purchased_at)`;
- `asset_prices(asset_id, priced_at)`;
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
- Nenhuma tabela além de `public.profiles` foi criada no Supabase real.
