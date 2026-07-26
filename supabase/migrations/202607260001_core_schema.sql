create schema if not exists extensions;
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

create type public.membership_application_status as enum (
  'pending',
  'approved',
  'rejected',
  'withdrawn'
);

create type public.membership_status as enum (
  'pending',
  'active',
  'suspended',
  'expired',
  'cancelled'
);

create type public.staff_role as enum (
  'operations',
  'safety',
  'admin',
  'super_admin'
);

create type public.certification_status as enum ('active', 'revoked');
create type public.resource_kind as enum (
  'workspace',
  'equipment',
  'room',
  'compute',
  'mobile_robot',
  'sensor',
  'other'
);
create type public.resource_risk as enum ('low', 'controlled', 'hazardous');
create type public.booking_status as enum (
  'tentative',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
);
create type public.reservation_kind as enum ('booking', 'block');
create type public.resource_block_kind as enum (
  'maintenance',
  'closure',
  'staff_hold'
);
create type public.kiosk_device_status as enum ('pending', 'active', 'revoked');
create type public.checkin_action as enum ('check_in', 'check_out');
create type public.checkin_intent_status as enum (
  'pending',
  'redeemed',
  'expired',
  'cancelled'
);
create type public.attendance_status as enum (
  'active',
  'closed',
  'auto_closed',
  'review'
);
create type public.access_event_type as enum (
  'check_in',
  'check_out',
  'auto_close',
  'denied',
  'staff_override',
  'kiosk_enrolled',
  'kiosk_revoked'
);
create type public.calendar_provider as enum ('google');
create type public.outbox_action as enum ('create', 'update', 'cancel', 'remind');
create type public.outbox_status as enum (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'dead_letter'
);
create type public.calendar_sync_status as enum (
  'pending',
  'synced',
  'failed',
  'deleted'
);
create type public.audit_actor_type as enum ('member', 'staff', 'kiosk', 'system');
create type public.reminder_status as enum (
  'pending',
  'processing',
  'sent',
  'failed',
  'skipped'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text,
  display_name text not null default '',
  avatar_url text,
  bio text not null default '',
  skills text[] not null default '{}',
  organization text,
  project_links jsonb not null default '[]'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  timezone text not null default 'Asia/Kolkata',
  phone text,
  emergency_contact jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_format check (
    handle is null
    or handle ~ '^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$'
  ),
  constraint profiles_display_name_length check (char_length(display_name) <= 120),
  constraint profiles_bio_length check (char_length(bio) <= 1200),
  constraint profiles_project_links_array check (jsonb_typeof(project_links) = 'array'),
  constraint profiles_social_links_object check (jsonb_typeof(social_links) = 'object'),
  constraint profiles_emergency_contact_object check (
    emergency_contact is null or jsonb_typeof(emergency_contact) = 'object'
  )
);

create unique index profiles_handle_lower_key
  on public.profiles (lower(handle))
  where handle is not null;

create table public.membership_applications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.membership_application_status not null default 'pending',
  applicant_notes text,
  decision_notes text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint membership_application_decision check (
    (status = 'pending' and decided_at is null and decided_by is null)
    or status in ('withdrawn')
    or (status in ('approved', 'rejected') and decided_at is not null and decided_by is not null)
  )
);

create unique index membership_applications_one_pending
  on public.membership_applications (user_id)
  where status = 'pending';

create table public.memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status public.membership_status not null default 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  suspended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_dates check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.staff_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.staff_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.certification_types (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  validity_days integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certification_types_slug check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint certification_types_validity check (validity_days is null or validity_days > 0)
);

create table public.member_certifications (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  certification_type_id uuid not null references public.certification_types(id) on delete restrict,
  status public.certification_status not null default 'active',
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  issued_by uuid not null references auth.users(id) on delete restrict,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  evidence_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_certifications_expiry check (expires_at is null or expires_at > issued_at),
  constraint member_certifications_revocation check (
    (status = 'active' and revoked_at is null and revoked_by is null)
    or (status = 'revoked' and revoked_at is not null and revoked_by is not null)
  )
);

create unique index member_certifications_one_active
  on public.member_certifications (member_id, certification_type_id)
  where status = 'active';

create table public.locations (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address text,
  timezone text not null default 'Asia/Kolkata',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_slug check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.resources (
  id uuid primary key default extensions.gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete restrict,
  slug text not null,
  name text not null,
  description text not null default '',
  kind public.resource_kind not null,
  risk public.resource_risk not null default 'low',
  capacity integer not null default 1,
  max_guests integer not null default 0,
  guests_allowed boolean not null default true,
  reservable boolean not null default true,
  active boolean not null default true,
  image_url text,
  default_duration_minutes integer not null default 60,
  increment_minutes integer not null default 15,
  max_duration_minutes integer not null default 240,
  booking_horizon_days integer not null default 30,
  checkin_early_minutes integer not null default 15,
  checkin_late_minutes integer not null default 30,
  checkout_grace_minutes integer not null default 30,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, slug),
  constraint resources_slug check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint resources_capacity check (capacity > 0 and max_guests >= 0 and max_guests < capacity),
  constraint resources_hazardous_guests check (
    risk <> 'hazardous' or (guests_allowed = false and max_guests = 0)
  ),
  constraint resources_booking_rules check (
    default_duration_minutes > 0
    and increment_minutes > 0
    and max_duration_minutes >= default_duration_minutes
    and booking_horizon_days > 0
    and checkin_early_minutes >= 0
    and checkin_late_minutes >= 0
    and checkout_grace_minutes >= 0
  ),
  constraint resources_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.resource_hours (
  id uuid primary key default extensions.gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  day_of_week smallint not null,
  opens_at time not null,
  closes_at time not null,
  effective_from date,
  effective_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_hours_day check (day_of_week between 0 and 6),
  constraint resource_hours_order check (closes_at > opens_at),
  constraint resource_hours_dates check (
    effective_until is null or effective_from is null or effective_until >= effective_from
  ),
  unique (resource_id, day_of_week, opens_at, effective_from)
);

create table public.resource_certification_requirements (
  resource_id uuid not null references public.resources(id) on delete cascade,
  certification_type_id uuid not null references public.certification_types(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (resource_id, certification_type_id)
);

create table public.resource_blocks (
  id uuid primary key default extensions.gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  kind public.resource_block_kind not null,
  reason text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_blocks_period check (ends_at > starts_at)
);

create table public.bookings (
  id uuid primary key default extensions.gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete restrict,
  member_id uuid not null references auth.users(id) on delete restrict,
  status public.booking_status not null default 'confirmed',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_period check (ends_at > starts_at),
  constraint bookings_cancellation check (
    (status <> 'cancelled' and cancelled_at is null)
    or (status = 'cancelled' and cancelled_at is not null and cancelled_by is not null)
  )
);

create unique index bookings_member_idempotency_key
  on public.bookings (member_id, idempotency_key)
  where idempotency_key is not null;

create table public.booking_guests (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  name text not null,
  email text,
  created_at timestamptz not null default now(),
  constraint booking_guests_name check (char_length(btrim(name)) between 1 and 120)
);

create table public.resource_reservations (
  id uuid primary key default extensions.gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  kind public.reservation_kind not null,
  booking_id uuid unique references public.bookings(id) on delete cascade,
  block_id uuid unique references public.resource_blocks(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  period tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  constraint resource_reservations_period check (ends_at > starts_at),
  constraint resource_reservations_owner check (
    (kind = 'booking' and booking_id is not null and block_id is null)
    or (kind = 'block' and block_id is not null and booking_id is null)
  ),
  constraint resource_reservations_no_overlap exclude using gist (
    resource_id with =,
    period with &&
  ) where (released_at is null)
);

create table public.kiosk_devices (
  id uuid primary key default extensions.gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  public_key_jwk jsonb,
  key_thumbprint text,
  status public.kiosk_device_status not null default 'pending',
  enrolled_at timestamptz,
  enrolled_by uuid references auth.users(id) on delete set null,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kiosk_devices_key_object check (
    public_key_jwk is null or jsonb_typeof(public_key_jwk) = 'object'
  )
);

create table public.kiosk_enrollment_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz,
  redeemed_device_id uuid references public.kiosk_devices(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint kiosk_enrollment_tokens_expiry check (expires_at > created_at)
);

create table public.kiosk_request_nonces (
  device_id uuid not null references public.kiosk_devices(id) on delete cascade,
  nonce text not null,
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (device_id, nonce)
);

create table public.checkin_intents (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  action public.checkin_action not null,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  status public.checkin_intent_status not null default 'pending',
  redeemed_at timestamptz,
  redeemed_by_device uuid references public.kiosk_devices(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint checkin_intents_expiry check (expires_at > created_at),
  constraint checkin_intents_redemption check (
    (status = 'redeemed' and redeemed_at is not null and redeemed_by_device is not null)
    or status <> 'redeemed'
  )
);

create table public.attendance_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  booking_id uuid references public.bookings(id) on delete set null,
  resource_id uuid references public.resources(id) on delete set null,
  location_id uuid not null references public.locations(id) on delete restrict,
  status public.attendance_status not null default 'active',
  checked_in_at timestamptz not null default now(),
  checked_in_by_device uuid references public.kiosk_devices(id) on delete set null,
  checked_out_at timestamptz,
  checked_out_by_device uuid references public.kiosk_devices(id) on delete set null,
  override_by uuid references auth.users(id) on delete set null,
  override_reason text,
  review_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_sessions_close check (
    (status = 'active' and checked_out_at is null)
    or (status <> 'active' and checked_out_at is not null)
  ),
  constraint attendance_sessions_review_flags check (jsonb_typeof(review_flags) = 'array')
);

create unique index attendance_sessions_one_active_user_location
  on public.attendance_sessions (user_id, location_id)
  where status = 'active';

create table public.access_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid references public.attendance_sessions(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  device_id uuid references public.kiosk_devices(id) on delete set null,
  event_type public.access_event_type not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint access_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.calendar_links (
  id uuid primary key default extensions.gen_random_uuid(),
  resource_id uuid not null unique references public.resources(id) on delete cascade,
  provider public.calendar_provider not null default 'google',
  provider_calendar_id text not null,
  timezone text not null default 'Asia/Kolkata',
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integration_outbox (
  id uuid primary key default extensions.gen_random_uuid(),
  aggregate_type text not null,
  aggregate_id uuid not null,
  action public.outbox_action not null,
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  status public.outbox_status not null default 'pending',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_outbox_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint integration_outbox_attempts check (attempt_count >= 0)
);

create table public.calendar_sync_state (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  calendar_link_id uuid not null references public.calendar_links(id) on delete cascade,
  provider_event_id text,
  provider_etag text,
  status public.calendar_sync_status not null default 'pending',
  last_synced_at timestamptz,
  last_error text,
  external_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminder_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reminder_kind text not null,
  scheduled_for timestamptz not null,
  status public.reminder_status not null default 'pending',
  attempt_count integer not null default 0,
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, reminder_kind),
  constraint reminder_deliveries_attempts check (attempt_count >= 0)
);

create table public.audit_events (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type public.audit_actor_type not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  reason text,
  ip_address inet,
  user_agent text,
  occurred_at timestamptz not null default now()
);

create index membership_applications_user_id_idx on public.membership_applications (user_id);
create index memberships_status_idx on public.memberships (status);
create index staff_roles_role_idx on public.staff_roles (role, user_id);
create index member_certifications_member_id_idx on public.member_certifications (member_id);
create index member_certifications_type_idx on public.member_certifications (certification_type_id);
create index resources_location_id_idx on public.resources (location_id);
create index resources_active_kind_idx on public.resources (active, kind);
create index resource_hours_resource_id_idx on public.resource_hours (resource_id);
create index resource_certification_requirements_type_idx
  on public.resource_certification_requirements (certification_type_id);
create index resource_blocks_resource_time_idx
  on public.resource_blocks (resource_id, starts_at, ends_at);
create index bookings_member_time_idx on public.bookings (member_id, starts_at desc);
create index bookings_resource_time_idx on public.bookings (resource_id, starts_at, ends_at);
create index bookings_status_time_idx on public.bookings (status, starts_at);
create index booking_guests_booking_id_idx on public.booking_guests (booking_id);
create index resource_reservations_resource_time_idx
  on public.resource_reservations (resource_id, starts_at, ends_at)
  where released_at is null;
create index kiosk_devices_location_id_idx on public.kiosk_devices (location_id);
create index kiosk_request_nonces_expiry_idx on public.kiosk_request_nonces (expires_at);
create index checkin_intents_user_id_idx on public.checkin_intents (user_id, created_at desc);
create index checkin_intents_expiry_idx
  on public.checkin_intents (expires_at)
  where status = 'pending';
create index attendance_sessions_user_id_idx on public.attendance_sessions (user_id, checked_in_at desc);
create index attendance_sessions_booking_id_idx on public.attendance_sessions (booking_id);
create index access_events_user_id_idx on public.access_events (user_id, occurred_at desc);
create index access_events_session_id_idx on public.access_events (session_id);
create index integration_outbox_ready_idx
  on public.integration_outbox (next_attempt_at, created_at)
  where status in ('pending', 'failed');
create index calendar_sync_state_link_idx on public.calendar_sync_state (calendar_link_id);
create index reminder_deliveries_ready_idx
  on public.reminder_deliveries (scheduled_for)
  where status in ('pending', 'failed');
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id, occurred_at desc);
create index audit_events_actor_idx on public.audit_events (actor_user_id, occurred_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger membership_applications_set_updated_at before update on public.membership_applications
for each row execute function private.set_updated_at();
create trigger memberships_set_updated_at before update on public.memberships
for each row execute function private.set_updated_at();
create trigger certification_types_set_updated_at before update on public.certification_types
for each row execute function private.set_updated_at();
create trigger member_certifications_set_updated_at before update on public.member_certifications
for each row execute function private.set_updated_at();
create trigger locations_set_updated_at before update on public.locations
for each row execute function private.set_updated_at();
create trigger resources_set_updated_at before update on public.resources
for each row execute function private.set_updated_at();
create trigger resource_hours_set_updated_at before update on public.resource_hours
for each row execute function private.set_updated_at();
create trigger resource_blocks_set_updated_at before update on public.resource_blocks
for each row execute function private.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings
for each row execute function private.set_updated_at();
create trigger kiosk_devices_set_updated_at before update on public.kiosk_devices
for each row execute function private.set_updated_at();
create trigger attendance_sessions_set_updated_at before update on public.attendance_sessions
for each row execute function private.set_updated_at();
create trigger calendar_links_set_updated_at before update on public.calendar_links
for each row execute function private.set_updated_at();
create trigger integration_outbox_set_updated_at before update on public.integration_outbox
for each row execute function private.set_updated_at();
create trigger calendar_sync_state_set_updated_at before update on public.calendar_sync_state
for each row execute function private.set_updated_at();
create trigger reminder_deliveries_set_updated_at before update on public.reminder_deliveries
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.memberships (user_id, status)
  values (new.id, 'pending')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();
