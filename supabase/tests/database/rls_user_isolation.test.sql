begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(43);

create function public.__test_statement_is_blocked(statement text)
returns boolean
language plpgsql
as $$
begin
  begin
    execute statement;
    return false;
  exception
    when others then
      return true;
  end;
end;
$$;

insert into auth.users (id, email)
values
  ('10000000-0000-4000-8000-000000000001', 'rls-user-a@test.local'),
  ('20000000-0000-4000-8000-000000000002', 'rls-user-b@test.local');

insert into public.profiles (id, name)
values
  ('10000000-0000-4000-8000-000000000001', 'RLS User A'),
  ('20000000-0000-4000-8000-000000000002', 'RLS User B');

insert into public.assets (
  id,
  user_id,
  ticker,
  name,
  category,
  market,
  currency,
  status
)
values
  (
    '11000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'TSTA3',
    'Test Asset A',
    'brazilian-stock',
    'BR',
    'BRL',
    'active'
  ),
  (
    '22000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'TSTB',
    'Test Asset B',
    'international-etf',
    'US',
    'USD',
    'active'
  );

insert into public.purchases (
  id,
  user_id,
  asset_id,
  quantity,
  unit_price_minor,
  total_amount_minor,
  currency,
  purchased_at,
  status
)
values
  (
    '12000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    1,
    1000,
    1000,
    'BRL',
    '2026-07-13',
    'confirmed'
  ),
  (
    '23000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '22000000-0000-4000-8000-000000000002',
    1,
    2000,
    2000,
    'USD',
    '2026-07-13',
    'confirmed'
  );

insert into public.asset_prices (
  id,
  user_id,
  asset_id,
  price_minor,
  currency,
  priced_at,
  source
)
values
  (
    '13000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    1100,
    'BRL',
    '2026-07-13 12:00:00+00',
    'manual'
  ),
  (
    '24000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '22000000-0000-4000-8000-000000000002',
    2100,
    'USD',
    '2026-07-13 12:00:00+00',
    'manual'
  );

insert into public.allocation_targets (
  id,
  user_id,
  target_type,
  asset_id,
  category,
  target_basis_points
)
values
  (
    '14000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'category',
    null,
    'brazilian-stock',
    5000
  ),
  (
    '25000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'category',
    null,
    'international-etf',
    5000
  );

insert into public.exchange_rates (
  id,
  user_id,
  base_currency,
  quote_currency,
  rate_scaled,
  rate_scale,
  priced_at,
  source
)
values
  (
    '41000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'USD',
    'BRL',
    5400000,
    1000000,
    '2026-07-13 12:00:00+00',
    'manual'
  ),
  (
    '42000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'USD',
    'BRL',
    5600000,
    1000000,
    '2026-07-13 12:00:00+00',
    'manual'
  );

select extensions.policies_are(
  'public',
  'profiles',
  array[
    'Users can select their own profile',
    'Users can insert their own profile',
    'Users can update their own profile',
    'Users can delete their own profile'
  ],
  'profiles exposes only the expected user-scoped policies'
);

select extensions.policies_are(
  'public',
  'assets',
  array[
    'Users can select their own assets',
    'Users can insert their own assets',
    'Users can update their own assets',
    'Users can delete their own assets'
  ],
  'assets exposes only the expected user-scoped policies'
);

select extensions.policies_are(
  'public',
  'purchases',
  array[
    'Users can select their own purchases',
    'Users can insert their own purchases',
    'Users can update their own purchases',
    'Users can delete their own purchases'
  ],
  'purchases exposes only the expected user-scoped policies'
);

select extensions.policies_are(
  'public',
  'asset_prices',
  array[
    'Users can select their own asset prices',
    'Users can insert their own asset prices',
    'Users can update their own asset prices',
    'Users can delete their own asset prices'
  ],
  'asset_prices exposes only the expected user-scoped policies'
);

select extensions.policies_are(
  'public',
  'allocation_targets',
  array[
    'Users can select their own allocation targets',
    'Users can insert their own allocation targets',
    'Users can update their own allocation targets',
    'Users can delete their own allocation targets'
  ],
  'allocation_targets exposes only the expected user-scoped policies'
);

select extensions.policies_are(
  'public',
  'exchange_rates',
  array[
    'Users can select their own exchange rates',
    'Users can insert their own exchange rates',
    'Users can update their own exchange rates',
    'Users can delete their own exchange rates'
  ],
  'exchange_rates exposes only the expected user-scoped policies'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.replace_allocation_targets(jsonb)',
    'execute'
  ),
  'authenticated can execute replace_allocation_targets'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.replace_allocation_targets(jsonb)',
    'execute'
  ),
  'anon cannot execute replace_allocation_targets'
);

select extensions.ok(
  not has_function_privilege(
    'public',
    'public.replace_allocation_targets(jsonb)',
    'execute'
  ),
  'PUBLIC has no execute privilege on replace_allocation_targets'
);

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';

select extensions.results_eq(
  'select count(*) from public.profiles',
  array[1::bigint],
  'user A sees only their own profile'
);

select extensions.results_eq(
  'select count(*) from public.assets',
  array[1::bigint],
  'user A sees only their own assets'
);

select extensions.results_eq(
  'select count(*) from public.purchases',
  array[1::bigint],
  'user A sees only their own purchases'
);

select extensions.results_eq(
  'select count(*) from public.asset_prices',
  array[1::bigint],
  'user A sees only their own asset prices'
);

select extensions.results_eq(
  'select count(*) from public.allocation_targets',
  array[1::bigint],
  'user A sees only their own allocation targets'
);

select extensions.results_eq(
  'select count(*) from public.exchange_rates',
  array[1::bigint],
  'user A sees only their own exchange rates'
);

select extensions.lives_ok(
  $$
    insert into public.exchange_rates (
      id,
      user_id,
      base_currency,
      quote_currency,
      rate_scaled,
      rate_scale,
      priced_at,
      source
    ) values (
      '43000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'USD',
      'BRL',
      5500000,
      1000000,
      '2026-07-13 13:00:00+00',
      'manual'
    )
  $$,
  'user A can insert an exchange rate in their own scope'
);

select extensions.ok(
  public.__test_statement_is_blocked(
    $$
      insert into public.exchange_rates (
        id,
        user_id,
        base_currency,
        quote_currency,
        rate_scaled,
        rate_scale,
        priced_at,
        source
      ) values (
        '44000000-0000-4000-8000-000000000002',
        '20000000-0000-4000-8000-000000000002',
        'USD',
        'BRL',
        5700000,
        1000000,
        '2026-07-13 13:00:00+00',
        'manual'
      )
    $$
  ),
  'user A cannot insert an exchange rate for user B'
);

select extensions.lives_ok(
  $$
    insert into public.assets (
      id,
      user_id,
      ticker,
      name,
      category,
      market,
      currency,
      status
    ) values (
      '15000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'OWNA3',
      'Own Asset A',
      'brazilian-stock',
      'BR',
      'BRL',
      'active'
    )
  $$,
  'user A can insert an asset in their own scope'
);

select extensions.ok(
  public.__test_statement_is_blocked(
    $$
      insert into public.assets (
        id,
        user_id,
        ticker,
        name,
        category,
        market,
        currency,
        status
      ) values (
        '26000000-0000-4000-8000-000000000002',
        '20000000-0000-4000-8000-000000000002',
        'BADB3',
        'Foreign Asset B',
        'brazilian-stock',
        'BR',
        'BRL',
        'active'
      )
    $$
  ),
  'user A cannot insert an asset for user B'
);

select extensions.lives_ok(
  $$
    insert into public.purchases (
      id,
      user_id,
      asset_id,
      quantity,
      unit_price_minor,
      total_amount_minor,
      currency,
      purchased_at,
      status
    ) values (
      '16000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '11000000-0000-4000-8000-000000000001',
      2,
      1000,
      2000,
      'BRL',
      '2026-07-13',
      'confirmed'
    )
  $$,
  'user A can insert a purchase for their own asset'
);

select extensions.ok(
  public.__test_statement_is_blocked(
    $$
      insert into public.purchases (
        id,
        user_id,
        asset_id,
        quantity,
        unit_price_minor,
        total_amount_minor,
        currency,
        purchased_at,
        status
      ) values (
        '27000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000001',
        '22000000-0000-4000-8000-000000000002',
        1,
        2000,
        2000,
        'USD',
        '2026-07-13',
        'confirmed'
      )
    $$
  ),
  'user A cannot insert a purchase for user B asset'
);

select extensions.lives_ok(
  $$
    insert into public.asset_prices (
      id,
      user_id,
      asset_id,
      price_minor,
      currency,
      priced_at,
      source
    ) values (
      '17000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '11000000-0000-4000-8000-000000000001',
      1200,
      'BRL',
      '2026-07-13 13:00:00+00',
      'manual'
    )
  $$,
  'user A can insert a price for their own asset'
);

select extensions.ok(
  public.__test_statement_is_blocked(
    $$
      insert into public.asset_prices (
        id,
        user_id,
        asset_id,
        price_minor,
        currency,
        priced_at,
        source
      ) values (
        '28000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000001',
        '22000000-0000-4000-8000-000000000002',
        2200,
        'USD',
        '2026-07-13 13:00:00+00',
        'manual'
      )
    $$
  ),
  'user A cannot insert a price for user B asset'
);

select extensions.lives_ok(
  $$
    insert into public.allocation_targets (
      id,
      user_id,
      target_type,
      asset_id,
      category,
      target_basis_points
    ) values (
      '18000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'category',
      null,
      'cash',
      1000
    )
  $$,
  'user A can insert a category target in their own scope'
);

select extensions.lives_ok(
  $$
    insert into public.allocation_targets (
      id,
      user_id,
      target_type,
      asset_id,
      category,
      target_basis_points
    ) values (
      '19000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'asset',
      '11000000-0000-4000-8000-000000000001',
      'brazilian-stock',
      2500
    )
  $$,
  'user A can insert an asset target for their own matching asset'
);

select extensions.ok(
  public.__test_statement_is_blocked(
    $$
      insert into public.allocation_targets (
        id,
        user_id,
        target_type,
        asset_id,
        category,
        target_basis_points
      ) values (
        '29000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000001',
        'asset',
        '22000000-0000-4000-8000-000000000002',
        'international-etf',
        1000
      )
    $$
  ),
  'user A cannot insert an asset target for user B asset'
);

select extensions.ok(
  public.__test_statement_is_blocked(
    $$
      insert into public.allocation_targets (
        id,
        user_id,
        target_type,
        asset_id,
        category,
        target_basis_points
      ) values (
        '30000000-0000-4000-8000-000000000003',
        '10000000-0000-4000-8000-000000000001',
        'asset',
        '11000000-0000-4000-8000-000000000001',
        'real-estate-fund',
        1000
      )
    $$
  ),
  'user A cannot insert an asset target with a mismatched category'
);

select extensions.results_ne(
  $$
    update public.assets
    set name = 'Cross-user update'
    where user_id = '20000000-0000-4000-8000-000000000002'
    returning 1
  $$,
  $$values (1)$$,
  'user A cannot update user B assets'
);

select extensions.results_ne(
  $$
    delete from public.assets
    where user_id = '20000000-0000-4000-8000-000000000002'
    returning 1
  $$,
  $$values (1)$$,
  'user A cannot delete user B assets'
);

select extensions.results_eq(
  $$
    update public.exchange_rates
    set rate_scaled = 5700000
    where id = '42000000-0000-4000-8000-000000000002'
    returning rate_scaled
  $$,
  $$select 1::bigint where false$$,
  'user A cannot reach user B exchange rate for update'
);

select extensions.results_eq(
  $$
    delete from public.exchange_rates
    where id = '42000000-0000-4000-8000-000000000002'
    returning id
  $$,
  $$select null::uuid where false$$,
  'user A cannot reach user B exchange rate for delete'
);

select extensions.lives_ok(
  $$
    select public.replace_allocation_targets(
      '[
        {
          "id": "45000000-0000-4000-8000-000000000001",
          "target_type": "category",
          "asset_id": null,
          "category": "brazilian-stock",
          "target_basis_points": 6000
        },
        {
          "id": "46000000-0000-4000-8000-000000000001",
          "target_type": "category",
          "asset_id": null,
          "category": "international-etf",
          "target_basis_points": 4000
        }
      ]'::jsonb
    )
  $$,
  'user A can atomically replace their allocation targets'
);

select extensions.results_eq(
  $$
    select
      id,
      user_id,
      target_type,
      asset_id,
      category,
      target_basis_points
    from public.allocation_targets
    order by id
  $$,
  $$
    values
      (
        '45000000-0000-4000-8000-000000000001'::uuid,
        '10000000-0000-4000-8000-000000000001'::uuid,
        'category'::text,
        null::uuid,
        'brazilian-stock'::text,
        6000::integer
      ),
      (
        '46000000-0000-4000-8000-000000000001'::uuid,
        '10000000-0000-4000-8000-000000000001'::uuid,
        'category'::text,
        null::uuid,
        'international-etf'::text,
        4000::integer
      )
  $$,
  'RPC replaces user A old targets with only the requested owned targets'
);

select extensions.throws_ok(
  $$select public.replace_allocation_targets('{}'::jsonb)$$,
  'P0001',
  'targets must be a JSON array',
  'replace_allocation_targets rejects a non-array JSON payload'
);

set local request.jwt.claim.sub = '';

select extensions.throws_ok(
  $$select public.replace_allocation_targets('[]'::jsonb)$$,
  'P0001',
  'Authenticated user is required',
  'replace_allocation_targets rejects an authenticated role without auth.uid()'
);

set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000002';

select extensions.results_eq(
  'select count(*) from public.profiles',
  array[1::bigint],
  'user B sees only their own profile'
);

select extensions.results_eq(
  'select count(*) from public.assets',
  array[1::bigint],
  'user B sees only their own assets'
);

select extensions.results_eq(
  'select count(*) from public.purchases',
  array[1::bigint],
  'user B sees only their own purchases'
);

select extensions.results_eq(
  'select count(*) from public.asset_prices',
  array[1::bigint],
  'user B sees only their own asset prices'
);

select extensions.results_eq(
  'select count(*) from public.allocation_targets',
  array[1::bigint],
  'user B sees only their own allocation targets'
);

select extensions.results_eq(
  'select count(*) from public.exchange_rates',
  array[1::bigint],
  'user B sees only their own exchange rates'
);

select extensions.results_eq(
  $$
    select rate_scaled
    from public.exchange_rates
    where id = '42000000-0000-4000-8000-000000000002'
  $$,
  array[5600000::bigint],
  'user B exchange rate remains unchanged after user A update and delete attempts'
);

select extensions.results_eq(
  $$
    select
      id,
      user_id,
      category,
      target_basis_points
    from public.allocation_targets
  $$,
  $$
    values (
      '25000000-0000-4000-8000-000000000002'::uuid,
      '20000000-0000-4000-8000-000000000002'::uuid,
      'international-etf'::text,
      5000::integer
    )
  $$,
  'user B target remains intact after user A replaces their own targets'
);

reset role;

select * from extensions.finish();

rollback;
