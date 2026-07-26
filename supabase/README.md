# Armature Supabase Backend

This directory is the authoritative backend for Armature membership, resource
booking, attendance, and operational calendar mirroring.

## Security Model

- Every table exposed through `public` has RLS enabled.
- Anonymous access is limited to `public_member_profiles`,
  `public_resources`, `public_resource_hours`,
  `public_resource_certifications`, and `list_availability`.
- Approved public profiles never expose email, phone, emergency contact,
  certifications, bookings, or attendance.
- Staff authority comes only from `staff_roles`. User metadata and profile
  fields cannot grant privileges.
- Member writes that affect membership, booking, certification, check-in, or
  attendance use security-definer RPCs with a fixed empty `search_path`.
- Exclusive bookings and resource blocks share `resource_reservations`. Its
  GiST exclusion constraint rejects overlapping `[start,end)` ranges at the
  database layer, including concurrent requests.
- Kiosk QR tokens are random, stored only as SHA-256 hashes, expire after 60
  seconds, and are redeemed once.
- Kiosk scan requests require an enrolled P-256 device key, a signature, a
  timestamp within 30 seconds, and a unique nonce.
- Google and service-role credentials are Edge Function secrets. No credential
  is stored in a public table or returned to a client.

## Migrations

- `202607260001_core_schema.sql`: enums, tables, indexes, constraints, triggers.
- `202607260002_security_and_views.sql`: RLS, safe views, grants, role helpers.
- `202607260003_atomic_rpcs.sql`: required member, staff, booking, and check-in
  RPCs plus internal outbox and kiosk operations.
- `202607260004_storage_and_maintenance.sql`: Storage policies, immutable
  audit events, reminders, no-show handling, auto-close, and worker recovery.
- `202607260005_public_resource_zone.sql`: safe public projection of each
  resource's floor zone.
- `202607260006_operations_controls.sql`: audited weekly-hours updates and
  staff booking cancellation, completion, and no-show controls.

The required public RPCs are:

`submit_application`, `list_availability`, `create_booking`,
`reschedule_booking`, `cancel_booking`, `create_checkin_intent`,
`decide_membership`, `issue_certification`, and `create_resource_block`.

`staff_override_attendance` is an additional audited RPC. It requires a
protected operations/admin role, an `aal2` Supabase session, and a reason.
`set_resource_hours` and `staff_set_booking_status` are audited operations RPCs
used by the protected staff screens.

## Local Development

Requirements: Supabase CLI, Docker Desktop, and PostgreSQL `psql`.

```sh
supabase start
supabase db reset
supabase test db supabase/tests/database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  supabase/tests/concurrent_booking.sh
```

Generate frontend database types after a migration change:

```sh
supabase gen types typescript --local
```

The seed creates the HSR Layout location, safety certifications, sixteen
builder pods, electronics benches, fabrication equipment, robot cells, the
drone cage, GPU systems, six Jetson kits, vision benches, a mobile robot bay,
and the demo floor. It does not create staff accounts or calendar links.

## Edge Function Secrets

Set secrets with `supabase secrets set --env-file <owner-only-file>`. Never
commit that file.

All functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS` (comma-separated production and controlled preview origins)

Scheduled functions:

- `ARMATURE_JOB_SECRET`: high-entropy credential supplied in the
  `x-armature-job-secret` header.

Google Calendar (`calendar-sync`):

- `GOOGLE_SERVICE_ACCOUNT_JSON`: complete Google service-account JSON.
- `GOOGLE_WORKSPACE_SUBJECT`: delegated Workspace identity, normally
  `bookings@armaturelab.org`.
- `GOOGLE_SEND_UPDATES`: `all` by default; use `none` only for controlled
  testing.

The Workspace administrator must grant domain-wide delegation to the service
account for `https://www.googleapis.com/auth/calendar`. Create one private
calendar per reservable resource, share it with the delegated identity, and
insert its ID into `calendar_links`. Supabase remains authoritative: create,
update, and cancel deliveries overwrite external edits.

Reminders (`retry-reminders`):

- `REMINDER_WEBHOOK_URL`: server-side email delivery endpoint.
- `REMINDER_WEBHOOK_SECRET`: bearer credential for that endpoint.
- `REMINDER_FROM`: defaults to `bookings@armaturelab.org`.

The webhook receives an idempotency key, recipient, template name, and booking
data. It should deliver through the approved Google Workspace sender or the
lab's transactional email provider. Supabase Auth custom SMTP is configured
separately in the project dashboard for OTP and account email.

## Function Operations

Deploy:

```sh
supabase functions deploy kiosk --no-verify-jwt
supabase functions deploy calendar-sync --no-verify-jwt
supabase functions deploy retry-reminders --no-verify-jwt
supabase functions deploy booking-ics --no-verify-jwt
```

JWT verification is disabled at the gateway because each function implements a
more specific boundary:

- `kiosk` validates either a member/staff JWT, a one-use enrollment token, or
  an enrolled device signature depending on the action.
- `calendar-sync` and `retry-reminders` require `ARMATURE_JOB_SECRET`.
- `booking-ics` validates the bearer token and authorizes the booking owner or
  operations staff.

Schedule `calendar-sync` every minute and `retry-reminders` every minute using
Supabase Cron or an external scheduler. Store the job secret in the scheduler's
secret store. Do not put it in a query string.

### Kiosk Signing Contract

The kiosk signs this UTF-8 string with ECDSA P-256 and SHA-256:

```text
<unix timestamp in milliseconds>
<random nonce>
POST
/functions/v1/kiosk
<lowercase SHA-256 hex of the exact JSON request body>
```

It sends the base64url signature in `x-kiosk-signature`, along with
`x-kiosk-device-id`, `x-kiosk-nonce`, and `x-kiosk-timestamp`. The private key
should be non-exportable WebCrypto key material held by the kiosk browser.

Enrollment is a three-step operation:

1. An `aal2` operations/admin user calls `kiosk` with
   `{"action":"create_enrollment", ...}`.
2. The kiosk generates its local P-256 key pair and calls
   `{"action":"redeem_enrollment","token":"...","public_key_jwk":{...}}`.
3. Subsequent scans call `{"action":"scan","token":"member-qr-token"}` with the
   signed headers above.

An `aal2` operations/admin user can revoke an enrolled device with
`{"action":"revoke_device","device_id":"...","reason":"..."}`.

## Production Checklist

1. Link the intended Supabase project and review `supabase db diff` before
   pushing migrations.
2. Enable Google OAuth, configure `https://armaturelab.org/auth/callback`, and
   configure custom SMTP for OTP email.
3. Create the first staff role through a reviewed SQL/admin operation. Never
   expose staff-role mutation to member clients.
4. Configure private resource calendars and `calendar_links`.
5. Set Edge Function secrets, deploy functions, and configure schedules.
6. Run the pgTAP suite and real two-connection concurrency test.
7. Review RLS with anonymous, pending, active, suspended, staff, kiosk, and
   service-role personas before production traffic.
