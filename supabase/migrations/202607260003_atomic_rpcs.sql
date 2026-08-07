create or replace function private.within_resource_hours(
  p_resource_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_timezone text;
  v_local_start timestamp;
  v_local_end timestamp;
begin
  select location.timezone
  into v_timezone
  from public.resources resource
  join public.locations location on location.id = resource.location_id
  where resource.id = p_resource_id;

  if v_timezone is null then
    return false;
  end if;

  v_local_start := p_starts_at at time zone v_timezone;
  v_local_end := p_ends_at at time zone v_timezone;

  if v_local_start::date <> v_local_end::date then
    return false;
  end if;

  return exists (
    select 1
    from public.resource_hours hours
    where hours.resource_id = p_resource_id
      and hours.day_of_week = extract(dow from v_local_start)::smallint
      and hours.opens_at <= v_local_start::time
      and hours.closes_at >= v_local_end::time
      and (hours.effective_from is null or hours.effective_from <= v_local_start::date)
      and (hours.effective_until is null or hours.effective_until >= v_local_start::date)
  );
end;
$$;

create or replace function private.validate_booking_request(
  p_user_id uuid,
  p_resource_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_guest_count integer
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_resource public.resources%rowtype;
  v_duration_minutes integer;
  v_start_minute bigint;
begin
  if p_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  select *
  into v_resource
  from public.resources
  where id = p_resource_id
  for share;

  if not found or not v_resource.active or not v_resource.reservable then
    raise exception using errcode = '22023', message = 'resource is not reservable';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception using errcode = '22023', message = 'booking end must be after start';
  end if;

  if p_starts_at <= now() then
    raise exception using errcode = '22023', message = 'booking must start in the future';
  end if;

  if p_starts_at > now() + make_interval(days => v_resource.booking_horizon_days) then
    raise exception using errcode = '22023', message = 'booking exceeds the resource horizon';
  end if;

  v_duration_minutes := floor(extract(epoch from (p_ends_at - p_starts_at)) / 60)::integer;
  v_start_minute := floor(extract(epoch from p_starts_at) / 60)::bigint;

  if v_duration_minutes <= 0
    or v_duration_minutes > v_resource.max_duration_minutes
    or mod(v_duration_minutes, v_resource.increment_minutes) <> 0
    or mod(v_start_minute, v_resource.increment_minutes) <> 0
  then
    raise exception using errcode = '22023', message = 'booking violates duration or increment rules';
  end if;

  if p_guest_count < 0
    or p_guest_count > v_resource.max_guests
    or p_guest_count + 1 > v_resource.capacity
    or (p_guest_count > 0 and not v_resource.guests_allowed)
  then
    raise exception using errcode = '22023', message = 'guest count exceeds resource policy';
  end if;

  if not exists (
    select 1
    from public.memberships membership
    where membership.user_id = p_user_id
      and membership.status = 'active'
      and (membership.starts_at is null or membership.starts_at <= p_starts_at)
      and (membership.ends_at is null or membership.ends_at >= p_ends_at)
  ) then
    raise exception using errcode = '42501', message = 'active membership is required';
  end if;

  if not private.has_valid_resource_certifications(
    p_user_id,
    p_resource_id,
    p_starts_at,
    p_ends_at
  ) then
    raise exception using errcode = '42501', message = 'required certification is missing or expired';
  end if;

  if not private.within_resource_hours(p_resource_id, p_starts_at, p_ends_at) then
    raise exception using errcode = '22023', message = 'booking falls outside operating hours';
  end if;
end;
$$;

create or replace function public.has_staff_role(
  p_roles public.staff_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_staff(p_roles);
$$;

create or replace function public.submit_application(
  p_display_name text,
  p_handle text,
  p_bio text default '',
  p_phone text default null,
  p_emergency_contact jsonb default null,
  p_organization text default null,
  p_skills text[] default '{}',
  p_project_links jsonb default '[]'::jsonb,
  p_social_links jsonb default '{}'::jsonb,
  p_applicant_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_application_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  if char_length(btrim(p_display_name)) < 2 then
    raise exception using errcode = '22023', message = 'display name is required';
  end if;

  if lower(p_handle) !~ '^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$' then
    raise exception using errcode = '22023', message = 'invalid profile handle';
  end if;

  if exists (
    select 1
    from public.membership_applications application
    where application.user_id = v_user_id and application.status = 'pending'
  ) then
    raise exception using errcode = '23505', message = 'a membership application is already pending';
  end if;

  update public.profiles
  set
    display_name = btrim(p_display_name),
    handle = lower(p_handle),
    bio = coalesce(p_bio, ''),
    phone = p_phone,
    emergency_contact = p_emergency_contact,
    organization = p_organization,
    skills = coalesce(p_skills, '{}'),
    project_links = coalesce(p_project_links, '[]'::jsonb),
    social_links = coalesce(p_social_links, '{}'::jsonb)
  where id = v_user_id;

  insert into public.membership_applications (user_id, applicant_notes)
  values (v_user_id, p_applicant_notes)
  returning id into v_application_id;

  insert into public.memberships (user_id, status)
  values (v_user_id, 'pending')
  on conflict (user_id) do update
  set status = case
    when public.memberships.status in ('active', 'suspended') then public.memberships.status
    else 'pending'
  end;

  perform private.record_audit(
    v_user_id,
    'member',
    'membership.application_submitted',
    'membership_application',
    v_application_id,
    null,
    jsonb_build_object('status', 'pending'),
    p_applicant_notes
  );

  return v_application_id;
end;
$$;

create or replace function public.list_availability(
  p_resource_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_duration_minutes integer default null
)
returns table (
  starts_at timestamptz,
  ends_at timestamptz,
  available boolean,
  reason text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_resource public.resources%rowtype;
  v_duration integer;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_reason text;
begin
  select *
  into v_resource
  from public.resources
  where id = p_resource_id and active and reservable;

  if not found then
    raise exception using errcode = '22023', message = 'resource is not available';
  end if;

  if p_to <= p_from or p_to - p_from > interval '31 days' then
    raise exception using errcode = '22023', message = 'availability range must be between zero and 31 days';
  end if;

  v_duration := coalesce(p_duration_minutes, v_resource.default_duration_minutes);

  if v_duration <= 0
    or v_duration > v_resource.max_duration_minutes
    or mod(v_duration, v_resource.increment_minutes) <> 0
  then
    raise exception using errcode = '22023', message = 'invalid slot duration';
  end if;

  for v_slot_start in
    select slot
    from generate_series(
      p_from,
      p_to - make_interval(mins => v_duration),
      make_interval(mins => v_resource.increment_minutes)
    ) slot
  loop
    v_slot_end := v_slot_start + make_interval(mins => v_duration);
    v_reason := null;

    if v_slot_start <= now() then
      v_reason := 'past';
    elsif v_slot_start > now() + make_interval(days => v_resource.booking_horizon_days) then
      v_reason := 'outside_horizon';
    elsif not private.within_resource_hours(p_resource_id, v_slot_start, v_slot_end) then
      v_reason := 'closed';
    elsif exists (
      select 1
      from public.resource_reservations reservation
      where reservation.resource_id = p_resource_id
        and reservation.released_at is null
        and reservation.period && tstzrange(v_slot_start, v_slot_end, '[)')
    ) then
      v_reason := 'reserved';
    end if;

    starts_at := v_slot_start;
    ends_at := v_slot_end;
    available := v_reason is null;
    reason := v_reason;
    return next;
  end loop;
end;
$$;

create or replace function public.create_booking(
  p_resource_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_guest_names text[] default '{}',
  p_notes text default null,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking_id uuid;
  v_guest_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  if p_idempotency_key is not null then
    select booking.id
    into v_booking_id
    from public.bookings booking
    where booking.member_id = v_user_id
      and booking.idempotency_key = p_idempotency_key;

    if found then
      return v_booking_id;
    end if;
  end if;

  select count(*)::integer
  into v_guest_count
  from unnest(coalesce(p_guest_names, '{}')) guest_name
  where btrim(guest_name) <> '';

  perform private.validate_booking_request(
    v_user_id,
    p_resource_id,
    p_starts_at,
    p_ends_at,
    v_guest_count
  );

  insert into public.bookings (
    resource_id,
    member_id,
    status,
    starts_at,
    ends_at,
    notes,
    idempotency_key
  )
  values (
    p_resource_id,
    v_user_id,
    'confirmed',
    p_starts_at,
    p_ends_at,
    p_notes,
    p_idempotency_key
  )
  returning id into v_booking_id;

  insert into public.booking_guests (booking_id, name)
  select v_booking_id, btrim(guest_name)
  from unnest(coalesce(p_guest_names, '{}')) guest_name
  where btrim(guest_name) <> '';

  insert into public.resource_reservations (
    resource_id,
    kind,
    booking_id,
    starts_at,
    ends_at
  )
  values (
    p_resource_id,
    'booking',
    v_booking_id,
    p_starts_at,
    p_ends_at
  );

  perform private.record_audit(
    v_user_id,
    'member',
    'booking.created',
    'booking',
    v_booking_id,
    null,
    jsonb_build_object(
      'resource_id', p_resource_id,
      'starts_at', p_starts_at,
      'ends_at', p_ends_at,
      'guest_count', v_guest_count
    )
  );

  return v_booking_id;
exception
  when exclusion_violation then
    raise exception using
      errcode = '23P01',
      message = 'resource is no longer available for that time';
end;
$$;

create or replace function public.reschedule_booking(
  p_booking_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_expected_updated_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_guest_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'booking not found';
  end if;

  if v_booking.member_id <> v_user_id and not private.is_staff(null) then
    raise exception using errcode = '42501', message = 'booking access denied';
  end if;

  if v_booking.status not in ('tentative', 'confirmed') then
    raise exception using errcode = '22023', message = 'booking cannot be rescheduled';
  end if;

  if p_expected_updated_at is not null and v_booking.updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'booking changed; reload before rescheduling';
  end if;

  select count(*)::integer
  into v_guest_count
  from public.booking_guests guest
  where guest.booking_id = p_booking_id;

  perform private.validate_booking_request(
    v_booking.member_id,
    v_booking.resource_id,
    p_starts_at,
    p_ends_at,
    v_guest_count
  );

  update public.resource_reservations
  set starts_at = p_starts_at, ends_at = p_ends_at
  where booking_id = p_booking_id and released_at is null;

  update public.bookings
  set starts_at = p_starts_at, ends_at = p_ends_at
  where id = p_booking_id;

  perform private.record_audit(
    v_user_id,
    case
      when v_user_id = v_booking.member_id then 'member'::public.audit_actor_type
      else 'staff'::public.audit_actor_type
    end,
    'booking.rescheduled',
    'booking',
    p_booking_id,
    jsonb_build_object('starts_at', v_booking.starts_at, 'ends_at', v_booking.ends_at),
    jsonb_build_object('starts_at', p_starts_at, 'ends_at', p_ends_at)
  );

  return p_booking_id;
exception
  when exclusion_violation then
    raise exception using
      errcode = '23P01',
      message = 'resource is no longer available for that time';
end;
$$;

create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'booking not found';
  end if;

  if v_booking.member_id <> v_user_id and not private.is_staff(null) then
    raise exception using errcode = '42501', message = 'booking access denied';
  end if;

  if v_booking.status = 'cancelled' then
    return p_booking_id;
  end if;

  if v_booking.status not in ('tentative', 'confirmed') then
    raise exception using errcode = '22023', message = 'booking cannot be cancelled';
  end if;

  update public.bookings
  set
    status = 'cancelled',
    cancellation_reason = nullif(btrim(p_reason), ''),
    cancelled_at = now(),
    cancelled_by = v_user_id
  where id = p_booking_id;

  update public.resource_reservations
  set released_at = now()
  where booking_id = p_booking_id and released_at is null;

  update public.reminder_deliveries
  set status = 'skipped'
  where booking_id = p_booking_id and status in ('pending', 'failed');

  perform private.record_audit(
    v_user_id,
    case
      when v_user_id = v_booking.member_id then 'member'::public.audit_actor_type
      else 'staff'::public.audit_actor_type
    end,
    'booking.cancelled',
    'booking',
    p_booking_id,
    to_jsonb(v_booking),
    jsonb_build_object('status', 'cancelled'),
    p_reason
  );

  return p_booking_id;
end;
$$;

create or replace function public.create_checkin_intent(
  p_booking_id uuid default null,
  p_action public.checkin_action default 'check_in'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_resource public.resources%rowtype;
  v_session public.attendance_sessions%rowtype;
  v_token text;
  v_intent_id uuid;
  v_expires_at timestamptz := now() + interval '60 seconds';
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  if not private.has_active_membership(v_user_id, now()) then
    raise exception using errcode = '42501', message = 'active membership is required';
  end if;

  if p_action = 'check_in' then
    if p_booking_id is null then
      raise exception using errcode = '22023', message = 'a booking is required for check-in';
    end if;

    select *
    into v_booking
    from public.bookings
    where id = p_booking_id and member_id = v_user_id and status = 'confirmed';

    if not found then
      raise exception using errcode = '42501', message = 'confirmed booking not found';
    end if;

    select *
    into v_resource
    from public.resources
    where id = v_booking.resource_id;

    if now() < v_booking.starts_at - make_interval(mins => v_resource.checkin_early_minutes)
      or now() > v_booking.starts_at + make_interval(mins => v_resource.checkin_late_minutes)
    then
      raise exception using errcode = '22023', message = 'check-in window is closed';
    end if;

    if not private.has_valid_resource_certifications(
      v_user_id,
      v_booking.resource_id,
      now(),
      v_booking.ends_at
    ) then
      raise exception using errcode = '42501', message = 'required certification is missing or expired';
    end if;
  else
    select *
    into v_session
    from public.attendance_sessions
    where user_id = v_user_id
      and status = 'active'
      and (p_booking_id is null or booking_id = p_booking_id)
    order by checked_in_at desc
    limit 1;

    if not found then
      raise exception using errcode = 'P0002', message = 'active attendance session not found';
    end if;

    p_booking_id := v_session.booking_id;
  end if;

  update public.checkin_intents
  set status = 'cancelled'
  where user_id = v_user_id and status = 'pending';

  v_token := translate(
    encode(extensions.gen_random_bytes(32), 'base64'),
    E'+/=\\n',
    '-_'
  );

  insert into public.checkin_intents (
    user_id,
    booking_id,
    action,
    token_hash,
    expires_at
  )
  values (
    v_user_id,
    p_booking_id,
    p_action,
    extensions.digest(convert_to(v_token, 'utf8'), 'sha256'),
    v_expires_at
  )
  returning id into v_intent_id;

  return jsonb_build_object(
    'intent_id', v_intent_id,
    'token', v_token,
    'action', p_action,
    'expires_at', v_expires_at
  );
end;
$$;

create or replace function public.decide_membership(
  p_application_id uuid,
  p_decision public.membership_application_status,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_application public.membership_applications%rowtype;
begin
  if not private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[]) then
    raise exception using errcode = '42501', message = 'staff role required';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception using errcode = '22023', message = 'decision must be approved or rejected';
  end if;

  select *
  into v_application
  from public.membership_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'application not found';
  end if;

  if v_application.status <> 'pending' then
    raise exception using errcode = '22023', message = 'application has already been decided';
  end if;

  update public.membership_applications
  set
    status = p_decision,
    decision_notes = p_notes,
    decided_at = now(),
    decided_by = v_staff_id
  where id = p_application_id;

  if p_decision = 'approved' then
    insert into public.memberships (
      user_id,
      status,
      starts_at,
      approved_by,
      approved_at
    )
    values (
      v_application.user_id,
      'active',
      now(),
      v_staff_id,
      now()
    )
    on conflict (user_id) do update
    set
      status = 'active',
      starts_at = coalesce(public.memberships.starts_at, now()),
      approved_by = v_staff_id,
      approved_at = now(),
      suspended_reason = null;
  else
    update public.memberships
    set status = 'cancelled'
    where user_id = v_application.user_id and status = 'pending';
  end if;

  perform private.record_audit(
    v_staff_id,
    'staff',
    'membership.' || p_decision::text,
    'membership_application',
    p_application_id,
    to_jsonb(v_application),
    jsonb_build_object('status', p_decision),
    p_notes
  );

  return p_application_id;
end;
$$;

create or replace function public.issue_certification(
  p_member_id uuid,
  p_certification_type_id uuid,
  p_expires_at timestamptz default null,
  p_evidence_path text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_certification_id uuid;
  v_validity_days integer;
begin
  if not private.is_staff(array['safety', 'admin', 'super_admin']::public.staff_role[]) then
    raise exception using errcode = '42501', message = 'safety staff role required';
  end if;

  select validity_days
  into v_validity_days
  from public.certification_types
  where id = p_certification_type_id and active;

  if not found then
    raise exception using errcode = 'P0002', message = 'certification type not found';
  end if;

  p_expires_at := coalesce(
    p_expires_at,
    case when v_validity_days is null then null else now() + make_interval(days => v_validity_days) end
  );

  if p_expires_at is not null and p_expires_at <= now() then
    raise exception using errcode = '22023', message = 'certification expiry must be in the future';
  end if;

  update public.member_certifications
  set
    status = 'revoked',
    revoked_at = now(),
    revoked_by = v_staff_id
  where member_id = p_member_id
    and certification_type_id = p_certification_type_id
    and status = 'active';

  insert into public.member_certifications (
    member_id,
    certification_type_id,
    expires_at,
    issued_by,
    evidence_path,
    notes
  )
  values (
    p_member_id,
    p_certification_type_id,
    p_expires_at,
    v_staff_id,
    p_evidence_path,
    p_notes
  )
  returning id into v_certification_id;

  perform private.record_audit(
    v_staff_id,
    'staff',
    'certification.issued',
    'member_certification',
    v_certification_id,
    null,
    jsonb_build_object(
      'member_id', p_member_id,
      'certification_type_id', p_certification_type_id,
      'expires_at', p_expires_at
    ),
    p_notes
  );

  return v_certification_id;
end;
$$;

create or replace function public.create_resource_block(
  p_resource_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_kind public.resource_block_kind,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_block_id uuid;
begin
  if not private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[]) then
    raise exception using errcode = '42501', message = 'operations staff role required';
  end if;

  if p_ends_at <= p_starts_at or char_length(btrim(p_reason)) < 3 then
    raise exception using errcode = '22023', message = 'valid block dates and reason are required';
  end if;

  insert into public.resource_blocks (
    resource_id,
    starts_at,
    ends_at,
    kind,
    reason,
    created_by
  )
  values (
    p_resource_id,
    p_starts_at,
    p_ends_at,
    p_kind,
    btrim(p_reason),
    v_staff_id
  )
  returning id into v_block_id;

  insert into public.resource_reservations (
    resource_id,
    kind,
    block_id,
    starts_at,
    ends_at
  )
  values (
    p_resource_id,
    'block',
    v_block_id,
    p_starts_at,
    p_ends_at
  );

  perform private.record_audit(
    v_staff_id,
    'staff',
    'resource.block_created',
    'resource_block',
    v_block_id,
    null,
    jsonb_build_object(
      'resource_id', p_resource_id,
      'starts_at', p_starts_at,
      'ends_at', p_ends_at,
      'kind', p_kind
    ),
    p_reason
  );

  return v_block_id;
exception
  when exclusion_violation then
    raise exception using
      errcode = '23P01',
      message = 'resource has an active booking or block during that time';
end;
$$;

create or replace function public.staff_override_attendance(
  p_user_id uuid,
  p_booking_id uuid,
  p_action public.checkin_action,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_location_id uuid;
  v_session_id uuid;
begin
  if not private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[]) then
    raise exception using errcode = '42501', message = 'operations staff role required';
  end if;

  if coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then
    raise exception using errcode = '42501', message = 'MFA assurance level 2 is required';
  end if;

  if char_length(btrim(p_reason)) < 8 then
    raise exception using errcode = '22023', message = 'a detailed override reason is required';
  end if;

  if p_action = 'check_in' then
    select *
    into v_booking
    from public.bookings
    where id = p_booking_id and member_id = p_user_id;

    if not found then
      raise exception using errcode = 'P0002', message = 'member booking not found';
    end if;

    select location_id into v_location_id
    from public.resources where id = v_booking.resource_id;

    insert into public.attendance_sessions (
      user_id,
      booking_id,
      resource_id,
      location_id,
      override_by,
      override_reason,
      review_flags
    )
    values (
      p_user_id,
      p_booking_id,
      v_booking.resource_id,
      v_location_id,
      v_staff_id,
      btrim(p_reason),
      '["staff_override"]'::jsonb
    )
    returning id into v_session_id;
  else
    update public.attendance_sessions
    set
      status = 'closed',
      checked_out_at = now(),
      override_by = v_staff_id,
      override_reason = btrim(p_reason),
      review_flags = review_flags || '["staff_override"]'::jsonb
    where id = (
      select session.id
      from public.attendance_sessions session
      where session.user_id = p_user_id
        and session.status = 'active'
        and (p_booking_id is null or session.booking_id = p_booking_id)
      order by session.checked_in_at desc
      limit 1
      for update
    )
    returning id into v_session_id;

    if v_session_id is null then
      raise exception using errcode = 'P0002', message = 'active attendance session not found';
    end if;
  end if;

  insert into public.access_events (
    user_id,
    session_id,
    booking_id,
    event_type,
    reason,
    metadata
  )
  values (
    p_user_id,
    v_session_id,
    p_booking_id,
    'staff_override',
    btrim(p_reason),
    jsonb_build_object('staff_id', v_staff_id, 'action', p_action)
  );

  perform private.record_audit(
    v_staff_id,
    'staff',
    'attendance.staff_override',
    'attendance_session',
    v_session_id,
    null,
    jsonb_build_object('action', p_action, 'member_id', p_user_id),
    p_reason
  );

  return v_session_id;
end;
$$;

create or replace function private.enqueue_booking_operations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action public.outbox_action;
  v_key text;
begin
  if tg_op = 'INSERT' and new.status = 'confirmed' then
    v_action := 'create';
  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    v_action := 'cancel';
  elsif tg_op = 'UPDATE'
    and new.status = 'confirmed'
    and (
      old.starts_at is distinct from new.starts_at
      or old.ends_at is distinct from new.ends_at
      or old.resource_id is distinct from new.resource_id
    )
  then
    v_action := 'update';
  else
    return new;
  end if;

  v_key := concat(
    'booking:',
    new.id,
    ':',
    v_action,
    ':',
    to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS')
  );

  insert into public.integration_outbox (
    aggregate_type,
    aggregate_id,
    action,
    idempotency_key,
    payload
  )
  values (
    'booking',
    new.id,
    v_action,
    v_key,
    jsonb_build_object(
      'booking_id', new.id,
      'resource_id', new.resource_id,
      'member_id', new.member_id,
      'status', new.status,
      'starts_at', new.starts_at,
      'ends_at', new.ends_at
    )
  );

  if new.status = 'confirmed' then
    if new.starts_at - interval '24 hours' > now() then
      insert into public.reminder_deliveries (
        booking_id,
        reminder_kind,
        scheduled_for
      )
      values (new.id, '24_hours', new.starts_at - interval '24 hours')
      on conflict (booking_id, reminder_kind) do update
      set scheduled_for = excluded.scheduled_for, status = 'pending', last_error = null;
    end if;

    if new.starts_at - interval '1 hour' > now() then
      insert into public.reminder_deliveries (
        booking_id,
        reminder_kind,
        scheduled_for
      )
      values (new.id, '1_hour', new.starts_at - interval '1 hour')
      on conflict (booking_id, reminder_kind) do update
      set scheduled_for = excluded.scheduled_for, status = 'pending', last_error = null;
    end if;
  end if;

  return new;
end;
$$;

create trigger bookings_enqueue_operations
after insert or update of status, starts_at, ends_at, resource_id
on public.bookings
for each row execute function private.enqueue_booking_operations();

create or replace function public.redeem_checkin_intent(
  p_token_hash_hex text,
  p_device_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_device public.kiosk_devices%rowtype;
  v_intent public.checkin_intents%rowtype;
  v_booking public.bookings%rowtype;
  v_resource public.resources%rowtype;
  v_session_id uuid;
begin
  select *
  into v_device
  from public.kiosk_devices
  where id = p_device_id and status = 'active'
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'kiosk device is not active';
  end if;

  update public.checkin_intents
  set status = 'expired'
  where token_hash = decode(p_token_hash_hex, 'hex')
    and status = 'pending'
    and expires_at <= now();

  update public.checkin_intents
  set
    status = 'redeemed',
    redeemed_at = now(),
    redeemed_by_device = p_device_id
  where id = (
    select intent.id
    from public.checkin_intents intent
    where intent.token_hash = decode(p_token_hash_hex, 'hex')
      and intent.status = 'pending'
      and intent.expires_at > now()
    for update skip locked
  )
  returning * into v_intent;

  if not found then
    raise exception using errcode = '22023', message = 'check-in token is expired, invalid, or already used';
  end if;

  if not private.has_active_membership(v_intent.user_id, now()) then
    raise exception using errcode = '42501', message = 'membership is not active';
  end if;

  if v_intent.action = 'check_in' then
    select *
    into v_booking
    from public.bookings
    where id = v_intent.booking_id
      and member_id = v_intent.user_id
      and status = 'confirmed'
    for update;

    if not found then
      raise exception using errcode = '42501', message = 'confirmed booking not found';
    end if;

    select *
    into v_resource
    from public.resources
    where id = v_booking.resource_id;

    if v_resource.location_id <> v_device.location_id then
      raise exception using errcode = '42501', message = 'booking belongs to another location';
    end if;

    if now() < v_booking.starts_at - make_interval(mins => v_resource.checkin_early_minutes)
      or now() > v_booking.starts_at + make_interval(mins => v_resource.checkin_late_minutes)
    then
      raise exception using errcode = '22023', message = 'check-in window is closed';
    end if;

    if not private.has_valid_resource_certifications(
      v_intent.user_id,
      v_booking.resource_id,
      now(),
      v_booking.ends_at
    ) then
      raise exception using errcode = '42501', message = 'required certification is missing or expired';
    end if;

    insert into public.attendance_sessions (
      user_id,
      booking_id,
      resource_id,
      location_id,
      checked_in_by_device
    )
    values (
      v_intent.user_id,
      v_booking.id,
      v_booking.resource_id,
      v_device.location_id,
      p_device_id
    )
    returning id into v_session_id;

    insert into public.access_events (
      user_id,
      session_id,
      booking_id,
      device_id,
      event_type
    )
    values (
      v_intent.user_id,
      v_session_id,
      v_booking.id,
      p_device_id,
      'check_in'
    );
  else
    update public.attendance_sessions
    set
      status = 'closed',
      checked_out_at = now(),
      checked_out_by_device = p_device_id
    where id = (
      select session.id
      from public.attendance_sessions session
      where session.user_id = v_intent.user_id
        and session.location_id = v_device.location_id
        and session.status = 'active'
        and (v_intent.booking_id is null or session.booking_id = v_intent.booking_id)
      order by session.checked_in_at desc
      limit 1
      for update
    )
    returning id into v_session_id;

    if v_session_id is null then
      raise exception using errcode = 'P0002', message = 'active attendance session not found';
    end if;

    insert into public.access_events (
      user_id,
      session_id,
      booking_id,
      device_id,
      event_type
    )
    values (
      v_intent.user_id,
      v_session_id,
      v_intent.booking_id,
      p_device_id,
      'check_out'
    );
  end if;

  update public.kiosk_devices
  set last_seen_at = now()
  where id = p_device_id;

  perform private.record_audit(
    null,
    'kiosk',
    'attendance.' || v_intent.action::text,
    'attendance_session',
    v_session_id,
    null,
    jsonb_build_object(
      'member_id', v_intent.user_id,
      'booking_id', v_intent.booking_id,
      'device_id', p_device_id
    )
  );

  return jsonb_build_object(
    'session_id', v_session_id,
    'action', v_intent.action,
    'member_id', v_intent.user_id,
    'booking_id', v_intent.booking_id,
    'processed_at', now()
  );
end;
$$;

create or replace function public.create_kiosk_enrollment(
  p_location_id uuid,
  p_name text,
  p_created_by uuid,
  p_token_hash_hex text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1
    from public.staff_roles role
    where role.user_id = p_created_by
      and role.role in ('operations', 'admin', 'super_admin')
  ) then
    raise exception using errcode = '42501', message = 'operations staff role required';
  end if;

  if p_expires_at <= now() or p_expires_at > now() + interval '15 minutes' then
    raise exception using errcode = '22023', message = 'enrollment expiry must be within 15 minutes';
  end if;

  insert into public.kiosk_enrollment_tokens (
    location_id,
    name,
    token_hash,
    expires_at,
    created_by
  )
  values (
    p_location_id,
    btrim(p_name),
    decode(p_token_hash_hex, 'hex'),
    p_expires_at,
    p_created_by
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.redeem_kiosk_enrollment(
  p_token_hash_hex text,
  p_public_key_jwk jsonb,
  p_key_thumbprint text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enrollment public.kiosk_enrollment_tokens%rowtype;
  v_device_id uuid;
begin
  select *
  into v_enrollment
  from public.kiosk_enrollment_tokens
  where token_hash = decode(p_token_hash_hex, 'hex')
  for update;

  if not found
    or v_enrollment.redeemed_at is not null
    or v_enrollment.expires_at <= now()
  then
    raise exception using errcode = '22023', message = 'enrollment token is expired, invalid, or already used';
  end if;

  if jsonb_typeof(p_public_key_jwk) <> 'object'
    or p_public_key_jwk ->> 'kty' <> 'EC'
    or p_public_key_jwk ->> 'crv' <> 'P-256'
    or p_public_key_jwk ->> 'x' is null
    or p_public_key_jwk ->> 'y' is null
    or p_public_key_jwk ? 'd'
  then
    raise exception using errcode = '22023', message = 'a P-256 public key is required';
  end if;

  insert into public.kiosk_devices (
    location_id,
    name,
    public_key_jwk,
    key_thumbprint,
    status,
    enrolled_at,
    enrolled_by
  )
  values (
    v_enrollment.location_id,
    v_enrollment.name,
    p_public_key_jwk,
    p_key_thumbprint,
    'active',
    now(),
    v_enrollment.created_by
  )
  returning id into v_device_id;

  update public.kiosk_enrollment_tokens
  set redeemed_at = now(), redeemed_device_id = v_device_id
  where id = v_enrollment.id;

  insert into public.access_events (device_id, event_type, metadata)
  values (
    v_device_id,
    'kiosk_enrolled',
    jsonb_build_object('location_id', v_enrollment.location_id)
  );

  return jsonb_build_object(
    'device_id', v_device_id,
    'location_id', v_enrollment.location_id,
    'name', v_enrollment.name
  );
end;
$$;

create or replace function public.claim_integration_outbox(
  p_worker text,
  p_limit integer default 20
)
returns setof public.integration_outbox
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with claimed as (
    select outbox.id
    from public.integration_outbox outbox
    where outbox.status in ('pending', 'failed')
      and outbox.next_attempt_at <= now()
    order by outbox.created_at
    limit least(greatest(p_limit, 1), 100)
    for update skip locked
  )
  update public.integration_outbox outbox
  set
    status = 'processing',
    attempt_count = outbox.attempt_count + 1,
    locked_at = now(),
    locked_by = p_worker,
    last_error = null
  from claimed
  where outbox.id = claimed.id
  returning outbox.*;
end;
$$;

create or replace function public.complete_integration_outbox(
  p_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.integration_outbox
  set
    status = 'succeeded',
    processed_at = now(),
    locked_at = null,
    locked_by = null,
    last_error = null
  where id = p_id;
$$;

create or replace function public.fail_integration_outbox(
  p_id uuid,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.integration_outbox
  set
    status = case
      when attempt_count >= 8 then 'dead_letter'::public.outbox_status
      else 'failed'::public.outbox_status
    end,
    next_attempt_at = now() + make_interval(
      secs => least(21600, (power(2, greatest(attempt_count, 1)) * 60)::integer)
    ),
    locked_at = null,
    locked_by = null,
    last_error = left(p_error, 4000)
  where id = p_id;
end;
$$;

revoke all on function private.within_resource_hours(uuid, timestamptz, timestamptz) from public;
revoke all on function private.validate_booking_request(uuid, uuid, timestamptz, timestamptz, integer) from public;
revoke all on function public.has_staff_role(public.staff_role[]) from public;
revoke all on function public.submit_application(text, text, text, text, jsonb, text, text[], jsonb, jsonb, text) from public;
revoke all on function public.list_availability(uuid, timestamptz, timestamptz, integer) from public;
revoke all on function public.create_booking(uuid, timestamptz, timestamptz, text[], text, text) from public;
revoke all on function public.reschedule_booking(uuid, timestamptz, timestamptz, timestamptz) from public;
revoke all on function public.cancel_booking(uuid, text) from public;
revoke all on function public.create_checkin_intent(uuid, public.checkin_action) from public;
revoke all on function public.decide_membership(uuid, public.membership_application_status, text) from public;
revoke all on function public.issue_certification(uuid, uuid, timestamptz, text, text) from public;
revoke all on function public.create_resource_block(uuid, timestamptz, timestamptz, public.resource_block_kind, text) from public;
revoke all on function public.staff_override_attendance(uuid, uuid, public.checkin_action, text) from public;
revoke all on function public.redeem_checkin_intent(text, uuid) from public;
revoke all on function public.create_kiosk_enrollment(uuid, text, uuid, text, timestamptz) from public;
revoke all on function public.redeem_kiosk_enrollment(text, jsonb, text) from public;
revoke all on function public.claim_integration_outbox(text, integer) from public;
revoke all on function public.complete_integration_outbox(uuid) from public;
revoke all on function public.fail_integration_outbox(uuid, text) from public;

grant execute on function public.has_staff_role(public.staff_role[]) to authenticated;
grant execute on function public.submit_application(text, text, text, text, jsonb, text, text[], jsonb, jsonb, text) to authenticated;
grant execute on function public.list_availability(uuid, timestamptz, timestamptz, integer) to anon, authenticated;
grant execute on function public.create_booking(uuid, timestamptz, timestamptz, text[], text, text) to authenticated;
grant execute on function public.reschedule_booking(uuid, timestamptz, timestamptz, timestamptz) to authenticated;
grant execute on function public.cancel_booking(uuid, text) to authenticated;
grant execute on function public.create_checkin_intent(uuid, public.checkin_action) to authenticated;
grant execute on function public.decide_membership(uuid, public.membership_application_status, text) to authenticated;
grant execute on function public.issue_certification(uuid, uuid, timestamptz, text, text) to authenticated;
grant execute on function public.create_resource_block(uuid, timestamptz, timestamptz, public.resource_block_kind, text) to authenticated;
grant execute on function public.staff_override_attendance(uuid, uuid, public.checkin_action, text) to authenticated;

grant execute on function public.redeem_checkin_intent(text, uuid) to service_role;
grant execute on function public.create_kiosk_enrollment(uuid, text, uuid, text, timestamptz) to service_role;
grant execute on function public.redeem_kiosk_enrollment(text, jsonb, text) to service_role;
grant execute on function public.claim_integration_outbox(text, integer) to service_role;
grant execute on function public.complete_integration_outbox(uuid) to service_role;
grant execute on function public.fail_integration_outbox(uuid, text) to service_role;
