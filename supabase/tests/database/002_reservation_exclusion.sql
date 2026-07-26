begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into auth.users (id, aud, role, email, email_confirmed_at)
values
  (
    '21000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'reservation-one@example.test',
    now()
  ),
  (
    '21000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'reservation-two@example.test',
    now()
  );

create temporary table test_window as
select
  date_trunc('hour', now() + interval '7 days') as starts_at,
  date_trunc('hour', now() + interval '7 days') + interval '1 hour' as ends_at;

insert into public.bookings (
  id,
  resource_id,
  member_id,
  starts_at,
  ends_at
)
select
  booking_id,
  resource.id,
  member_id,
  test_window.starts_at,
  test_window.ends_at
from (
  values
    (
      '22000000-0000-4000-8000-000000000001'::uuid,
      '21000000-0000-4000-8000-000000000001'::uuid
    ),
    (
      '22000000-0000-4000-8000-000000000002'::uuid,
      '21000000-0000-4000-8000-000000000002'::uuid
    ),
    (
      '22000000-0000-4000-8000-000000000003'::uuid,
      '21000000-0000-4000-8000-000000000002'::uuid
    )
) fixture(booking_id, member_id)
cross join lateral (
  select id from public.resources where slug = 'builder-pod-01' limit 1
) resource
cross join test_window;

select lives_ok(
  $$
    insert into public.resource_reservations (
      resource_id,
      kind,
      booking_id,
      starts_at,
      ends_at
    )
    select
      resource.id,
      'booking',
      '22000000-0000-4000-8000-000000000001',
      test_window.starts_at,
      test_window.ends_at
    from public.resources resource
    cross join test_window
    where resource.slug = 'builder-pod-01'
  $$,
  'first reservation succeeds'
);

select throws_ok(
  $$
    insert into public.resource_reservations (
      resource_id,
      kind,
      booking_id,
      starts_at,
      ends_at
    )
    select
      resource.id,
      'booking',
      '22000000-0000-4000-8000-000000000002',
      test_window.starts_at + interval '30 minutes',
      test_window.ends_at + interval '30 minutes'
    from public.resources resource
    cross join test_window
    where resource.slug = 'builder-pod-01'
  $$,
  '23P01'
);

select lives_ok(
  $$
    insert into public.resource_reservations (
      resource_id,
      kind,
      booking_id,
      starts_at,
      ends_at
    )
    select
      resource.id,
      'booking',
      '22000000-0000-4000-8000-000000000003',
      test_window.ends_at,
      test_window.ends_at + interval '1 hour'
    from public.resources resource
    cross join test_window
    where resource.slug = 'builder-pod-01'
  $$,
  'adjacent [start,end) reservation succeeds'
);

update public.resource_reservations
set released_at = now()
where booking_id = '22000000-0000-4000-8000-000000000001';

select lives_ok(
  $$
    insert into public.resource_reservations (
      resource_id,
      kind,
      booking_id,
      starts_at,
      ends_at
    )
    select
      resource.id,
      'booking',
      '22000000-0000-4000-8000-000000000002',
      test_window.starts_at,
      test_window.ends_at
    from public.resources resource
    cross join test_window
    where resource.slug = 'builder-pod-01'
  $$,
  'released reservation no longer blocks the period'
);

select is(
  (
    select count(*)::integer
    from public.resource_reservations
    where resource_id = (
      select id from public.resources where slug = 'builder-pod-01' limit 1
    )
      and released_at is null
  ),
  2,
  'only the adjacent and replacement reservations remain active'
);

select * from finish();
rollback;
