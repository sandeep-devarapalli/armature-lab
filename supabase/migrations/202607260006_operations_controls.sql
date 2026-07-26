create or replace function public.set_resource_hours(
  p_resource_id uuid,
  p_day_of_week smallint,
  p_opens_at time default null,
  p_closes_at time default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_hours_id uuid;
  v_before jsonb;
begin
  if not private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[]) then
    raise exception using errcode = '42501', message = 'operations staff role required';
  end if;

  if p_day_of_week not between 0 and 6 then
    raise exception using errcode = '22023', message = 'day of week must be between 0 and 6';
  end if;

  if (p_opens_at is null) <> (p_closes_at is null) then
    raise exception using errcode = '22023', message = 'opening and closing time must both be supplied';
  end if;

  if p_opens_at is not null and p_closes_at <= p_opens_at then
    raise exception using errcode = '22023', message = 'closing time must be after opening time';
  end if;

  perform 1 from public.resources where id = p_resource_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'resource not found';
  end if;

  select coalesce(jsonb_agg(to_jsonb(hours)), '[]'::jsonb)
  into v_before
  from public.resource_hours hours
  where hours.resource_id = p_resource_id
    and hours.day_of_week = p_day_of_week
    and hours.effective_from is null
    and hours.effective_until is null;

  delete from public.resource_hours
  where resource_id = p_resource_id
    and day_of_week = p_day_of_week
    and effective_from is null
    and effective_until is null;

  if p_opens_at is not null then
    insert into public.resource_hours (
      resource_id,
      day_of_week,
      opens_at,
      closes_at
    )
    values (
      p_resource_id,
      p_day_of_week,
      p_opens_at,
      p_closes_at
    )
    returning id into v_hours_id;
  end if;

  perform private.record_audit(
    v_staff_id,
    'staff',
    'resource.hours_updated',
    'resource',
    p_resource_id,
    v_before,
    jsonb_build_object(
      'day_of_week', p_day_of_week,
      'opens_at', p_opens_at,
      'closes_at', p_closes_at
    ),
    case when p_opens_at is null then 'closed for day' else 'base operating hours updated' end
  );

  return v_hours_id;
end;
$$;

create or replace function public.staff_set_booking_status(
  p_booking_id uuid,
  p_status public.booking_status,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_booking public.bookings;
begin
  if not private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[]) then
    raise exception using errcode = '42501', message = 'operations staff role required';
  end if;

  if p_status not in ('cancelled', 'no_show', 'completed') then
    raise exception using errcode = '22023', message = 'staff may set cancelled, no_show, or completed';
  end if;

  if char_length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception using errcode = '22023', message = 'a reason is required';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'booking not found';
  end if;

  if v_booking.status <> 'confirmed' then
    raise exception using errcode = '22023', message = 'only confirmed bookings may be closed by staff';
  end if;

  if p_status = 'no_show' and v_booking.starts_at > now() then
    raise exception using errcode = '22023', message = 'a future booking cannot be marked no-show';
  end if;

  if p_status = 'completed' and v_booking.ends_at > now() then
    raise exception using errcode = '22023', message = 'an active or future booking cannot be completed';
  end if;

  update public.bookings
  set
    status = p_status,
    cancellation_reason = case when p_status = 'cancelled' then btrim(p_reason) else cancellation_reason end,
    cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
    cancelled_by = case when p_status = 'cancelled' then v_staff_id else cancelled_by end
  where id = p_booking_id;

  update public.resource_reservations
  set released_at = now()
  where booking_id = p_booking_id and released_at is null;

  perform private.record_audit(
    v_staff_id,
    'staff',
    'booking.' || p_status::text,
    'booking',
    p_booking_id,
    to_jsonb(v_booking),
    jsonb_build_object('status', p_status),
    btrim(p_reason)
  );

  return p_booking_id;
end;
$$;

revoke all on function public.set_resource_hours(uuid, smallint, time, time) from public;
revoke all on function public.staff_set_booking_status(uuid, public.booking_status, text) from public;

grant execute on function public.set_resource_hours(uuid, smallint, time, time) to authenticated;
grant execute on function public.staff_set_booking_status(uuid, public.booking_status, text) to authenticated;
