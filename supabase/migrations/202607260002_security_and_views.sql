create or replace function private.is_staff(
  p_roles public.staff_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_roles sr
    where sr.user_id = (select auth.uid())
      and (p_roles is null or sr.role = any (p_roles))
  );
$$;

create or replace function private.has_active_membership(
  p_user_id uuid default auth.uid(),
  p_at timestamptz default now()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = p_user_id
      and m.status = 'active'
      and (m.starts_at is null or m.starts_at <= p_at)
      and (m.ends_at is null or m.ends_at > p_at)
  );
$$;

create or replace function private.has_valid_resource_certifications(
  p_user_id uuid,
  p_resource_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.resource_certification_requirements requirement
    where requirement.resource_id = p_resource_id
      and not exists (
        select 1
        from public.member_certifications certification
        where certification.member_id = p_user_id
          and certification.certification_type_id = requirement.certification_type_id
          and certification.status = 'active'
          and certification.issued_at <= p_starts_at
          and (certification.expires_at is null or certification.expires_at >= p_ends_at)
      )
  );
$$;

create or replace function private.record_audit(
  p_actor_user_id uuid,
  p_actor_type public.audit_actor_type,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_before_state jsonb default null,
  p_after_state jsonb default null,
  p_reason text default null
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.audit_events (
    actor_user_id,
    actor_type,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state,
    reason
  )
  values (
    p_actor_user_id,
    p_actor_type,
    p_action,
    p_entity_type,
    p_entity_id,
    p_before_state,
    p_after_state,
    p_reason
  );
$$;

revoke all on function private.is_staff(public.staff_role[]) from public;
revoke all on function private.has_active_membership(uuid, timestamptz) from public;
revoke all on function private.has_valid_resource_certifications(uuid, uuid, timestamptz, timestamptz) from public;
revoke all on function private.record_audit(uuid, public.audit_actor_type, text, text, uuid, jsonb, jsonb, text) from public;
grant execute on function private.is_staff(public.staff_role[]) to authenticated;
grant execute on function private.has_active_membership(uuid, timestamptz) to authenticated;

alter table public.profiles enable row level security;
alter table public.membership_applications enable row level security;
alter table public.memberships enable row level security;
alter table public.staff_roles enable row level security;
alter table public.certification_types enable row level security;
alter table public.member_certifications enable row level security;
alter table public.locations enable row level security;
alter table public.resources enable row level security;
alter table public.resource_hours enable row level security;
alter table public.resource_certification_requirements enable row level security;
alter table public.resource_blocks enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_guests enable row level security;
alter table public.resource_reservations enable row level security;
alter table public.kiosk_devices enable row level security;
alter table public.kiosk_enrollment_tokens enable row level security;
alter table public.kiosk_request_nonces enable row level security;
alter table public.checkin_intents enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.access_events enable row level security;
alter table public.calendar_links enable row level security;
alter table public.integration_outbox enable row level security;
alter table public.calendar_sync_state enable row level security;
alter table public.reminder_deliveries enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_self on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_self on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy profiles_staff_all on public.profiles
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy membership_applications_select_self on public.membership_applications
for select to authenticated
using ((select auth.uid()) = user_id);

create policy membership_applications_staff_all on public.membership_applications
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy memberships_select_self on public.memberships
for select to authenticated
using ((select auth.uid()) = user_id);

create policy memberships_staff_all on public.memberships
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy staff_roles_select_self on public.staff_roles
for select to authenticated
using ((select auth.uid()) = user_id);

create policy staff_roles_staff_select on public.staff_roles
for select to authenticated
using ((select private.is_staff(null)));

create policy certification_types_select_active on public.certification_types
for select to authenticated
using (active or (select private.is_staff(null)));

create policy certification_types_staff_all on public.certification_types
for all to authenticated
using ((select private.is_staff(array['safety', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['safety', 'admin', 'super_admin']::public.staff_role[])));

create policy member_certifications_select_self on public.member_certifications
for select to authenticated
using ((select auth.uid()) = member_id);

create policy member_certifications_staff_all on public.member_certifications
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy locations_select_active on public.locations
for select to authenticated
using (active or (select private.is_staff(null)));

create policy locations_staff_all on public.locations
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy resources_select_active on public.resources
for select to authenticated
using (active or (select private.is_staff(null)));

create policy resources_staff_all on public.resources
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy resource_hours_select_active on public.resource_hours
for select to authenticated
using (
  exists (
    select 1
    from public.resources resource
    where resource.id = resource_hours.resource_id
      and resource.active
  )
  or (select private.is_staff(null))
);

create policy resource_hours_staff_all on public.resource_hours
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy resource_requirements_select on public.resource_certification_requirements
for select to authenticated
using (true);

create policy resource_requirements_staff_all on public.resource_certification_requirements
for all to authenticated
using ((select private.is_staff(array['safety', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['safety', 'admin', 'super_admin']::public.staff_role[])));

create policy resource_blocks_staff_all on public.resource_blocks
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy bookings_select_self on public.bookings
for select to authenticated
using ((select auth.uid()) = member_id);

create policy bookings_staff_all on public.bookings
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy booking_guests_select_owner on public.booking_guests
for select to authenticated
using (
  exists (
    select 1
    from public.bookings booking
    where booking.id = booking_guests.booking_id
      and booking.member_id = (select auth.uid())
  )
);

create policy booking_guests_staff_all on public.booking_guests
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy resource_reservations_select_owner on public.resource_reservations
for select to authenticated
using (
  booking_id is not null
  and exists (
    select 1
    from public.bookings booking
    where booking.id = resource_reservations.booking_id
      and booking.member_id = (select auth.uid())
  )
);

create policy resource_reservations_staff_all on public.resource_reservations
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy kiosk_devices_staff_all on public.kiosk_devices
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy kiosk_enrollment_tokens_staff_all on public.kiosk_enrollment_tokens
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy kiosk_request_nonces_staff_select on public.kiosk_request_nonces
for select to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy checkin_intents_select_self on public.checkin_intents
for select to authenticated
using ((select auth.uid()) = user_id);

create policy checkin_intents_staff_select on public.checkin_intents
for select to authenticated
using ((select private.is_staff(null)));

create policy attendance_sessions_select_self on public.attendance_sessions
for select to authenticated
using ((select auth.uid()) = user_id);

create policy attendance_sessions_staff_all on public.attendance_sessions
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy access_events_select_self on public.access_events
for select to authenticated
using ((select auth.uid()) = user_id);

create policy access_events_staff_select on public.access_events
for select to authenticated
using ((select private.is_staff(null)));

create policy calendar_links_staff_all on public.calendar_links
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy integration_outbox_staff_select on public.integration_outbox
for select to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy calendar_sync_state_staff_select on public.calendar_sync_state
for select to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy reminder_deliveries_select_self on public.reminder_deliveries
for select to authenticated
using (
  exists (
    select 1
    from public.bookings booking
    where booking.id = reminder_deliveries.booking_id
      and booking.member_id = (select auth.uid())
  )
);

create policy reminder_deliveries_staff_select on public.reminder_deliveries
for select to authenticated
using ((select private.is_staff(null)));

create policy audit_events_staff_select on public.audit_events
for select to authenticated
using ((select private.is_staff(array['admin', 'super_admin']::public.staff_role[])));

create view public.public_member_profiles
with (security_barrier = true)
as
select
  profile.id,
  profile.handle,
  profile.display_name,
  profile.avatar_url,
  profile.bio,
  profile.skills,
  profile.organization,
  profile.project_links,
  profile.social_links,
  profile.created_at
from public.profiles profile
join public.memberships membership on membership.user_id = profile.id
where profile.is_public
  and profile.handle is not null
  and membership.status = 'active'
  and (membership.starts_at is null or membership.starts_at <= now())
  and (membership.ends_at is null or membership.ends_at > now());

comment on view public.public_member_profiles is
  'Deliberately owner-executed safe projection. It never exposes contact, emergency, certification, booking, or attendance data.';

create view public.public_resources
with (security_barrier = true)
as
select
  resource.id,
  resource.slug,
  resource.name,
  resource.description,
  resource.kind,
  resource.risk,
  resource.capacity,
  resource.max_guests,
  resource.guests_allowed,
  resource.reservable,
  resource.image_url,
  resource.default_duration_minutes,
  resource.increment_minutes,
  resource.max_duration_minutes,
  resource.booking_horizon_days,
  location.slug as location_slug,
  location.name as location_name,
  location.timezone
from public.resources resource
join public.locations location on location.id = resource.location_id
where resource.active and location.active;

create view public.public_resource_hours
with (security_barrier = true)
as
select
  hours.resource_id,
  hours.day_of_week,
  hours.opens_at,
  hours.closes_at,
  hours.effective_from,
  hours.effective_until
from public.resource_hours hours
join public.resources resource on resource.id = hours.resource_id
join public.locations location on location.id = resource.location_id
where resource.active and location.active;

create view public.public_resource_certifications
with (security_barrier = true)
as
select
  requirement.resource_id,
  certification.slug,
  certification.name,
  certification.description
from public.resource_certification_requirements requirement
join public.certification_types certification
  on certification.id = requirement.certification_type_id
join public.resources resource on resource.id = requirement.resource_id
where certification.active and resource.active;

revoke all on all tables in schema public from anon, authenticated;

grant select on public.public_member_profiles to anon, authenticated;
grant select on public.public_resources to anon, authenticated;
grant select on public.public_resource_hours to anon, authenticated;
grant select on public.public_resource_certifications to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.membership_applications to authenticated;
grant select on public.memberships to authenticated;
grant select on public.staff_roles to authenticated;
grant select on public.certification_types to authenticated;
grant select on public.member_certifications to authenticated;
grant select on public.locations to authenticated;
grant select on public.resources to authenticated;
grant select on public.resource_hours to authenticated;
grant select on public.resource_certification_requirements to authenticated;
grant select on public.resource_blocks to authenticated;
grant select on public.bookings to authenticated;
grant select on public.booking_guests to authenticated;
grant select on public.resource_reservations to authenticated;
grant select on public.kiosk_devices to authenticated;
grant select on public.kiosk_enrollment_tokens to authenticated;
grant select on public.kiosk_request_nonces to authenticated;
grant select on public.checkin_intents to authenticated;
grant select on public.attendance_sessions to authenticated;
grant select on public.access_events to authenticated;
grant select on public.calendar_links to authenticated;
grant select on public.integration_outbox to authenticated;
grant select on public.calendar_sync_state to authenticated;
grant select on public.reminder_deliveries to authenticated;
grant select on public.audit_events to authenticated;

grant update on public.memberships to authenticated;
grant insert, update, delete on public.certification_types to authenticated;
grant insert, update, delete on public.locations to authenticated;
grant insert, update, delete on public.resources to authenticated;
grant insert, update, delete on public.resource_hours to authenticated;
grant insert, update, delete on public.resource_certification_requirements to authenticated;
grant insert, update, delete on public.calendar_links to authenticated;
