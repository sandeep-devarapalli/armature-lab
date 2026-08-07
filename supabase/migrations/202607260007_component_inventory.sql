create type public.component_inventory_kind as enum (
  'fixed_bookable',
  'serialized_reusable',
  'reusable_tray',
  'consumable'
);
create type public.component_requirement_kind as enum (
  'required',
  'optional',
  'alternative'
);
create type public.component_offer_status as enum (
  'in_stock',
  'limited',
  'out_of_stock',
  'validate_before_po',
  'unknown'
);
create type public.component_request_status as enum (
  'submitted',
  'under_review',
  'approved',
  'ordered',
  'available',
  'declined'
);
create type public.component_request_urgency as enum (
  'nice_to_have',
  'soon',
  'project_blocking',
  'safety'
);
create type public.component_request_budget as enum (
  'under_2500',
  '2500_to_10000',
  '10000_to_50000',
  'over_50000',
  'unknown'
);
create type public.asset_unit_status as enum (
  'available',
  'checked_out',
  'maintenance',
  'retired',
  'lost'
);
create type public.checkout_session_status as enum (
  'open',
  'checked_out',
  'returned',
  'cancelled',
  'review'
);
create type public.inventory_movement_kind as enum (
  'stock_adjustment',
  'checkout',
  'return',
  'cabinet_observation',
  'correction'
);
create type public.inventory_evidence_kind as enum (
  'checkout',
  'return',
  'cabinet',
  'discrepancy'
);
create type public.inventory_evidence_retention as enum ('routine', 'flagged');
create type public.cabinet_device_status as enum ('pending', 'active', 'revoked');
create type public.cabinet_access_intent_status as enum (
  'pending',
  'redeemed',
  'expired',
  'cancelled'
);
create type public.cabinet_event_kind as enum (
  'access_granted',
  'access_denied',
  'door_opened',
  'door_closed',
  'rfid_observed',
  'weight_observed',
  'evidence_captured',
  'reconciliation_required'
);

create table public.components (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  category text not null,
  inventory_kind public.component_inventory_kind not null,
  unit text not null default 'unit',
  target_quantity numeric(12, 3) not null default 0,
  reorder_threshold numeric(12, 3) not null default 0,
  safety_notes text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint components_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint components_name_length check (char_length(btrim(name)) between 2 and 160),
  constraint components_category_length check (char_length(btrim(category)) between 2 and 80),
  constraint components_quantities_nonnegative check (
    target_quantity >= 0 and reorder_threshold >= 0
  ),
  constraint components_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.component_offers (
  id uuid primary key default extensions.gen_random_uuid(),
  component_id uuid not null references public.components(id) on delete cascade,
  vendor_name text not null,
  variant text not null default 'Standard',
  sku text,
  manufacturer_part_number text,
  order_url text not null,
  display_price_inr numeric(14, 2),
  price_inr_including_gst numeric(14, 2),
  price_inr_excluding_gst numeric(14, 2),
  gst_rate numeric(5, 2),
  stock_status public.component_offer_status not null default 'unknown',
  checked_on date not null,
  warranty_note text,
  is_preferred boolean not null default false,
  requires_validation boolean not null default false,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint component_offers_vendor_length check (
    char_length(btrim(vendor_name)) between 2 and 120
  ),
  constraint component_offers_url_https check (order_url ~ '^https://'),
  constraint component_offers_prices_positive check (
    (display_price_inr is null or display_price_inr > 0)
    and (price_inr_including_gst is null or price_inr_including_gst > 0)
    and (price_inr_excluding_gst is null or price_inr_excluding_gst > 0)
    and (gst_rate is null or gst_rate between 0 and 100)
  ),
  unique (component_id, vendor_name, variant)
);

create table public.project_components (
  project_slug text not null,
  component_id uuid not null references public.components(id) on delete cascade,
  requirement_kind public.component_requirement_kind not null,
  quantity_per_build numeric(12, 3),
  notes text,
  created_at timestamptz not null default now(),
  primary key (project_slug, component_id, requirement_kind),
  constraint project_components_slug_format check (
    project_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint project_components_quantity_positive check (
    quantity_per_build is null or quantity_per_build > 0
  )
);

create table public.inventory_locations (
  id uuid primary key default extensions.gen_random_uuid(),
  lab_location_id uuid references public.locations(id) on delete restrict,
  parent_id uuid references public.inventory_locations(id) on delete restrict,
  code text not null unique,
  name text not null,
  description text,
  member_visible boolean not null default true,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_locations_code_format check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  constraint inventory_locations_name_length check (char_length(btrim(name)) between 2 and 120),
  constraint inventory_locations_not_own_parent check (parent_id is null or parent_id <> id),
  constraint inventory_locations_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.inventory_lots (
  id uuid primary key default extensions.gen_random_uuid(),
  component_id uuid not null references public.components(id) on delete restrict,
  inventory_location_id uuid not null references public.inventory_locations(id) on delete restrict,
  component_offer_id uuid references public.component_offers(id) on delete set null,
  lot_code text not null unique,
  quantity_on_hand numeric(12, 3) not null default 0,
  received_at timestamptz,
  expires_at timestamptz,
  unit_cost_inr numeric(14, 2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_lots_quantity_nonnegative check (quantity_on_hand >= 0),
  constraint inventory_lots_cost_nonnegative check (unit_cost_inr is null or unit_cost_inr >= 0),
  constraint inventory_lots_expiry_after_receipt check (
    expires_at is null or received_at is null or expires_at > received_at
  ),
  constraint inventory_lots_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.asset_units (
  id uuid primary key default extensions.gen_random_uuid(),
  component_id uuid not null references public.components(id) on delete restrict,
  inventory_lot_id uuid references public.inventory_lots(id) on delete set null,
  inventory_location_id uuid not null references public.inventory_locations(id) on delete restrict,
  asset_tag text not null unique,
  serial_number text,
  rfid_epc text,
  status public.asset_unit_status not null default 'available',
  condition_note text,
  acquired_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asset_units_tag_format check (
    asset_tag ~ '^ARM-[A-Z0-9]{2,8}-[0-9]{6}$'
  ),
  constraint asset_units_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create unique index asset_units_serial_number_key
  on public.asset_units (serial_number)
  where serial_number is not null;
create unique index asset_units_rfid_epc_key
  on public.asset_units (rfid_epc)
  where rfid_epc is not null;
create index asset_units_component_location_status_idx
  on public.asset_units (component_id, inventory_location_id, status);

create table public.component_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  requester_user_id uuid references auth.users(id) on delete set null,
  requester_email text not null,
  component_name text not null,
  vendor_url text,
  project_use_case text not null,
  requested_quantity integer not null default 1,
  urgency public.component_request_urgency not null default 'nice_to_have',
  budget_band public.component_request_budget not null default 'unknown',
  notes text,
  status public.component_request_status not null default 'submitted',
  verification_token_hash bytea,
  verification_expires_at timestamptz,
  verified_at timestamptz,
  is_published boolean not null default false,
  decision_note text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint component_requests_email_shape check (
    requester_email = lower(btrim(requester_email))
    and requester_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint component_requests_name_length check (
    char_length(btrim(component_name)) between 2 and 160
  ),
  constraint component_requests_use_case_length check (
    char_length(btrim(project_use_case)) between 10 and 2000
  ),
  constraint component_requests_quantity_positive check (
    requested_quantity between 1 and 1000
  ),
  constraint component_requests_vendor_url_https check (
    vendor_url is null or vendor_url ~ '^https://'
  ),
  constraint component_requests_verification_contract check (
    (
      verified_at is null
      and is_published = false
      and verification_token_hash is not null
      and verification_expires_at is not null
    )
    or (
      verified_at is not null
      and verification_token_hash is null
      and is_published = true
    )
  ),
  constraint component_requests_decision_contract check (
    (status in ('submitted', 'under_review') and decided_at is null and decided_by is null)
    or (status in ('approved', 'ordered', 'available', 'declined') and decided_at is not null)
  )
);

create unique index component_requests_verification_token_key
  on public.component_requests (verification_token_hash)
  where verification_token_hash is not null;
create index component_requests_published_status_idx
  on public.component_requests (status, created_at desc)
  where is_published;

create table public.component_request_votes (
  request_id uuid not null references public.component_requests(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, member_id)
);

create index component_request_votes_member_idx
  on public.component_request_votes (member_id, created_at desc);

create table public.checkout_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete restrict,
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  status public.checkout_session_status not null default 'open',
  idempotency_key text not null,
  opened_at timestamptz not null default now(),
  checked_out_at timestamptz,
  returned_at timestamptz,
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, idempotency_key),
  constraint checkout_sessions_idempotency_length check (
    char_length(btrim(idempotency_key)) between 8 and 120
  ),
  constraint checkout_sessions_timestamps check (
    (status = 'open' and checked_out_at is null and returned_at is null)
    or (status = 'checked_out' and checked_out_at is not null and returned_at is null)
    or (status = 'returned' and checked_out_at is not null and returned_at is not null)
    or status in ('cancelled', 'review')
  )
);

create unique index checkout_sessions_one_active_per_member
  on public.checkout_sessions (member_id)
  where status in ('open', 'checked_out');
create index checkout_sessions_attendance_active_idx
  on public.checkout_sessions (attendance_session_id)
  where status in ('open', 'checked_out');

create table public.inventory_movements (
  id uuid primary key default extensions.gen_random_uuid(),
  component_id uuid not null references public.components(id) on delete restrict,
  inventory_lot_id uuid references public.inventory_lots(id) on delete restrict,
  asset_unit_id uuid references public.asset_units(id) on delete restrict,
  checkout_session_id uuid references public.checkout_sessions(id) on delete restrict,
  movement_kind public.inventory_movement_kind not null,
  quantity_delta numeric(12, 3),
  actor_user_id uuid references auth.users(id) on delete set null,
  source text not null default 'pwa',
  notes text,
  occurred_at timestamptz not null default now(),
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint inventory_movements_target check (
    (asset_unit_id is not null and inventory_lot_id is null and quantity_delta is null)
    or (asset_unit_id is null and inventory_lot_id is not null and quantity_delta is not null)
  ),
  constraint inventory_movements_checkout_contract check (
    (
      movement_kind in ('checkout', 'return')
      and asset_unit_id is not null
      and checkout_session_id is not null
    )
    or movement_kind not in ('checkout', 'return')
  ),
  constraint inventory_movements_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create unique index inventory_movements_asset_active_checkout
  on public.inventory_movements (asset_unit_id)
  where movement_kind = 'checkout' and closed_at is null;
create index inventory_movements_session_idx
  on public.inventory_movements (checkout_session_id, occurred_at);
create index inventory_movements_lot_idx
  on public.inventory_movements (inventory_lot_id, occurred_at);

create table public.inventory_evidence (
  id uuid primary key default extensions.gen_random_uuid(),
  checkout_session_id uuid not null references public.checkout_sessions(id) on delete restrict,
  inventory_movement_id uuid references public.inventory_movements(id) on delete set null,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  evidence_kind public.inventory_evidence_kind not null,
  storage_path text not null unique,
  retention_class public.inventory_evidence_retention not null default 'routine',
  captured_at timestamptz not null default now(),
  retain_until timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint inventory_evidence_storage_path check (
    storage_path !~ '(^|/)\.\.?(/|$)'
    and storage_path ~ '^[0-9a-f-]+/[0-9a-f-]+/'
  ),
  constraint inventory_evidence_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint inventory_evidence_retention_period check (
    (retention_class = 'routine' and retain_until >= captured_at + interval '30 days')
    or (retention_class = 'flagged' and retain_until >= captured_at + interval '180 days')
  )
);

create index inventory_evidence_retention_idx
  on public.inventory_evidence (retain_until);
create index inventory_evidence_checkout_idx
  on public.inventory_evidence (checkout_session_id, captured_at desc);

create table public.cabinet_devices (
  id uuid primary key default extensions.gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete restrict,
  name text not null,
  public_key_jwk jsonb not null,
  key_thumbprint text not null unique,
  status public.cabinet_device_status not null default 'pending',
  last_seen_at timestamptz,
  enrolled_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cabinet_devices_name_length check (char_length(btrim(name)) between 2 and 120),
  constraint cabinet_devices_public_key_object check (jsonb_typeof(public_key_jwk) = 'object'),
  constraint cabinet_devices_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.cabinet_access_intents (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  cabinet_device_id uuid not null references public.cabinet_devices(id) on delete cascade,
  token_hash bytea not null unique,
  status public.cabinet_access_intent_status not null default 'pending',
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint cabinet_access_intents_expiry check (expires_at > created_at),
  constraint cabinet_access_intents_redemption check (
    (status = 'redeemed' and redeemed_at is not null)
    or (status <> 'redeemed' and redeemed_at is null)
  )
);

create unique index cabinet_access_intents_one_pending
  on public.cabinet_access_intents (member_id, cabinet_device_id)
  where status = 'pending';

create table public.cabinet_events (
  id uuid primary key default extensions.gen_random_uuid(),
  cabinet_device_id uuid not null references public.cabinet_devices(id) on delete restrict,
  access_intent_id uuid references public.cabinet_access_intents(id) on delete set null,
  checkout_session_id uuid references public.checkout_sessions(id) on delete set null,
  event_key text not null,
  event_kind public.cabinet_event_kind not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  unique (cabinet_device_id, event_key),
  constraint cabinet_events_key_length check (char_length(btrim(event_key)) between 8 and 160),
  constraint cabinet_events_payload_object check (jsonb_typeof(payload) = 'object')
);

create index cabinet_events_device_time_idx
  on public.cabinet_events (cabinet_device_id, occurred_at desc);
create index project_components_component_idx
  on public.project_components (component_id, project_slug);
create index inventory_locations_lab_location_idx
  on public.inventory_locations (lab_location_id)
  where active;
create index inventory_lots_component_location_idx
  on public.inventory_lots (component_id, inventory_location_id);

create trigger components_set_updated_at before update on public.components
for each row execute function private.set_updated_at();
create trigger component_offers_set_updated_at before update on public.component_offers
for each row execute function private.set_updated_at();
create trigger inventory_locations_set_updated_at before update on public.inventory_locations
for each row execute function private.set_updated_at();
create trigger inventory_lots_set_updated_at before update on public.inventory_lots
for each row execute function private.set_updated_at();
create trigger asset_units_set_updated_at before update on public.asset_units
for each row execute function private.set_updated_at();
create trigger component_requests_set_updated_at before update on public.component_requests
for each row execute function private.set_updated_at();
create trigger checkout_sessions_set_updated_at before update on public.checkout_sessions
for each row execute function private.set_updated_at();
create trigger cabinet_devices_set_updated_at before update on public.cabinet_devices
for each row execute function private.set_updated_at();

create or replace function private.set_inventory_evidence_retention()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.retain_until := new.captured_at
    + case
        when new.retention_class = 'flagged' then interval '180 days'
        else interval '30 days'
      end;
  return new;
end;
$$;

create trigger inventory_evidence_set_retention
before insert or update of captured_at, retention_class
on public.inventory_evidence
for each row execute function private.set_inventory_evidence_retention();

create or replace function private.guard_attendance_with_open_holdings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'active'
    and new.status <> 'active'
    and exists (
      select 1
      from public.checkout_sessions checkout
      where checkout.attendance_session_id = old.id
        and checkout.status in ('open', 'checked_out')
    )
  then
    raise exception using
      errcode = '23514',
      message = 'attendance cannot close while lab-only inventory holdings are open';
  end if;

  return new;
end;
$$;

create trigger attendance_sessions_guard_open_holdings
before update of status on public.attendance_sessions
for each row execute function private.guard_attendance_with_open_holdings();

alter table public.components enable row level security;
alter table public.component_offers enable row level security;
alter table public.project_components enable row level security;
alter table public.inventory_locations enable row level security;
alter table public.inventory_lots enable row level security;
alter table public.asset_units enable row level security;
alter table public.component_requests enable row level security;
alter table public.component_request_votes enable row level security;
alter table public.checkout_sessions enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.inventory_evidence enable row level security;
alter table public.cabinet_devices enable row level security;
alter table public.cabinet_access_intents enable row level security;
alter table public.cabinet_events enable row level security;

create policy components_public_select on public.components
for select to anon, authenticated
using (active);
create policy components_staff_all on public.components
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy component_offers_public_select on public.component_offers
for select to anon, authenticated
using (
  active
  and exists (
    select 1 from public.components component
    where component.id = component_id and component.active
  )
);
create policy component_offers_staff_all on public.component_offers
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy project_components_public_select on public.project_components
for select to anon, authenticated
using (
  exists (
    select 1 from public.components component
    where component.id = component_id and component.active
  )
);
create policy project_components_staff_all on public.project_components
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy inventory_locations_staff_all on public.inventory_locations
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));
create policy inventory_lots_staff_all on public.inventory_lots
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));
create policy asset_units_staff_all on public.asset_units
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy component_requests_staff_all on public.component_requests
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy component_request_votes_select_self on public.component_request_votes
for select to authenticated
using ((select auth.uid()) = member_id);
create policy component_request_votes_staff_all on public.component_request_votes
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy checkout_sessions_select_self on public.checkout_sessions
for select to authenticated
using ((select auth.uid()) = member_id);
create policy checkout_sessions_staff_all on public.checkout_sessions
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy inventory_movements_select_owner on public.inventory_movements
for select to authenticated
using (
  exists (
    select 1
    from public.checkout_sessions checkout
    where checkout.id = checkout_session_id
      and checkout.member_id = (select auth.uid())
  )
);
create policy inventory_movements_staff_all on public.inventory_movements
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy inventory_evidence_select_owner on public.inventory_evidence
for select to authenticated
using (
  uploaded_by = (select auth.uid())
  and exists (
    select 1
    from public.checkout_sessions checkout
    where checkout.id = checkout_session_id
      and checkout.member_id = (select auth.uid())
  )
);
create policy inventory_evidence_insert_owner on public.inventory_evidence
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and storage_path like (select auth.uid())::text || '/' || checkout_session_id::text || '/%'
  and exists (
    select 1
    from public.checkout_sessions checkout
    where checkout.id = checkout_session_id
      and checkout.member_id = (select auth.uid())
      and checkout.status in ('open', 'checked_out')
  )
);
create policy inventory_evidence_staff_all on public.inventory_evidence
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create policy cabinet_devices_staff_all on public.cabinet_devices
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));
create policy cabinet_access_intents_select_self on public.cabinet_access_intents
for select to authenticated
using ((select auth.uid()) = member_id);
create policy cabinet_access_intents_staff_all on public.cabinet_access_intents
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));
create policy cabinet_events_staff_all on public.cabinet_events
for all to authenticated
using ((select private.is_staff(null)))
with check ((select private.is_staff(null)));

create view public.public_component_catalog
with (security_barrier = true)
as
select
  component.id,
  component.slug,
  component.name,
  component.description,
  component.category,
  component.inventory_kind,
  component.unit,
  component.target_quantity,
  case
    when coalesce(stock.available_quantity, 0) <= 0 then 'unavailable'
    when coalesce(stock.available_quantity, 0) <= component.reorder_threshold then 'low_stock'
    else 'available'
  end as stock_status
from public.components component
left join lateral (
  select
    case
      when component.inventory_kind in ('serialized_reusable', 'reusable_tray')
        then (
          select count(*)::numeric
          from public.asset_units asset
          where asset.component_id = component.id
            and asset.status = 'available'
        )
      else (
        select coalesce(sum(lot.quantity_on_hand), 0)
        from public.inventory_lots lot
        where lot.component_id = component.id
      )
    end as available_quantity
) stock on true
where component.active;

comment on view public.public_component_catalog is
  'Public component metadata with deliberately coarse inventory availability.';

create view public.member_component_inventory
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
  inventory.available_quantity
from (
  select
    component.id as component_id,
    component.slug,
    component.name,
    location.id as inventory_location_id,
    location.code as location_code,
    location.name as location_name,
    component.unit,
    count(asset.id)::numeric as available_quantity
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
    sum(lot.quantity_on_hand) as available_quantity
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
    location.id,
    location.code,
    location.name
) inventory
where
  private.has_active_membership(auth.uid(), now())
  or private.is_staff(null);

comment on view public.member_component_inventory is
  'Exact member-visible stock and storage locations for active members and staff.';

create view public.public_component_requests
with (security_barrier = true)
as
select
  request.id,
  request.component_name,
  request.vendor_url,
  request.project_use_case,
  request.requested_quantity,
  request.urgency,
  request.budget_band,
  request.notes,
  request.status,
  request.verified_at,
  request.created_at,
  count(vote.member_id)::integer as vote_count
from public.component_requests request
left join public.component_request_votes vote on vote.request_id = request.id
where request.is_published and request.verified_at is not null
group by request.id;

comment on view public.public_component_requests is
  'Verified requests and aggregate votes without requester email or token material.';

create or replace function public.create_public_component_request(
  p_requester_email text,
  p_component_name text,
  p_vendor_url text,
  p_project_use_case text,
  p_requested_quantity integer,
  p_urgency public.component_request_urgency,
  p_budget_band public.component_request_budget,
  p_notes text default null,
  p_requester_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
  v_token text;
  v_expires_at timestamptz := now() + interval '24 hours';
begin
  v_token := translate(
    encode(extensions.gen_random_bytes(32), 'base64'),
    E'+/=\\n',
    '-_'
  );

  insert into public.component_requests (
    requester_user_id,
    requester_email,
    component_name,
    vendor_url,
    project_use_case,
    requested_quantity,
    urgency,
    budget_band,
    notes,
    verification_token_hash,
    verification_expires_at
  )
  values (
    p_requester_user_id,
    lower(btrim(p_requester_email)),
    btrim(p_component_name),
    nullif(btrim(p_vendor_url), ''),
    btrim(p_project_use_case),
    p_requested_quantity,
    p_urgency,
    p_budget_band,
    nullif(btrim(p_notes), ''),
    extensions.digest(convert_to(v_token, 'utf8'), 'sha256'),
    v_expires_at
  )
  returning id into v_request_id;

  return jsonb_build_object(
    'request_id', v_request_id,
    'verification_token', v_token,
    'verification_expires_at', v_expires_at
  );
end;
$$;

create or replace function public.verify_component_request(
  p_request_id uuid,
  p_verification_token text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
begin
  update public.component_requests
  set
    verification_token_hash = null,
    verification_expires_at = null,
    verified_at = now(),
    is_published = true
  where id = p_request_id
    and verified_at is null
    and verification_expires_at > now()
    and verification_token_hash = extensions.digest(
      convert_to(p_verification_token, 'utf8'),
      'sha256'
    )
  returning id into v_request_id;

  if v_request_id is null then
    raise exception using
      errcode = '22023',
      message = 'verification token is expired, invalid, or already used';
  end if;

  return v_request_id;
end;
$$;

create or replace function public.vote_component_request(
  p_request_id uuid,
  p_enabled boolean default true
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_vote_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  if not private.has_active_membership(v_user_id, now()) then
    raise exception using errcode = '42501', message = 'active membership is required';
  end if;

  perform 1
  from public.component_requests request
  where request.id = p_request_id
    and request.is_published
    and request.verified_at is not null
    and request.status <> 'declined'
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'published request not found';
  end if;

  if p_enabled then
    insert into public.component_request_votes (request_id, member_id)
    values (p_request_id, v_user_id)
    on conflict (request_id, member_id) do nothing;
  else
    delete from public.component_request_votes
    where request_id = p_request_id and member_id = v_user_id;
  end if;

  select count(*)::integer
  into v_vote_count
  from public.component_request_votes
  where request_id = p_request_id;

  return v_vote_count;
end;
$$;

create or replace function public.adjust_inventory_stock(
  p_inventory_lot_id uuid,
  p_quantity_delta numeric,
  p_reason text
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_lot public.inventory_lots%rowtype;
  v_new_quantity numeric;
begin
  if not private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[]) then
    raise exception using errcode = '42501', message = 'operations staff role required';
  end if;

  if p_quantity_delta = 0 then
    raise exception using errcode = '22023', message = 'quantity delta must not be zero';
  end if;

  if char_length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception using errcode = '22023', message = 'a reason is required';
  end if;

  select *
  into v_lot
  from public.inventory_lots
  where id = p_inventory_lot_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'inventory lot not found';
  end if;

  v_new_quantity := v_lot.quantity_on_hand + p_quantity_delta;
  if v_new_quantity < 0 then
    raise exception using errcode = '23514', message = 'inventory quantity cannot become negative';
  end if;

  update public.inventory_lots
  set quantity_on_hand = v_new_quantity
  where id = p_inventory_lot_id;

  insert into public.inventory_movements (
    component_id,
    inventory_lot_id,
    movement_kind,
    quantity_delta,
    actor_user_id,
    source,
    notes
  )
  values (
    v_lot.component_id,
    v_lot.id,
    'stock_adjustment',
    p_quantity_delta,
    v_staff_id,
    'staff',
    btrim(p_reason)
  );

  perform private.record_audit(
    v_staff_id,
    'staff',
    'inventory.stock_adjusted',
    'inventory_lot',
    v_lot.id,
    jsonb_build_object('quantity_on_hand', v_lot.quantity_on_hand),
    jsonb_build_object('quantity_on_hand', v_new_quantity),
    btrim(p_reason)
  );

  return v_new_quantity;
end;
$$;

create or replace function public.begin_inventory_checkout(
  p_attendance_session_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attendance public.attendance_sessions%rowtype;
  v_checkout_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  if not private.has_active_membership(v_user_id, now()) then
    raise exception using errcode = '42501', message = 'active membership is required';
  end if;

  select id
  into v_checkout_id
  from public.checkout_sessions
  where member_id = v_user_id and idempotency_key = btrim(p_idempotency_key);

  if found then
    return v_checkout_id;
  end if;

  select *
  into v_attendance
  from public.attendance_sessions
  where id = p_attendance_session_id
    and user_id = v_user_id
    and status = 'active'
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'active on-site attendance is required';
  end if;

  insert into public.checkout_sessions (
    member_id,
    attendance_session_id,
    location_id,
    idempotency_key
  )
  values (
    v_user_id,
    v_attendance.id,
    v_attendance.location_id,
    btrim(p_idempotency_key)
  )
  returning id into v_checkout_id;

  return v_checkout_id;
end;
$$;

create or replace function public.scan_checkout_asset(
  p_checkout_session_id uuid,
  p_asset_tag text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_checkout public.checkout_sessions%rowtype;
  v_asset public.asset_units%rowtype;
  v_inventory_kind public.component_inventory_kind;
  v_movement_id uuid;
begin
  select *
  into v_checkout
  from public.checkout_sessions
  where id = p_checkout_session_id
    and member_id = v_user_id
    and status = 'open'
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'open checkout session not found';
  end if;

  if not exists (
    select 1
    from public.attendance_sessions attendance
    where attendance.id = v_checkout.attendance_session_id
      and attendance.user_id = v_user_id
      and attendance.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'active on-site attendance is required';
  end if;

  select asset.*
  into v_asset
  from public.asset_units asset
  where asset.asset_tag = upper(btrim(p_asset_tag))
  for update of asset;

  if not found then
    raise exception using errcode = 'P0002', message = 'asset not found';
  end if;

  if v_asset.status <> 'available' then
    raise exception using errcode = '55000', message = 'asset is not available';
  end if;

  select component.inventory_kind
  into v_inventory_kind
  from public.components component
  where component.id = v_asset.component_id;

  if v_asset.inventory_location_id not in (
    select location.id
    from public.inventory_locations location
    where location.lab_location_id = v_checkout.location_id
  ) then
    raise exception using errcode = '42501', message = 'asset belongs to another lab location';
  end if;

  if v_inventory_kind not in ('serialized_reusable', 'reusable_tray') then
    raise exception using errcode = '22023', message = 'only reusable serialized assets can be scanned';
  end if;

  insert into public.inventory_movements (
    component_id,
    asset_unit_id,
    checkout_session_id,
    movement_kind,
    actor_user_id,
    source
  )
  values (
    v_asset.component_id,
    v_asset.id,
    v_checkout.id,
    'checkout',
    v_user_id,
    'pwa'
  )
  returning id into v_movement_id;

  update public.asset_units
  set status = 'checked_out'
  where id = v_asset.id;

  return v_movement_id;
end;
$$;

create or replace function public.complete_inventory_checkout(
  p_checkout_session_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_checkout public.checkout_sessions%rowtype;
begin
  select *
  into v_checkout
  from public.checkout_sessions
  where id = p_checkout_session_id
    and member_id = v_user_id
    and status = 'open'
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'open checkout session not found';
  end if;

  if not exists (
    select 1
    from public.attendance_sessions attendance
    where attendance.id = v_checkout.attendance_session_id
      and attendance.user_id = v_user_id
      and attendance.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'active on-site attendance is required';
  end if;

  if not exists (
    select 1
    from public.inventory_movements movement
    where movement.checkout_session_id = v_checkout.id
      and movement.movement_kind = 'checkout'
      and movement.closed_at is null
  ) then
    raise exception using errcode = '22023', message = 'checkout has no scanned assets';
  end if;

  update public.checkout_sessions
  set status = 'checked_out', checked_out_at = now()
  where id = v_checkout.id;

  return v_checkout.id;
end;
$$;

create or replace function public.return_inventory_asset(
  p_checkout_session_id uuid,
  p_asset_tag text,
  p_condition_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_staff boolean := private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[]);
  v_checkout public.checkout_sessions%rowtype;
  v_asset public.asset_units%rowtype;
  v_checkout_movement public.inventory_movements%rowtype;
  v_return_movement_id uuid;
begin
  select *
  into v_checkout
  from public.checkout_sessions
  where id = p_checkout_session_id
    and status = 'checked_out'
    and (member_id = v_user_id or v_is_staff)
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'active checkout session not found';
  end if;

  if not v_is_staff and not exists (
    select 1
    from public.attendance_sessions attendance
    where attendance.id = v_checkout.attendance_session_id
      and attendance.user_id = v_user_id
      and attendance.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'active on-site attendance is required';
  end if;

  select *
  into v_asset
  from public.asset_units
  where asset_tag = upper(btrim(p_asset_tag))
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'asset not found';
  end if;

  select *
  into v_checkout_movement
  from public.inventory_movements
  where checkout_session_id = v_checkout.id
    and asset_unit_id = v_asset.id
    and movement_kind = 'checkout'
    and closed_at is null
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'asset is not held by this checkout';
  end if;

  update public.inventory_movements
  set closed_at = now()
  where id = v_checkout_movement.id;

  insert into public.inventory_movements (
    component_id,
    asset_unit_id,
    checkout_session_id,
    movement_kind,
    actor_user_id,
    source,
    notes,
    closed_at
  )
  values (
    v_asset.component_id,
    v_asset.id,
    v_checkout.id,
    'return',
    v_user_id,
    case when v_is_staff then 'staff' else 'pwa' end,
    nullif(btrim(p_condition_note), ''),
    now()
  )
  returning id into v_return_movement_id;

  update public.asset_units
  set
    status = 'available',
    condition_note = coalesce(nullif(btrim(p_condition_note), ''), condition_note)
  where id = v_asset.id;

  if not exists (
    select 1
    from public.inventory_movements movement
    where movement.checkout_session_id = v_checkout.id
      and movement.movement_kind = 'checkout'
      and movement.closed_at is null
  ) then
    update public.checkout_sessions
    set status = 'returned', returned_at = now()
    where id = v_checkout.id;
  end if;

  return v_return_movement_id;
end;
$$;

create or replace function public.create_cabinet_access_intent(
  p_cabinet_device_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_device public.cabinet_devices%rowtype;
  v_attendance_id uuid;
  v_intent_id uuid;
  v_token text;
  v_expires_at timestamptz := now() + interval '60 seconds';
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  if not private.has_active_membership(v_user_id, now()) then
    raise exception using errcode = '42501', message = 'active membership is required';
  end if;

  select *
  into v_device
  from public.cabinet_devices
  where id = p_cabinet_device_id and status = 'active';

  if not found then
    raise exception using errcode = 'P0002', message = 'active cabinet device not found';
  end if;

  select attendance.id
  into v_attendance_id
  from public.attendance_sessions attendance
  where attendance.user_id = v_user_id
    and attendance.location_id = v_device.location_id
    and attendance.status = 'active'
  order by attendance.checked_in_at desc
  limit 1;

  if v_attendance_id is null then
    raise exception using errcode = '42501', message = 'active on-site attendance is required';
  end if;

  update public.cabinet_access_intents
  set status = 'cancelled'
  where member_id = v_user_id
    and cabinet_device_id = p_cabinet_device_id
    and status = 'pending';

  v_token := translate(
    encode(extensions.gen_random_bytes(32), 'base64'),
    E'+/=\\n',
    '-_'
  );

  insert into public.cabinet_access_intents (
    member_id,
    attendance_session_id,
    cabinet_device_id,
    token_hash,
    expires_at
  )
  values (
    v_user_id,
    v_attendance_id,
    p_cabinet_device_id,
    extensions.digest(convert_to(v_token, 'utf8'), 'sha256'),
    v_expires_at
  )
  returning id into v_intent_id;

  return jsonb_build_object(
    'intent_id', v_intent_id,
    'token', v_token,
    'expires_at', v_expires_at
  );
end;
$$;

create or replace function public.redeem_cabinet_access_intent(
  p_token_hash_hex text,
  p_cabinet_device_id uuid,
  p_event_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_device public.cabinet_devices%rowtype;
  v_intent public.cabinet_access_intents%rowtype;
  v_event_id uuid;
begin
  select *
  into v_device
  from public.cabinet_devices
  where id = p_cabinet_device_id and status = 'active'
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'cabinet device is not active';
  end if;

  update public.cabinet_access_intents
  set status = 'expired'
  where token_hash = decode(p_token_hash_hex, 'hex')
    and status = 'pending'
    and expires_at <= now();

  update public.cabinet_access_intents
  set status = 'redeemed', redeemed_at = now()
  where id = (
    select intent.id
    from public.cabinet_access_intents intent
    where intent.token_hash = decode(p_token_hash_hex, 'hex')
      and intent.cabinet_device_id = p_cabinet_device_id
      and intent.status = 'pending'
      and intent.expires_at > now()
    for update skip locked
  )
  returning * into v_intent;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'cabinet token is expired, invalid, or already used';
  end if;

  if not exists (
    select 1
    from public.attendance_sessions attendance
    where attendance.id = v_intent.attendance_session_id
      and attendance.user_id = v_intent.member_id
      and attendance.location_id = v_device.location_id
      and attendance.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'member is not checked in at this location';
  end if;

  insert into public.cabinet_events (
    cabinet_device_id,
    access_intent_id,
    event_key,
    event_kind,
    occurred_at,
    payload
  )
  values (
    p_cabinet_device_id,
    v_intent.id,
    btrim(p_event_key),
    'access_granted',
    now(),
    jsonb_build_object('member_id', v_intent.member_id)
  )
  returning id into v_event_id;

  update public.cabinet_devices
  set last_seen_at = now()
  where id = p_cabinet_device_id;

  return jsonb_build_object(
    'intent_id', v_intent.id,
    'event_id', v_event_id,
    'member_id', v_intent.member_id,
    'processed_at', now()
  );
end;
$$;

create or replace function public.record_cabinet_event(
  p_cabinet_device_id uuid,
  p_event_key text,
  p_event_kind public.cabinet_event_kind,
  p_occurred_at timestamptz,
  p_payload jsonb default '{}'::jsonb,
  p_access_intent_id uuid default null,
  p_checkout_session_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
begin
  if not exists (
    select 1
    from public.cabinet_devices
    where id = p_cabinet_device_id and status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'cabinet device is not active';
  end if;

  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'event payload must be an object';
  end if;

  insert into public.cabinet_events (
    cabinet_device_id,
    access_intent_id,
    checkout_session_id,
    event_key,
    event_kind,
    occurred_at,
    payload
  )
  values (
    p_cabinet_device_id,
    p_access_intent_id,
    p_checkout_session_id,
    btrim(p_event_key),
    p_event_kind,
    p_occurred_at,
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (cabinet_device_id, event_key) do update
  set received_at = public.cabinet_events.received_at
  returning id into v_event_id;

  update public.cabinet_devices
  set last_seen_at = now()
  where id = p_cabinet_device_id;

  return v_event_id;
end;
$$;

revoke all on function private.set_inventory_evidence_retention() from public;
revoke all on function private.guard_attendance_with_open_holdings() from public;
revoke all on function public.create_public_component_request(
  text, text, text, text, integer, public.component_request_urgency,
  public.component_request_budget, text, uuid
) from public;
revoke all on function public.verify_component_request(uuid, text) from public;
revoke all on function public.vote_component_request(uuid, boolean) from public;
revoke all on function public.adjust_inventory_stock(uuid, numeric, text) from public;
revoke all on function public.begin_inventory_checkout(uuid, text) from public;
revoke all on function public.scan_checkout_asset(uuid, text) from public;
revoke all on function public.complete_inventory_checkout(uuid) from public;
revoke all on function public.return_inventory_asset(uuid, text, text) from public;
revoke all on function public.create_cabinet_access_intent(uuid) from public;
revoke all on function public.redeem_cabinet_access_intent(text, uuid, text) from public;
revoke all on function public.record_cabinet_event(
  uuid, text, public.cabinet_event_kind, timestamptz, jsonb, uuid, uuid
) from public;

grant execute on function public.create_public_component_request(
  text, text, text, text, integer, public.component_request_urgency,
  public.component_request_budget, text, uuid
) to service_role;
grant execute on function public.verify_component_request(uuid, text) to service_role;
grant execute on function public.vote_component_request(uuid, boolean) to authenticated;
grant execute on function public.adjust_inventory_stock(uuid, numeric, text) to authenticated;
grant execute on function public.begin_inventory_checkout(uuid, text) to authenticated;
grant execute on function public.scan_checkout_asset(uuid, text) to authenticated;
grant execute on function public.complete_inventory_checkout(uuid) to authenticated;
grant execute on function public.return_inventory_asset(uuid, text, text) to authenticated;
grant execute on function public.create_cabinet_access_intent(uuid) to authenticated;
grant execute on function public.redeem_cabinet_access_intent(text, uuid, text) to service_role;
grant execute on function public.record_cabinet_event(
  uuid, text, public.cabinet_event_kind, timestamptz, jsonb, uuid, uuid
) to service_role;

revoke all on public.components from anon, authenticated;
revoke all on public.component_offers from anon, authenticated;
revoke all on public.project_components from anon, authenticated;
revoke all on public.inventory_locations from anon, authenticated;
revoke all on public.inventory_lots from anon, authenticated;
revoke all on public.asset_units from anon, authenticated;
revoke all on public.component_requests from anon, authenticated;
revoke all on public.component_request_votes from anon, authenticated;
revoke all on public.checkout_sessions from anon, authenticated;
revoke all on public.inventory_movements from anon, authenticated;
revoke all on public.inventory_evidence from anon, authenticated;
revoke all on public.cabinet_devices from anon, authenticated;
revoke all on public.cabinet_access_intents from anon, authenticated;
revoke all on public.cabinet_events from anon, authenticated;

grant select on public.components to anon, authenticated;
grant select on public.component_offers to anon, authenticated;
grant select on public.project_components to anon, authenticated;
grant insert, update, delete on public.components to authenticated;
grant insert, update, delete on public.component_offers to authenticated;
grant insert, update, delete on public.project_components to authenticated;

grant select, insert, update, delete on public.inventory_locations to authenticated;
grant select, insert, update, delete on public.inventory_lots to authenticated;
grant select, insert, update, delete on public.asset_units to authenticated;
grant select on public.component_requests to authenticated;
grant select on public.component_request_votes to authenticated;
grant select on public.checkout_sessions to authenticated;
grant select on public.inventory_movements to authenticated;
grant select, insert on public.inventory_evidence to authenticated;
grant select, insert, update, delete on public.cabinet_devices to authenticated;
grant select on public.cabinet_access_intents to authenticated;
grant select on public.cabinet_events to authenticated;

grant select on public.public_component_catalog to anon, authenticated;
grant select on public.member_component_inventory to authenticated;
grant select on public.public_component_requests to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inventory-evidence',
  'inventory-evidence',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy inventory_evidence_objects_member_read on storage.objects
for select to authenticated
using (
  bucket_id = 'inventory-evidence'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_staff(null))
  )
);

create policy inventory_evidence_objects_member_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'inventory-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.checkout_sessions checkout
    where checkout.id::text = (storage.foldername(name))[2]
      and checkout.member_id = (select auth.uid())
      and checkout.status in ('open', 'checked_out')
  )
);

create policy inventory_evidence_objects_staff_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'inventory-evidence'
  and (select private.is_staff(null))
);

create policy inventory_evidence_objects_staff_update on storage.objects
for update to authenticated
using (
  bucket_id = 'inventory-evidence'
  and (select private.is_staff(null))
)
with check (
  bucket_id = 'inventory-evidence'
  and (select private.is_staff(null))
);

create policy inventory_evidence_objects_staff_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'inventory-evidence'
  and (select private.is_staff(null))
);

insert into public.components (
  id,
  slug,
  name,
  description,
  category,
  inventory_kind,
  target_quantity,
  reorder_threshold,
  metadata
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    'so-101-leader-follower-set',
    'SO-101 Leader and Follower Set',
    'Assembled teleoperation arm pair for LeRobot experiments.',
    'Robot arms',
    'serialized_reusable',
    5,
    1,
    '{"seed":"2026-07-26 vendor audit"}'
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    'jetson-orin-nano-kit',
    'NVIDIA Jetson Orin Nano Developer Kit',
    'Shared edge inference computer; exact memory and NVIDIA part number require PO validation.',
    'Edge compute',
    'serialized_reusable',
    6,
    1,
    '{"requires_exact_part_number":true}'
  ),
  (
    '70000000-0000-4000-8000-000000000003',
    'lekiwi-mobile-manipulator',
    'LeKiwi Mobile Robot With Arm',
    'Assembled mobile-manipulation platform; camera is not included.',
    'Mobile robots',
    'serialized_reusable',
    1,
    0,
    '{}'
  ),
  (
    '70000000-0000-4000-8000-000000000004',
    'raspberry-pi-5-kit',
    'Raspberry Pi 5 Kit',
    'General robotics controller kit; RAM, storage and power variant must be standardized.',
    'Controllers',
    'serialized_reusable',
    12,
    2,
    '{"offer_pending":true}'
  ),
  (
    '70000000-0000-4000-8000-000000000005',
    'arduino-uno-r4-wifi',
    'Arduino UNO R4 WiFi',
    'Wi-Fi enabled microcontroller board for controls and instrumentation.',
    'Controllers',
    'serialized_reusable',
    12,
    2,
    '{}'
  ),
  (
    '70000000-0000-4000-8000-000000000006',
    'firebeetle-2-esp32-c6',
    'DFRobot FireBeetle 2 ESP32-C6',
    'Compact Wi-Fi 6, Bluetooth, Zigbee and Thread development board.',
    'Controllers',
    'serialized_reusable',
    20,
    4,
    '{}'
  ),
  (
    '70000000-0000-4000-8000-000000000007',
    'cytron-mdd3a-motor-driver',
    'Cytron MDD3A Dual Motor Driver',
    '4-16 V, 3 A dual-channel DC motor driver.',
    'Motion',
    'serialized_reusable',
    12,
    2,
    '{}'
  ),
  (
    '70000000-0000-4000-8000-000000000008',
    'pca9685-servo-driver',
    'PCA9685 16-channel Servo Driver',
    'I2C 12-bit PWM board for multi-servo control.',
    'Motion',
    'serialized_reusable',
    12,
    2,
    '{}'
  ),
  (
    '70000000-0000-4000-8000-000000000009',
    'bno055-imu',
    'BNO055 9-DOF IMU',
    'Absolute-orientation IMU breakout for robot state sensing.',
    'Sensors',
    'serialized_reusable',
    12,
    2,
    '{}'
  ),
  (
    '70000000-0000-4000-8000-000000000010',
    'raspberry-pi-camera-v2',
    'Raspberry Pi Camera V2',
    'CSI RGB camera for robot vision and documentation.',
    'Cameras',
    'serialized_reusable',
    12,
    2,
    '{"offer_pending":true}'
  ),
  (
    '70000000-0000-4000-8000-000000000011',
    'matrix-tof-8x8',
    '8x8 Matrix ToF Distance Sensor',
    'I2C/UART 3D ranging sensor with a 3.5 m range and 60-degree field of view.',
    'Sensors',
    'serialized_reusable',
    6,
    1,
    '{}'
  ),
  (
    '70000000-0000-4000-8000-000000000012',
    'pixhawk-2-4-8',
    'Pixhawk 2.4.8 Flight Controller',
    'Legacy autopilot offered only as a reference alternative; prefer a modern Pixhawk 6C-class unit.',
    'Autopilots',
    'serialized_reusable',
    0,
    0,
    '{"legacy_alternative":true}'
  ),
  (
    '70000000-0000-4000-8000-000000000013',
    'xlerobot',
    'XLeRobot',
    'Assembled mobile bimanual platform; battery, Raspberry Pi and camera are not included.',
    'Mobile robots',
    'serialized_reusable',
    0,
    0,
    '{}'
  ),
  (
    '70000000-0000-4000-8000-000000000014',
    'ab-so-bot',
    'AB-SO-BOT',
    'Assembled bimanual platform for comparative manipulation experiments.',
    'Robot arms',
    'serialized_reusable',
    0,
    0,
    '{}'
  ),
  (
    '70000000-0000-4000-8000-000000000015',
    'elrobot',
    'ElRobot',
    'Assembled manipulator for comparative robotics research.',
    'Robot arms',
    'serialized_reusable',
    0,
    0,
    '{}'
  ),
  (
    '70000000-0000-4000-8000-000000000016',
    'lelamp',
    'LeLamp',
    'Interactive ESP32 and servo teaching platform.',
    'Interactive robots',
    'serialized_reusable',
    0,
    0,
    '{}'
  ),
  (
    '70000000-0000-4000-8000-000000000017',
    'jetson-agx-orin',
    'NVIDIA Jetson AGX Orin',
    'High-end edge computer; vendor naming and memory configuration require confirmation.',
    'Edge compute',
    'serialized_reusable',
    0,
    0,
    '{"requires_exact_part_number":true}'
  ),
  (
    '70000000-0000-4000-8000-000000000018',
    'jetson-thor',
    'NVIDIA Jetson Thor',
    'Future high-end robot edge compute option.',
    'Edge compute',
    'serialized_reusable',
    0,
    0,
    '{"future_option":true}'
  ),
  (
    '70000000-0000-4000-8000-000000000019',
    'so-101-g-clamp',
    'SO-101 G Clamp',
    'Bench clamp for SO-101 arm mounting; adapter plate is not included.',
    'Mechanical',
    'consumable',
    6,
    1,
    '{}'
  )
on conflict (id) do nothing;

insert into public.component_offers (
  id,
  component_id,
  vendor_name,
  variant,
  order_url,
  display_price_inr,
  stock_status,
  checked_on,
  warranty_note,
  is_preferred,
  requires_validation,
  notes
)
values
  (
    '71000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    'GetSet Robotics',
    '7.4 V assembled',
    'https://getsetrobotics.com/product/so-101-robotic-arm/',
    27500,
    'limited',
    date '2026-07-26',
    'Confirm GST treatment, shipping, warranty and delivery time before PO.',
    true,
    true,
    'Camera is not included; standardize one voltage family before buying spares.'
  ),
  (
    '71000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000001',
    'GetSet Robotics',
    '12 V assembled',
    'https://getsetrobotics.com/product/so-101-leader-follower-robotic-arm-12v-assembled/',
    32999,
    'limited',
    date '2026-07-26',
    'Confirm GST treatment, shipping, warranty and delivery time before PO.',
    false,
    true,
    'Camera is not included; standardize one voltage family before buying spares.'
  ),
  (
    '71000000-0000-4000-8000-000000000003',
    '70000000-0000-4000-8000-000000000002',
    'GetSet Robotics',
    'Displayed configuration',
    'https://getsetrobotics.com/product/jetson-orin-nano/',
    48000,
    'validate_before_po',
    date '2026-07-26',
    'Confirm exact NVIDIA part number, GST, shipping and warranty before PO.',
    true,
    true,
    'Vendor page contains conflicting memory-capacity signals.'
  ),
  (
    '71000000-0000-4000-8000-000000000004',
    '70000000-0000-4000-8000-000000000003',
    'GetSet Robotics',
    'Assembled',
    'https://getsetrobotics.com/product/lekiwi-mobile-robot-with-arm/',
    39990,
    'in_stock',
    date '2026-07-26',
    'Confirm GST treatment, shipping, warranty and delivery time before PO.',
    true,
    false,
    'Camera is not included.'
  ),
  (
    '71000000-0000-4000-8000-000000000005',
    '70000000-0000-4000-8000-000000000005',
    'Thingbits',
    'Standard',
    'https://www.thingbits.in/products/arduino-uno-r4-wifi',
    1549.34,
    'in_stock',
    date '2026-07-26',
    'Reconfirm GST, shipping, warranty and stock before PO.',
    true,
    false,
    null
  ),
  (
    '71000000-0000-4000-8000-000000000006',
    '70000000-0000-4000-8000-000000000006',
    'Thingbits',
    'DFRobot FireBeetle 2',
    'https://thingbits.in/products/dfrobot-firebeetle-2-esp32-c6-iot-development-board-with-wifi-6-bluetooth-5-zigbee-3-thread-1-3',
    813.02,
    'in_stock',
    date '2026-07-26',
    'Reconfirm GST, shipping, warranty and stock before PO.',
    true,
    false,
    null
  ),
  (
    '71000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000007',
    'Thingbits',
    '4-16 V 3 A dual channel',
    'https://www.thingbits.in/products/4-16v-3a-dual-channel-dc-motor-driver',
    683.22,
    'in_stock',
    date '2026-07-26',
    'Reconfirm GST, shipping, warranty and stock before PO.',
    true,
    false,
    null
  ),
  (
    '71000000-0000-4000-8000-000000000008',
    '70000000-0000-4000-8000-000000000008',
    'Thingbits',
    '16-channel 12-bit PWM',
    'https://www.thingbits.in/products/16-channel-12-bit-pwm-servo-driver-pca9685-with-i2c-interface',
    218.30,
    'in_stock',
    date '2026-07-26',
    'Reconfirm GST, shipping, warranty and stock before PO.',
    true,
    false,
    null
  ),
  (
    '71000000-0000-4000-8000-000000000009',
    '70000000-0000-4000-8000-000000000009',
    'Thingbits',
    'Adafruit Stemma QT/Qwiic',
    'https://www.thingbits.in/products/adafruit-bno055-9-dof-imu-absolute-orientation-breakout-stemma-qt-qwiic',
    3468.02,
    'in_stock',
    date '2026-07-26',
    'Reconfirm GST, shipping, warranty and stock before PO.',
    true,
    false,
    null
  ),
  (
    '71000000-0000-4000-8000-000000000010',
    '70000000-0000-4000-8000-000000000011',
    'Thingbits',
    'Gravity 8x8 matrix',
    'https://www.thingbits.in/products/gravity-8x8-matrix-tof-3d-distance-sensor-i2c-uart-3-5m-range-60-fov',
    3031.42,
    'in_stock',
    date '2026-07-26',
    'Reconfirm GST, shipping, warranty and stock before PO.',
    true,
    false,
    null
  ),
  (
    '71000000-0000-4000-8000-000000000011',
    '70000000-0000-4000-8000-000000000013',
    'GetSet Robotics',
    'Assembled',
    'https://getsetrobotics.com/product/xlerobot/',
    50000,
    'in_stock',
    date '2026-07-26',
    'Confirm GST treatment, shipping, warranty and delivery time before PO.',
    false,
    false,
    'Battery, Raspberry Pi and camera are not included.'
  ),
  (
    '71000000-0000-4000-8000-000000000012',
    '70000000-0000-4000-8000-000000000014',
    'GetSet Robotics',
    'Assembled',
    'https://getsetrobotics.com/product/ab-so-bot/',
    40000,
    'in_stock',
    date '2026-07-26',
    'Confirm GST treatment, shipping, warranty and delivery time before PO.',
    false,
    false,
    null
  ),
  (
    '71000000-0000-4000-8000-000000000013',
    '70000000-0000-4000-8000-000000000015',
    'GetSet Robotics',
    'Assembled',
    'https://getsetrobotics.com/product/elrobot/',
    42990,
    'in_stock',
    date '2026-07-26',
    'Confirm GST treatment, shipping, warranty and delivery time before PO.',
    false,
    false,
    null
  ),
  (
    '71000000-0000-4000-8000-000000000014',
    '70000000-0000-4000-8000-000000000016',
    'GetSet Robotics',
    'Assembled',
    'https://getsetrobotics.com/product/lelamp/',
    22500,
    'in_stock',
    date '2026-07-26',
    'Confirm GST treatment, shipping, warranty and delivery time before PO.',
    false,
    false,
    null
  ),
  (
    '71000000-0000-4000-8000-000000000015',
    '70000000-0000-4000-8000-000000000017',
    'GetSet Robotics',
    'Vendor-labelled AGX Orin Nano',
    'https://getsetrobotics.com/product/jetson-agx-orin-nano/',
    202000,
    'validate_before_po',
    date '2026-07-26',
    'Obtain an exact NVIDIA part number and written configuration before PO.',
    false,
    true,
    'Vendor naming and page specifications are internally inconsistent.'
  ),
  (
    '71000000-0000-4000-8000-000000000016',
    '70000000-0000-4000-8000-000000000018',
    'GetSet Robotics',
    'Displayed configuration',
    'https://getsetrobotics.com/product/jetson-thor/',
    318990,
    'out_of_stock',
    date '2026-07-26',
    'Obtain an exact NVIDIA part number and written configuration before PO.',
    false,
    true,
    'Future option; out of stock at audit time.'
  ),
  (
    '71000000-0000-4000-8000-000000000017',
    '70000000-0000-4000-8000-000000000019',
    'GetSet Robotics',
    'Standard',
    'https://getsetrobotics.com/product/g-clamp/',
    120,
    'in_stock',
    date '2026-07-26',
    'Confirm GST treatment, shipping and availability before PO.',
    true,
    false,
    'Adapter plate is not included.'
  )
on conflict (id) do nothing;

insert into public.project_components (
  project_slug,
  component_id,
  requirement_kind,
  quantity_per_build,
  notes
)
values
  ('lerobot-so-arm101', '70000000-0000-4000-8000-000000000001', 'required', 1, 'Standardize 7.4 V or 12 V before PO.'),
  ('so-arm100-so101', '70000000-0000-4000-8000-000000000001', 'required', 1, 'Camera is sourced separately.'),
  ('lerobot-so-arm101', '70000000-0000-4000-8000-000000000002', 'optional', 1, 'Edge inference option.'),
  ('oomwoo', '70000000-0000-4000-8000-000000000003', 'alternative', 1, 'Mobile-manipulation reference platform.'),
  ('openarm', '70000000-0000-4000-8000-000000000013', 'alternative', 1, 'Comparative bimanual platform.'),
  ('rebot-devarm', '70000000-0000-4000-8000-000000000015', 'alternative', 1, 'Comparative manipulator.'),
  ('px4', '70000000-0000-4000-8000-000000000012', 'alternative', 1, 'Legacy only; prefer Pixhawk 6C class.'),
  ('ardupilot', '70000000-0000-4000-8000-000000000012', 'alternative', 1, 'Legacy only; prefer Pixhawk 6C class.'),
  ('nasa-rover', '70000000-0000-4000-8000-000000000007', 'optional', 2, 'Small-motor prototyping only.'),
  ('nasa-rover', '70000000-0000-4000-8000-000000000009', 'optional', 1, 'Orientation sensing.'),
  ('open-health-ring', '70000000-0000-4000-8000-000000000006', 'alternative', 1, 'Wireless prototype controller.'),
  ('stag', '70000000-0000-4000-8000-000000000010', 'optional', 1, 'Vision capture option.'),
  ('flexitac', '70000000-0000-4000-8000-000000000011', 'alternative', 1, 'Ranging reference, not tactile material.'),
  ('9dtact', '70000000-0000-4000-8000-000000000010', 'optional', 1, 'RGB capture option.')
on conflict do nothing;

insert into public.inventory_locations (
  id,
  code,
  name,
  description,
  member_visible,
  metadata
)
values (
  '72000000-0000-4000-8000-000000000001',
  'PLANNING_HOLD',
  'Planning inventory - not yet counted',
  'Zero-count placeholder lots for procurement planning. Replace only after a physical count.',
  false,
  '{"placeholder":true}'
)
on conflict (id) do nothing;

insert into public.inventory_lots (
  id,
  component_id,
  inventory_location_id,
  component_offer_id,
  lot_code,
  quantity_on_hand,
  metadata
)
select
  (
    substr(md5(component.id::text), 1, 8) || '-0000-4000-8000-' ||
    substr(md5(component.id::text), 9, 12)
  )::uuid,
  component.id,
  '72000000-0000-4000-8000-000000000001',
  (
    select offer.id
    from public.component_offers offer
    where offer.component_id = component.id and offer.is_preferred
    order by offer.checked_on desc
    limit 1
  ),
  'PLAN-' || upper(replace(component.slug, '-', '_')),
  0,
  '{"placeholder":true,"physical_count_required":true}'::jsonb
from public.components component
where component.id::text like '70000000-%'
on conflict (lot_code) do nothing;
