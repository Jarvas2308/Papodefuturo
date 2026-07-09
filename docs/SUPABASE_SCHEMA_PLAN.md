# Plano de Schema Supabase

## 1. Objetivo

Este documento planeja o schema futuro do Supabase para o Papo de Futuro. Ele
serve como base técnica para revisão antes da criação de migrations reais.

Nenhuma alteração real no banco é executada neste ciclo. Este documento não cria
tabelas, RLS, policies, seeds, Edge Functions, autenticação, APIs ou
persistência.

## 2. Estado Atual

- Projeto Supabase: `Papodefuturo`.
- Project ref: `vxjrncwfysglinfktifz`.
- Região informada: `us-east-1`.
- Schema `public` atualmente sem tabelas.
- Sem migrations registradas.
- Sem Edge Functions.
- Aplicação ainda usa mocks e telas demonstrativas.
- Factory isolada de cliente Supabase já criada no app.
- Dependência `@supabase/supabase-js` já instalada.
- Ainda não existe persistência real.
- Ainda não existe conexão de dados reais com telas.

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

- `profiles.id` deve representar o mesmo identificador do usuário autenticado;
- a criação automática do perfil pode ser avaliada em ciclo próprio.

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
2. `profiles`.
3. `assets`.
4. `purchases`.
5. `asset_prices`.
6. `allocation_targets`.
7. `contribution_plans`.
8. `contribution_plan_items`.
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

## 10. Fora do Escopo Deste Documento

- Nenhuma migration criada.
- Nenhuma tabela criada.
- Nenhuma RLS aplicada.
- Nenhum SQL executado.
- Nenhuma tela alterada.
- Nenhuma rota alterada.
- Nenhum mock alterado.
- Nenhuma persistência criada.
- Nenhum dado real acessado.
- Nenhuma autenticação criada.
- Nenhum backend criado.
- Nenhuma API criada.
