begin;

select plan(8);

select has_function(
  'public',
  'set_resource_hours',
  array['uuid', 'smallint', 'time without time zone', 'time without time zone'],
  'set_resource_hours exists'
);

select has_function(
  'public',
  'staff_set_booking_status',
  array['uuid', 'booking_status', 'text'],
  'staff_set_booking_status exists'
);

select function_privs_are(
  'public',
  'set_resource_hours',
  array['uuid', 'smallint', 'time without time zone', 'time without time zone'],
  'authenticated',
  array['EXECUTE'],
  'authenticated staff may call set_resource_hours'
);

select function_privs_are(
  'public',
  'staff_set_booking_status',
  array['uuid', 'booking_status', 'text'],
  'authenticated',
  array['EXECUTE'],
  'authenticated staff may call staff_set_booking_status'
);

select function_privs_are(
  'public',
  'set_resource_hours',
  array['uuid', 'smallint', 'time without time zone', 'time without time zone'],
  'anon',
  array[]::text[],
  'anonymous users cannot call set_resource_hours'
);

select function_privs_are(
  'public',
  'staff_set_booking_status',
  array['uuid', 'booking_status', 'text'],
  'anon',
  array[]::text[],
  'anonymous users cannot call staff_set_booking_status'
);

select throws_ok(
  $$select public.set_resource_hours(
    '30000000-0000-4000-8000-000000000001',
    1::smallint,
    '09:00'::time,
    '18:00'::time
  )$$,
  '42501',
  'operations staff role required',
  'non-staff cannot change resource hours'
);

select throws_ok(
  $$select public.staff_set_booking_status(
    '50000000-0000-4000-8000-000000000001',
    'no_show'::public.booking_status,
    'member absent'
  )$$,
  '42501',
  'operations staff role required',
  'non-staff cannot change booking status'
);

select * from finish();
rollback;
