update public.components
set slug = case id
  when '70000000-0000-4000-8000-000000000001' then 'so101-pair'
  when '70000000-0000-4000-8000-000000000002' then 'jetson-orin-nano'
  when '70000000-0000-4000-8000-000000000003' then 'lekiwi'
  when '70000000-0000-4000-8000-000000000004' then 'raspberry-pi-5'
  when '70000000-0000-4000-8000-000000000006' then 'esp32-c6'
  when '70000000-0000-4000-8000-000000000007' then 'cytron-mdd3a'
  when '70000000-0000-4000-8000-000000000011' then 'tof-8x8'
  when '70000000-0000-4000-8000-000000000019' then 'so101-g-clamp'
  else slug
end
where id in (
  '70000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000002',
  '70000000-0000-4000-8000-000000000003',
  '70000000-0000-4000-8000-000000000004',
  '70000000-0000-4000-8000-000000000006',
  '70000000-0000-4000-8000-000000000007',
  '70000000-0000-4000-8000-000000000011',
  '70000000-0000-4000-8000-000000000019'
);

create table public.component_request_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint component_request_rate_limit_hash check (
    key_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint component_request_rate_limit_count check (request_count > 0)
);

alter table public.component_request_rate_limits enable row level security;

create trigger component_request_rate_limits_set_updated_at
before update on public.component_request_rate_limits
for each row execute function private.set_updated_at();

create or replace function public.consume_component_request_rate_limit(
  p_key_hash text,
  p_limit integer default 5,
  p_window_seconds integer default 3600
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'invalid rate-limit key';
  end if;
  if p_limit < 1 or p_window_seconds < 60 then
    raise exception using errcode = '22023', message = 'invalid rate-limit policy';
  end if;

  insert into public.component_request_rate_limits (
    key_hash,
    window_started_at,
    request_count
  )
  values (p_key_hash, now(), 1)
  on conflict (key_hash) do update
  set
    window_started_at = case
      when public.component_request_rate_limits.window_started_at
        <= now() - make_interval(secs => p_window_seconds)
        then now()
      else public.component_request_rate_limits.window_started_at
    end,
    request_count = case
      when public.component_request_rate_limits.window_started_at
        <= now() - make_interval(secs => p_window_seconds)
        then 1
      else public.component_request_rate_limits.request_count + 1
    end
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

create or replace function public.set_component_request_status(
  p_request_id uuid,
  p_status public.component_request_status,
  p_decision_note text default null
)
returns public.component_request_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_before public.component_requests%rowtype;
begin
  if not private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[]) then
    raise exception using errcode = '42501', message = 'operations staff role required';
  end if;

  select *
  into v_before
  from public.component_requests
  where id = p_request_id
    and is_published
    and verified_at is not null
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'verified request not found';
  end if;

  update public.component_requests
  set
    status = p_status,
    decision_note = nullif(btrim(p_decision_note), ''),
    decided_by = case
      when p_status in ('submitted', 'under_review') then null
      else v_staff_id
    end,
    decided_at = case
      when p_status in ('submitted', 'under_review') then null
      else now()
    end
  where id = p_request_id;

  perform private.record_audit(
    v_staff_id,
    'staff',
    'component_request.status_changed',
    'component_request',
    p_request_id,
    jsonb_build_object('status', v_before.status),
    jsonb_build_object('status', p_status),
    coalesce(nullif(btrim(p_decision_note), ''), 'Staff request triage')
  );

  return p_status;
end;
$$;

create or replace view public.member_component_inventory
with (security_barrier = true)
as
select
  inventory.component_id,
  inventory.slug,
  inventory.name,
  inventory.inventory_location_id,
  inventory.location_code,
  inventory.location_name,
  inventory.unit,
  inventory.available_quantity,
  inventory.inventory_kind
from (
  select
    component.id as component_id,
    component.slug,
    component.name,
    location.id as inventory_location_id,
    location.code as location_code,
    location.name as location_name,
    component.unit,
    count(asset.id)::numeric as available_quantity,
    component.inventory_kind
  from public.components component
  join public.asset_units asset
    on asset.component_id = component.id
    and asset.status = 'available'
  join public.inventory_locations location
    on location.id = asset.inventory_location_id
    and location.active
    and location.member_visible
  where component.active
    and component.inventory_kind in ('serialized_reusable', 'reusable_tray')
  group by
    component.id,
    component.slug,
    component.name,
    component.unit,
    component.inventory_kind,
    location.id,
    location.code,
    location.name

  union all

  select
    component.id as component_id,
    component.slug,
    component.name,
    location.id as inventory_location_id,
    location.code as location_code,
    location.name as location_name,
    component.unit,
    sum(lot.quantity_on_hand) as available_quantity,
    component.inventory_kind
  from public.components component
  join public.inventory_lots lot
    on lot.component_id = component.id
    and lot.quantity_on_hand > 0
  join public.inventory_locations location
    on location.id = lot.inventory_location_id
    and location.active
    and location.member_visible
  where component.active
    and component.inventory_kind not in ('serialized_reusable', 'reusable_tray')
  group by
    component.id,
    component.slug,
    component.name,
    component.unit,
    component.inventory_kind,
    location.id,
    location.code,
    location.name
) inventory
where
  private.has_active_membership(auth.uid(), now())
  or private.is_staff(null);

create view public.member_checkout_assets
with (security_barrier = true)
as
select
  checkout.id as checkout_session_id,
  checkout.member_id,
  checkout.status as checkout_status,
  checkout.opened_at,
  checkout.checked_out_at,
  checkout.returned_at,
  movement.id as movement_id,
  movement.occurred_at,
  movement.closed_at,
  asset.id as asset_unit_id,
  asset.asset_tag,
  asset.status as asset_status,
  asset.condition_note,
  component.slug as component_slug,
  component.name as component_name,
  location.id as inventory_location_id,
  location.code as location_code,
  location.name as location_name
from public.checkout_sessions checkout
join public.inventory_movements movement
  on movement.checkout_session_id = checkout.id
  and movement.movement_kind = 'checkout'
join public.asset_units asset on asset.id = movement.asset_unit_id
join public.components component on component.id = asset.component_id
join public.inventory_locations location on location.id = asset.inventory_location_id
where checkout.member_id = (select auth.uid())
  or private.is_staff(null);

create view public.member_active_cabinets
with (security_barrier = true)
as
select
  device.id,
  device.name,
  device.location_id,
  location.name as location_name,
  device.last_seen_at
from public.cabinet_devices device
join public.locations location on location.id = device.location_id
where device.status = 'active'
  and (
    private.has_active_membership(auth.uid(), now())
    or private.is_staff(null)
  );

revoke all on function public.set_component_request_status(
  uuid, public.component_request_status, text
) from public;
revoke all on function public.consume_component_request_rate_limit(
  text, integer, integer
) from public;
grant execute on function public.consume_component_request_rate_limit(
  text, integer, integer
) to service_role;
grant execute on function public.set_component_request_status(
  uuid, public.component_request_status, text
) to authenticated;

revoke all on public.member_checkout_assets from anon, authenticated;
revoke all on public.member_active_cabinets from anon, authenticated;
revoke all on public.component_request_rate_limits from anon, authenticated;
grant select on public.member_checkout_assets to authenticated;
grant select on public.member_active_cabinets to authenticated;
