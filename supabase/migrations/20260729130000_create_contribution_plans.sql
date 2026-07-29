-- Persistencia do plano de aporte (Sprint 6, DEC-055).
--
-- ContributionPlan/ContributionPlanItem existem no dominio desde o inicio,
-- mas a persistencia foi deliberadamente adiada (AGENTS.md secao 14) ate
-- existir o fluxo real de apresentacao, aceite e confirmacao. Esse fluxo
-- agora existe (Novo Aporte autenticado, motor real, confirmacao de compras
-- realizadas), entao as tabelas saem do estado "planejado" para aplicado.
--
-- Por usuario, como purchases/allocation_targets/exchange_rates: user_id da
-- sessao, RLS com (select auth.uid()), ownership validado nas relacoes.

create table public.contribution_plans (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  input_amount_minor bigint not null,
  currency text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contribution_plans_input_amount_minor_positive check (
    input_amount_minor > 0
  ),
  constraint contribution_plans_currency_check check (
    currency in ('BRL', 'USD')
  ),
  constraint contribution_plans_status_check check (
    status in ('draft', 'presented', 'accepted', 'rejected', 'confirmed')
  )
);

create trigger set_contribution_plans_updated_at
before update on public.contribution_plans
for each row
execute function public.set_updated_at();

alter table public.contribution_plans enable row level security;

create policy "Users can select their own contribution plans"
on public.contribution_plans
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can insert their own contribution plans"
on public.contribution_plans
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their own contribution plans"
on public.contribution_plans
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their own contribution plans"
on public.contribution_plans
for delete
to authenticated
using (user_id = (select auth.uid()));

grant select, insert, update, delete
on table public.contribution_plans
to authenticated;

create index contribution_plans_user_id_idx
on public.contribution_plans (user_id);

create index contribution_plans_user_status_idx
on public.contribution_plans (user_id, status);

-- Itens sugeridos dentro de um plano. purchase_id liga o item planejado a
-- uma compra efetivamente registrada quando o usuario confirma a compra
-- (ContributionPlanItem.plannedPurchase no dominio) - fica nulo enquanto o
-- plano nao chega ao status 'confirmed'.
create table public.contribution_plan_items (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  contribution_plan_id uuid not null
    references public.contribution_plans(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  planned_amount_minor bigint not null,
  currency text not null,
  purchase_id uuid references public.purchases(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint contribution_plan_items_planned_amount_minor_non_negative check (
    planned_amount_minor >= 0
  ),
  constraint contribution_plan_items_currency_check check (
    currency in ('BRL', 'USD')
  ),
  constraint contribution_plan_items_plan_asset_unique unique (
    contribution_plan_id,
    asset_id
  )
);

alter table public.contribution_plan_items enable row level security;

create policy "Users can select their own contribution plan items"
on public.contribution_plan_items
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can insert their own contribution plan items"
on public.contribution_plan_items
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.contribution_plans
    where contribution_plans.id = contribution_plan_items.contribution_plan_id
      and contribution_plans.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.assets
    where assets.id = contribution_plan_items.asset_id
      and assets.user_id = (select auth.uid())
  )
);

create policy "Users can update their own contribution plan items"
on public.contribution_plan_items
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.contribution_plans
    where contribution_plans.id = contribution_plan_items.contribution_plan_id
      and contribution_plans.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.assets
    where assets.id = contribution_plan_items.asset_id
      and assets.user_id = (select auth.uid())
  )
);

grant select, insert, update
on table public.contribution_plan_items
to authenticated;

create index contribution_plan_items_plan_id_idx
on public.contribution_plan_items (contribution_plan_id);

create index contribution_plan_items_user_id_idx
on public.contribution_plan_items (user_id);

create index contribution_plan_items_asset_id_idx
on public.contribution_plan_items (asset_id);

create index contribution_plan_items_purchase_id_idx
on public.contribution_plan_items (purchase_id)
where purchase_id is not null;
