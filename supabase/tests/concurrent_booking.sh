#!/bin/sh
set -eu

DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
PSQL="${PSQL:-psql}"
TMP_ROOT="${TMPDIR:-/tmp}"
RUN_DIR="$(mktemp -d "${TMP_ROOT}/armature-booking-test.XXXXXX")"
RESOURCE_ID="23000000-0000-4000-8000-000000000001"
LOCATION_ID="23000000-0000-4000-8000-000000000002"
BOOKING_ONE="23000000-0000-4000-8000-000000000003"
BOOKING_TWO="23000000-0000-4000-8000-000000000004"
MEMBER_ONE="23000000-0000-4000-8000-000000000005"
MEMBER_TWO="23000000-0000-4000-8000-000000000006"

cleanup() {
  "$PSQL" "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<SQL
delete from public.resource_reservations where resource_id = '$RESOURCE_ID';
delete from public.bookings where id in ('$BOOKING_ONE', '$BOOKING_TWO');
delete from public.resources where id = '$RESOURCE_ID';
delete from auth.users where id in ('$MEMBER_ONE', '$MEMBER_TWO');
delete from public.locations where id = '$LOCATION_ID';
SQL
  rm -f "$RUN_DIR/one.log" "$RUN_DIR/two.log"
  rmdir "$RUN_DIR"
}
trap cleanup EXIT INT TERM

"$PSQL" "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<SQL
delete from public.resource_reservations where resource_id = '$RESOURCE_ID';
delete from public.bookings where id in ('$BOOKING_ONE', '$BOOKING_TWO');
delete from public.resources where id = '$RESOURCE_ID';
delete from auth.users where id in ('$MEMBER_ONE', '$MEMBER_TWO');
delete from public.locations where id = '$LOCATION_ID';

insert into auth.users (id, aud, role, email, email_confirmed_at)
values
  ('$MEMBER_ONE', 'authenticated', 'authenticated', 'concurrent-one@example.test', now()),
  ('$MEMBER_TWO', 'authenticated', 'authenticated', 'concurrent-two@example.test', now());

insert into public.locations (id, slug, name)
values ('$LOCATION_ID', 'concurrency-test', 'Concurrency test location');

insert into public.resources (
  id,
  location_id,
  slug,
  name,
  kind,
  capacity,
  max_guests
)
values (
  '$RESOURCE_ID',
  '$LOCATION_ID',
  'concurrency-resource',
  'Concurrency test resource',
  'workspace',
  1,
  0
);

insert into public.bookings (id, resource_id, member_id, starts_at, ends_at)
values
  (
    '$BOOKING_ONE',
    '$RESOURCE_ID',
    '$MEMBER_ONE',
    date_trunc('hour', now() + interval '10 days'),
    date_trunc('hour', now() + interval '10 days') + interval '1 hour'
  ),
  (
    '$BOOKING_TWO',
    '$RESOURCE_ID',
    '$MEMBER_TWO',
    date_trunc('hour', now() + interval '10 days'),
    date_trunc('hour', now() + interval '10 days') + interval '1 hour'
  );
SQL

attempt() {
  booking_id="$1"
  output="$2"
  "$PSQL" "$DATABASE_URL" -v ON_ERROR_STOP=1 >"$output" 2>&1 <<SQL
begin;
insert into public.resource_reservations (
  resource_id,
  kind,
  booking_id,
  starts_at,
  ends_at
)
values (
  '$RESOURCE_ID',
  'booking',
  '$booking_id',
  date_trunc('hour', now() + interval '10 days'),
  date_trunc('hour', now() + interval '10 days') + interval '1 hour'
);
select pg_sleep(1);
commit;
SQL
}

set +e
attempt "$BOOKING_ONE" "$RUN_DIR/one.log" &
PID_ONE=$!
attempt "$BOOKING_TWO" "$RUN_DIR/two.log" &
PID_TWO=$!
wait "$PID_ONE"
STATUS_ONE=$?
wait "$PID_TWO"
STATUS_TWO=$?
set -e

SUCCESS_COUNT=0
[ "$STATUS_ONE" -eq 0 ] && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
[ "$STATUS_TWO" -eq 0 ] && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

if [ "$SUCCESS_COUNT" -ne 1 ]; then
  printf '%s\n' "Expected exactly one concurrent reservation to succeed."
  printf '%s\n' "--- attempt one ---"
  sed -n '1,120p' "$RUN_DIR/one.log"
  printf '%s\n' "--- attempt two ---"
  sed -n '1,120p' "$RUN_DIR/two.log"
  exit 1
fi

COUNT="$(
  "$PSQL" "$DATABASE_URL" -Atqc \
    "select count(*) from public.resource_reservations where resource_id = '$RESOURCE_ID' and released_at is null"
)"

if [ "$COUNT" -ne 1 ]; then
  printf '%s\n' "Expected one active reservation; found $COUNT."
  exit 1
fi

printf '%s\n' "ok - exactly one overlapping concurrent reservation succeeded"
