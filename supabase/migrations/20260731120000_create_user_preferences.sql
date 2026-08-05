-- Sprint 11 (DEC-070): subconjunto útil de Configurações deixa de ser mock.
-- Perfil (nome) já persiste em `profiles`. E-mail vem de `auth.users`, sem
-- coluna própria aqui — edição de e-mail exige o fluxo de confirmação do
-- Supabase Auth, fora deste escopo. Notificações não entram: nunca tiveram
-- canal de envio.

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'BRL'
    constraint user_preferences_currency_check check (currency in ('BRL', 'USD')),
  percentage_decimals smallint not null default 2
    constraint user_preferences_percentage_decimals_check
    check (percentage_decimals in (0, 1, 2)),
  compact_view boolean not null default false,
  default_contribution_strategy text not null default 'proportional'
    constraint user_preferences_strategy_check
    check (default_contribution_strategy in ('proportional', 'target-allocation')),
  contribution_reminder_enabled boolean not null default true,
  contribution_reminder_day smallint not null default 10
    constraint user_preferences_reminder_day_check
    check (contribution_reminder_day between 1 and 28),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_user_preferences_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();

alter table public.user_preferences enable row level security;

create policy "Users can select their own preferences"
on public.user_preferences
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own preferences"
on public.user_preferences
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own preferences"
on public.user_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own preferences"
on public.user_preferences
for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on public.user_preferences to authenticated;
