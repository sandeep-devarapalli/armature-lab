create type public.locker_plan_period as enum ('week', 'month', 'year');
create type public.locker_assignment_status as enum (
  'requested',
  'reserved',
  'active',
  'released',
  'expired',
  'cancelled'
);
create type public.consumable_order_status as enum (
  'draft',
  'submitted',
  'approved',
  'ready',
  'fulfilled',
  'declined',
  'cancelled'
);
create type public.toolkit_kit_status as enum (
  'available',
  'reserved',
  'rented',
  'maintenance',
  'retired'
);
create type public.toolkit_item_status as enum (
  'available',
  'checked_out',
  'maintenance',
  'retired',
  'missing'
);
create type public.toolkit_rental_status as enum (
  'open',
  'checked_out',
  'returned',
  'cancelled',
  'review'
);
create type public.toolkit_evidence_phase as enum (
  'checkout',
  'return',
  'discrepancy'
);

create table public.locker_plans (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  offering_slug text not null,
  name text not null,
  description text not null default '',
  period public.locker_plan_period not null,
  duration interval not null,
  price_inr_including_gst numeric(12, 2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locker_plans_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint locker_plans_offering_slug_format check (
    offering_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint locker_plans_name_length check (
    char_length(btrim(name)) between 2 and 120
  ),
  constraint locker_plans_duration_matches_period check (
    (period = 'week' and duration = interval '7 days')
    or (period = 'month' and duration = interval '1 month')
    or (period = 'year' and duration = interval '1 year')
  ),
  constraint locker_plans_price_positive check (
    price_inr_including_gst is null or price_inr_including_gst > 0
  ),
  unique (offering_slug, period)
);

create table public.lockers (
  id uuid primary key default extensions.gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete restrict,
  code text not null unique,
  size_label text,
  description text,
  active boolean not null default true,
  maintenance_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lockers_code_format check (
    code ~ '^ARM-LKR-[A-Z0-9_-]{2,24}$'
  ),
  constraint lockers_size_length check (
    size_label is null or char_length(btrim(size_label)) between 2 and 80
  ),
  constraint lockers_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.locker_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete restrict,
  locker_plan_id uuid not null references public.locker_plans(id) on delete restrict,
  locker_id uuid references public.lockers(id) on delete restrict,
  status public.locker_assignment_status not null default 'requested',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  assignment_period tstzrange generated always as (
    tstzrange(starts_at, ends_at, '[)')
  ) stored,
  idempotency_key text not null,
  member_notes text,
  staff_notes text,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz,
  released_at timestamptz,
  release_reason text,
  last_extended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, idempotency_key),
  constraint locker_assignments_dates check (ends_at > starts_at),
  constraint locker_assignments_idempotency_length check (
    char_length(btrim(idempotency_key)) between 8 and 120
  ),
  constraint locker_assignments_assignment_contract check (
    (status = 'requested' and locker_id is null and assigned_at is null)
    or (
      status in ('reserved', 'active')
      and locker_id is not null
      and assigned_at is not null
    )
    or status in ('released', 'expired', 'cancelled')
  ),
  constraint locker_assignments_release_contract check (
    (status in ('released', 'cancelled') and released_at is not null)
    or (status not in ('released', 'cancelled') and released_at is null)
  )
);

alter table public.locker_assignments
add constraint locker_assignments_no_overlap
exclude using gist (
  locker_id with =,
  assignment_period with &&
)
where (status in ('reserved', 'active'));

create index locker_assignments_member_status_idx
  on public.locker_assignments (member_id, status, starts_at desc);
create index locker_assignments_locker_status_idx
  on public.locker_assignments (locker_id, status, starts_at)
  where locker_id is not null;

create table public.consumable_skus (
  id uuid primary key default extensions.gen_random_uuid(),
  component_id uuid not null references public.components(id) on delete restrict,
  inventory_lot_id uuid references public.inventory_lots(id) on delete restrict,
  sku_code text not null unique,
  name text not null,
  description text not null default '',
  order_unit text not null default 'unit',
  quantity_per_order_unit numeric(12, 3) not null default 1,
  reference_price_inr_including_gst numeric(12, 2),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consumable_skus_code_format check (
    sku_code ~ '^ARM-CNS-[A-Z0-9_-]{2,24}$'
  ),
  constraint consumable_skus_name_length check (
    char_length(btrim(name)) between 2 and 160
  ),
  constraint consumable_skus_unit_length check (
    char_length(btrim(order_unit)) between 1 and 40
  ),
  constraint consumable_skus_quantity_positive check (
    quantity_per_order_unit > 0
  ),
  constraint consumable_skus_price_positive check (
    reference_price_inr_including_gst is null
    or reference_price_inr_including_gst > 0
  ),
  constraint consumable_skus_metadata_object check (
    jsonb_typeof(metadata) = 'object'
  )
);

create table public.consumable_orders (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete restrict,
  status public.consumable_order_status not null default 'draft',
  idempotency_key text not null,
  collection_method text not null default 'front_desk',
  member_notes text,
  staff_notes text,
  submitted_at timestamptz,
  fulfilled_at timestamptz,
  fulfilled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, idempotency_key),
  constraint consumable_orders_idempotency_length check (
    char_length(btrim(idempotency_key)) between 8 and 120
  ),
  constraint consumable_orders_collection_method check (
    collection_method = 'front_desk'
  ),
  constraint consumable_orders_status_timestamps check (
    (status = 'draft' and submitted_at is null and fulfilled_at is null)
    or (
      status in ('submitted', 'approved', 'ready', 'declined', 'cancelled')
      and submitted_at is not null
      and fulfilled_at is null
    )
    or (
      status = 'fulfilled'
      and submitted_at is not null
      and fulfilled_at is not null
      and fulfilled_by is not null
    )
  )
);

create table public.consumable_order_items (
  order_id uuid not null references public.consumable_orders(id) on delete cascade,
  consumable_sku_id uuid not null references public.consumable_skus(id) on delete restrict,
  quantity integer not null,
  reference_unit_price_inr_including_gst numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (order_id, consumable_sku_id),
  constraint consumable_order_items_quantity_positive check (
    quantity between 1 and 10000
  ),
  constraint consumable_order_items_price_positive check (
    reference_unit_price_inr_including_gst is null
    or reference_unit_price_inr_including_gst > 0
  )
);

create index consumable_orders_member_status_idx
  on public.consumable_orders (member_id, status, created_at desc);
create index consumable_order_items_sku_idx
  on public.consumable_order_items (consumable_sku_id, order_id);

create table public.toolkit_templates (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  safety_notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint toolkit_templates_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint toolkit_templates_name_length check (
    char_length(btrim(name)) between 2 and 120
  )
);

create table public.toolkit_template_items (
  id uuid primary key default extensions.gen_random_uuid(),
  toolkit_template_id uuid not null references public.toolkit_templates(id) on delete cascade,
  component_id uuid references public.components(id) on delete set null,
  item_name text not null,
  quantity integer not null default 1,
  required boolean not null default true,
  notes text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (toolkit_template_id, item_name),
  constraint toolkit_template_items_name_length check (
    char_length(btrim(item_name)) between 2 and 120
  ),
  constraint toolkit_template_items_quantity_positive check (
    quantity between 1 and 100
  )
);

create table public.toolkit_kits (
  id uuid primary key default extensions.gen_random_uuid(),
  toolkit_template_id uuid not null references public.toolkit_templates(id) on delete restrict,
  inventory_location_id uuid not null references public.inventory_locations(id) on delete restrict,
  kit_tag text not null unique,
  status public.toolkit_kit_status not null default 'available',
  condition_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint toolkit_kits_tag_format check (
    kit_tag ~ '^ARM-KIT-[0-9]{6}$'
  ),
  constraint toolkit_kits_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.toolkit_items (
  id uuid primary key default extensions.gen_random_uuid(),
  toolkit_kit_id uuid not null references public.toolkit_kits(id) on delete restrict,
  template_item_id uuid references public.toolkit_template_items(id) on delete set null,
  item_tag text not null unique,
  name text not null,
  serial_number text,
  required boolean not null default true,
  status public.toolkit_item_status not null default 'available',
  condition_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint toolkit_items_tag_format check (
    item_tag ~ '^ARM-TLK-[0-9]{6}$'
  ),
  constraint toolkit_items_name_length check (
    char_length(btrim(name)) between 2 and 120
  ),
  constraint toolkit_items_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create unique index toolkit_items_serial_number_key
  on public.toolkit_items (serial_number)
  where serial_number is not null;
create index toolkit_items_kit_status_idx
  on public.toolkit_items (toolkit_kit_id, status);

create table public.toolkit_rental_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete restrict,
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete restrict,
  toolkit_kit_id uuid not null references public.toolkit_kits(id) on delete restrict,
  status public.toolkit_rental_status not null default 'open',
  requested_period interval not null,
  idempotency_key text not null,
  opened_at timestamptz not null default now(),
  checked_out_at timestamptz,
  returned_at timestamptz,
  checkout_condition_note text,
  return_condition_note text,
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, idempotency_key),
  constraint toolkit_rentals_idempotency_length check (
    char_length(btrim(idempotency_key)) between 8 and 120
  ),
  constraint toolkit_rentals_period_positive check (
    requested_period > interval '0 seconds'
  ),
  constraint toolkit_rentals_timestamps check (
    (status = 'open' and checked_out_at is null and returned_at is null)
    or (
      status = 'checked_out'
      and checked_out_at is not null
      and returned_at is null
    )
    or (
      status = 'returned'
      and checked_out_at is not null
      and returned_at is not null
    )
    or status in ('cancelled', 'review')
  )
);

create unique index toolkit_rentals_one_active_kit
  on public.toolkit_rental_sessions (toolkit_kit_id)
  where status in ('open', 'checked_out');
create index toolkit_rentals_member_status_idx
  on public.toolkit_rental_sessions (member_id, status, opened_at desc);
create index toolkit_rentals_attendance_active_idx
  on public.toolkit_rental_sessions (attendance_session_id)
  where status in ('open', 'checked_out');

create table public.toolkit_rental_items (
  toolkit_rental_session_id uuid not null references public.toolkit_rental_sessions(id) on delete restrict,
  toolkit_item_id uuid not null references public.toolkit_items(id) on delete restrict,
  checked_out_at timestamptz not null default now(),
  returned_at timestamptz,
  checkout_condition_note text,
  return_condition_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (toolkit_rental_session_id, toolkit_item_id),
  constraint toolkit_rental_items_return_after_checkout check (
    returned_at is null or returned_at >= checked_out_at
  )
);

create unique index toolkit_rental_items_one_active_loan
  on public.toolkit_rental_items (toolkit_item_id)
  where returned_at is null;

create table public.toolkit_condition_evidence (
  id uuid primary key default extensions.gen_random_uuid(),
  toolkit_rental_session_id uuid not null references public.toolkit_rental_sessions(id) on delete restrict,
  toolkit_item_id uuid references public.toolkit_items(id) on delete set null,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  evidence_phase public.toolkit_evidence_phase not null,
  storage_path text not null unique,
  retention_class public.inventory_evidence_retention not null default 'routine',
  captured_at timestamptz not null default now(),
  retain_until timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint toolkit_evidence_storage_path check (
    storage_path !~ '(^|/)\.\.?(/|$)'
    and storage_path ~ '^[0-9a-f-]+/toolkits/[0-9a-f-]+/'
  ),
  constraint toolkit_evidence_metadata_object check (
    jsonb_typeof(metadata) = 'object'
  ),
  constraint toolkit_evidence_retention_period check (
    (retention_class = 'routine' and retain_until >= captured_at + interval '30 days')
    or (retention_class = 'flagged' and retain_until >= captured_at + interval '180 days')
  )
);

create index toolkit_evidence_retention_idx
  on public.toolkit_condition_evidence (retain_until);
create index toolkit_evidence_rental_idx
  on public.toolkit_condition_evidence (toolkit_rental_session_id, captured_at desc);

create trigger locker_plans_set_updated_at
before update on public.locker_plans
for each row execute function private.set_updated_at();
create trigger lockers_set_updated_at
before update on public.lockers
for each row execute function private.set_updated_at();
create trigger locker_assignments_set_updated_at
before update on public.locker_assignments
for each row execute function private.set_updated_at();
create trigger consumable_skus_set_updated_at
before update on public.consumable_skus
for each row execute function private.set_updated_at();
create trigger consumable_orders_set_updated_at
before update on public.consumable_orders
for each row execute function private.set_updated_at();
create trigger consumable_order_items_set_updated_at
before update on public.consumable_order_items
for each row execute function private.set_updated_at();
create trigger toolkit_templates_set_updated_at
before update on public.toolkit_templates
for each row execute function private.set_updated_at();
create trigger toolkit_kits_set_updated_at
before update on public.toolkit_kits
for each row execute function private.set_updated_at();
create trigger toolkit_items_set_updated_at
before update on public.toolkit_items
for each row execute function private.set_updated_at();
create trigger toolkit_rentals_set_updated_at
before update on public.toolkit_rental_sessions
for each row execute function private.set_updated_at();
create trigger toolkit_rental_items_set_updated_at
before update on public.toolkit_rental_items
for each row execute function private.set_updated_at();

create or replace function private.set_toolkit_evidence_retention()
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

create trigger toolkit_evidence_set_retention
before insert or update of captured_at, retention_class
on public.toolkit_condition_evidence
for each row execute function private.set_toolkit_evidence_retention();

create or replace function private.guard_attendance_with_open_holdings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'active'
    and new.status <> 'active'
    and (
      exists (
        select 1
        from public.checkout_sessions checkout
        where checkout.attendance_session_id = old.id
          and checkout.status in ('open', 'checked_out')
      )
      or exists (
        select 1
        from public.toolkit_rental_sessions rental
        where rental.attendance_session_id = old.id
          and rental.status in ('open', 'checked_out')
      )
    )
  then
    raise exception using
      errcode = '23514',
      message = 'attendance cannot close while lab-only inventory holdings are open';
  end if;

  return new;
end;
$$;

alter table public.locker_plans enable row level security;
alter table public.lockers enable row level security;
alter table public.locker_assignments enable row level security;
alter table public.consumable_skus enable row level security;
alter table public.consumable_orders enable row level security;
alter table public.consumable_order_items enable row level security;
alter table public.toolkit_templates enable row level security;
alter table public.toolkit_template_items enable row level security;
alter table public.toolkit_kits enable row level security;
alter table public.toolkit_items enable row level security;
alter table public.toolkit_rental_sessions enable row level security;
alter table public.toolkit_rental_items enable row level security;
alter table public.toolkit_condition_evidence enable row level security;

create policy locker_plans_staff_all on public.locker_plans
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));
create policy lockers_staff_all on public.lockers
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));
create policy locker_assignments_select_self on public.locker_assignments
for select to authenticated
using ((select auth.uid()) = member_id);
create policy locker_assignments_staff_all on public.locker_assignments
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy consumable_skus_staff_all on public.consumable_skus
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));
create policy consumable_orders_select_self on public.consumable_orders
for select to authenticated
using ((select auth.uid()) = member_id);
create policy consumable_orders_staff_all on public.consumable_orders
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));
create policy consumable_order_items_select_owner on public.consumable_order_items
for select to authenticated
using (
  exists (
    select 1
    from public.consumable_orders orders
    where orders.id = order_id
      and orders.member_id = (select auth.uid())
  )
);
create policy consumable_order_items_staff_all on public.consumable_order_items
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create policy toolkit_templates_staff_all on public.toolkit_templates
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));
create policy toolkit_template_items_staff_all on public.toolkit_template_items
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));
create policy toolkit_kits_staff_all on public.toolkit_kits
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));
create policy toolkit_items_staff_all on public.toolkit_items
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));
create policy toolkit_rentals_select_self on public.toolkit_rental_sessions
for select to authenticated
using ((select auth.uid()) = member_id);
create policy toolkit_rentals_staff_all on public.toolkit_rental_sessions
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));
create policy toolkit_rental_items_select_owner on public.toolkit_rental_items
for select to authenticated
using (
  exists (
    select 1
    from public.toolkit_rental_sessions rental
    where rental.id = toolkit_rental_session_id
      and rental.member_id = (select auth.uid())
  )
);
create policy toolkit_rental_items_staff_all on public.toolkit_rental_items
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));
create policy toolkit_evidence_select_owner on public.toolkit_condition_evidence
for select to authenticated
using (
  uploaded_by = (select auth.uid())
  and exists (
    select 1
    from public.toolkit_rental_sessions rental
    where rental.id = toolkit_rental_session_id
      and rental.member_id = (select auth.uid())
  )
);
create policy toolkit_evidence_insert_owner on public.toolkit_condition_evidence
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and storage_path like (
    (select auth.uid())::text
    || '/toolkits/'
    || toolkit_rental_session_id::text
    || '/%'
  )
  and exists (
    select 1
    from public.toolkit_rental_sessions rental
    where rental.id = toolkit_rental_session_id
      and rental.member_id = (select auth.uid())
      and rental.status in ('open', 'checked_out')
  )
);
create policy toolkit_evidence_staff_all on public.toolkit_condition_evidence
for all to authenticated
using ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])))
with check ((select private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[])));

create view public.public_locker_catalog
with (security_barrier = true)
as
select
  plan.id,
  plan.slug,
  plan.offering_slug,
  plan.name,
  plan.description,
  plan.period,
  plan.duration,
  plan.price_inr_including_gst,
  case
    when coalesce(availability.available_count, 0) = 0 then 'unavailable'
    when availability.available_count = 1 then 'low_stock'
    else 'available'
  end as availability_status
from public.locker_plans plan
left join lateral (
  select count(*)::integer as available_count
  from public.lockers locker
  where locker.active
    and not exists (
      select 1
      from public.locker_assignments assignment
      where assignment.locker_id = locker.id
        and assignment.status in ('reserved', 'active')
        and assignment.assignment_period && tstzrange(now(), now() + plan.duration, '[)')
    )
) availability on true
where plan.active;

comment on view public.public_locker_catalog is
  'Public locker plans with placeholder-capable INR pricing and coarse availability only.';

create view public.public_consumable_catalog
with (security_barrier = true)
as
select
  sku.id,
  sku.sku_code,
  sku.name,
  sku.description,
  sku.order_unit,
  sku.quantity_per_order_unit,
  sku.reference_price_inr_including_gst,
  case
    when sku.inventory_lot_id is null then 'unavailable'
    when lot.quantity_on_hand <= 0 then 'unavailable'
    when lot.quantity_on_hand <= component.reorder_threshold then 'low_stock'
    else 'available'
  end as availability_status
from public.consumable_skus sku
join public.components component on component.id = sku.component_id
left join public.inventory_lots lot on lot.id = sku.inventory_lot_id
where sku.active and component.active;

comment on view public.public_consumable_catalog is
  'Public low-cost parts catalog with coarse availability and no exact stock location.';

create view public.public_toolkit_catalog
with (security_barrier = true)
as
select
  template.id,
  template.slug,
  template.name,
  template.description,
  template.safety_notes,
  coalesce(contents.items, '[]'::jsonb) as items,
  case
    when coalesce(availability.available_count, 0) = 0 then 'unavailable'
    when availability.available_count = 1 then 'low_stock'
    else 'available'
  end as availability_status
from public.toolkit_templates template
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'name', item.item_name,
      'quantity', item.quantity,
      'required', item.required,
      'notes', item.notes
    )
    order by item.display_order, item.item_name
  ) as items
  from public.toolkit_template_items item
  where item.toolkit_template_id = template.id
) contents on true
left join lateral (
  select count(*)::integer as available_count
  from public.toolkit_kits kit
  where kit.toolkit_template_id = template.id
    and kit.status = 'available'
) availability on true
where template.active;

comment on view public.public_toolkit_catalog is
  'Public toolkit templates and coarse kit availability without serialized asset details.';

create or replace function public.request_locker_subscription(
  p_locker_offering_slug text,
  p_plan_term public.locker_plan_period
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan public.locker_plans%rowtype;
  v_assignment_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if not private.has_active_membership(v_user_id, now()) then
    raise exception using errcode = '42501', message = 'active membership is required';
  end if;

  select * into v_plan
  from public.locker_plans
  where offering_slug = btrim(p_locker_offering_slug)
    and period = p_plan_term
    and active;
  if not found then
    raise exception using errcode = 'P0002', message = 'active locker plan not found';
  end if;

  insert into public.locker_assignments (
    member_id,
    locker_plan_id,
    starts_at,
    ends_at,
    idempotency_key,
    member_notes
  )
  values (
    v_user_id,
    v_plan.id,
    now(),
    now() + v_plan.duration,
    'locker-request-' || extensions.gen_random_uuid()::text,
    null
  )
  returning id into v_assignment_id;

  perform private.record_audit(
    v_user_id,
    'member',
    'locker.requested',
    'locker_assignment',
    v_assignment_id,
    null,
    jsonb_build_object('status', 'requested', 'plan_id', v_plan.id),
    null
  );

  return v_assignment_id;
end;
$$;

create or replace function public.assign_locker_subscription(
  p_assignment_id uuid,
  p_locker_unit_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_assignment public.locker_assignments%rowtype;
  v_locker public.lockers%rowtype;
begin
  if not private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[]) then
    raise exception using errcode = '42501', message = 'operations staff role required';
  end if;

  select * into v_assignment
  from public.locker_assignments
  where id = p_assignment_id and status = 'requested'
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'pending locker request not found';
  end if;

  select * into v_locker
  from public.lockers
  where id = p_locker_unit_id and active
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'active locker not found';
  end if;

  update public.locker_assignments
  set
    locker_id = v_locker.id,
    status = 'active',
    assigned_by = v_staff_id,
    assigned_at = now(),
    staff_notes = 'Assigned at the lab desk'
  where id = v_assignment.id;

  perform private.record_audit(
    v_staff_id,
    'staff',
    'locker.assigned',
    'locker_assignment',
    v_assignment.id,
    jsonb_build_object('status', v_assignment.status),
    jsonb_build_object(
      'status',
      'active',
      'locker_id',
      v_locker.id,
      'locker_label',
      v_locker.code
    ),
    'Physical locker assigned'
  );

  return v_assignment.id;
end;
$$;

create or replace function public.release_locker_subscription(
  p_assignment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_staff boolean := private.is_staff(
    array['operations', 'admin', 'super_admin']::public.staff_role[]
  );
  v_assignment public.locker_assignments%rowtype;
  v_next_status public.locker_assignment_status;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  select * into v_assignment
  from public.locker_assignments
  where id = p_assignment_id
    and status in ('requested', 'reserved', 'active')
    and (member_id = v_user_id or v_is_staff)
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'releasable locker assignment not found';
  end if;

  v_next_status := case
    when v_assignment.status = 'requested' then 'cancelled'
    else 'released'
  end;

  update public.locker_assignments
  set
    status = v_next_status,
    released_at = now(),
    release_reason = 'Subscription released'
  where id = v_assignment.id;

  perform private.record_audit(
    v_user_id,
    (
      case when v_is_staff then 'staff' else 'member' end
    )::public.audit_actor_type,
    'locker.released',
    'locker_assignment',
    v_assignment.id,
    jsonb_build_object('status', v_assignment.status),
    jsonb_build_object('status', v_next_status),
    'Subscription released'
  );

  return v_assignment.id;
end;
$$;

create or replace function public.extend_locker_subscription(
  p_assignment_id uuid,
  p_plan_term public.locker_plan_period
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_staff boolean := private.is_staff(
    array['operations', 'admin', 'super_admin']::public.staff_role[]
  );
  v_assignment public.locker_assignments%rowtype;
  v_plan public.locker_plans%rowtype;
  v_new_end timestamptz;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if not v_is_staff and not private.has_active_membership(v_user_id, now()) then
    raise exception using errcode = '42501', message = 'active membership is required';
  end if;

  select * into v_assignment
  from public.locker_assignments
  where id = p_assignment_id
    and status in ('requested', 'reserved', 'active')
    and (member_id = v_user_id or v_is_staff)
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'extendable locker assignment not found';
  end if;

  select * into v_plan
  from public.locker_plans
  where offering_slug = (
      select assignment_plan.offering_slug
      from public.locker_plans assignment_plan
      where assignment_plan.id = v_assignment.locker_plan_id
    )
    and period = p_plan_term
    and active;
  if not found then
    raise exception using errcode = 'P0002', message = 'active extension plan not found';
  end if;

  v_new_end := v_assignment.ends_at + v_plan.duration;
  update public.locker_assignments
  set ends_at = v_new_end, last_extended_at = now()
  where id = v_assignment.id;

  perform private.record_audit(
    v_user_id,
    (
      case when v_is_staff then 'staff' else 'member' end
    )::public.audit_actor_type,
    'locker.extended',
    'locker_assignment',
    v_assignment.id,
    jsonb_build_object('ends_at', v_assignment.ends_at),
    jsonb_build_object('ends_at', v_new_end, 'extension_plan_id', v_plan.id),
    null
  );

  return v_new_end;
end;
$$;

create or replace function public.create_consumable_order_draft(
  p_idempotency_key text,
  p_member_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if not private.has_active_membership(v_user_id, now()) then
    raise exception using errcode = '42501', message = 'active membership is required';
  end if;

  select id into v_order_id
  from public.consumable_orders
  where member_id = v_user_id
    and idempotency_key = btrim(p_idempotency_key);
  if found then
    return v_order_id;
  end if;

  insert into public.consumable_orders (
    member_id,
    idempotency_key,
    member_notes
  )
  values (
    v_user_id,
    btrim(p_idempotency_key),
    nullif(btrim(p_member_notes), '')
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

create or replace function public.set_consumable_order_item(
  p_order_id uuid,
  p_consumable_sku_id uuid,
  p_quantity integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.consumable_orders%rowtype;
  v_sku public.consumable_skus%rowtype;
begin
  select * into v_order
  from public.consumable_orders
  where id = p_order_id
    and member_id = v_user_id
    and status = 'draft'
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'editable consumable order not found';
  end if;

  if p_quantity < 0 or p_quantity > 10000 then
    raise exception using errcode = '22023', message = 'invalid consumable quantity';
  end if;

  if p_quantity = 0 then
    delete from public.consumable_order_items
    where order_id = v_order.id and consumable_sku_id = p_consumable_sku_id;
    return v_order.id;
  end if;

  select * into v_sku
  from public.consumable_skus
  where id = p_consumable_sku_id and active;
  if not found then
    raise exception using errcode = 'P0002', message = 'active consumable SKU not found';
  end if;

  insert into public.consumable_order_items (
    order_id,
    consumable_sku_id,
    quantity,
    reference_unit_price_inr_including_gst
  )
  values (
    v_order.id,
    v_sku.id,
    p_quantity,
    v_sku.reference_price_inr_including_gst
  )
  on conflict (order_id, consumable_sku_id) do update
  set
    quantity = excluded.quantity,
    reference_unit_price_inr_including_gst =
      excluded.reference_unit_price_inr_including_gst;

  return v_order.id;
end;
$$;

create or replace function public.submit_consumable_order(
  p_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.consumable_orders%rowtype;
begin
  if not private.has_active_membership(v_user_id, now()) then
    raise exception using errcode = '42501', message = 'active membership is required';
  end if;

  select * into v_order
  from public.consumable_orders
  where id = p_order_id
    and member_id = v_user_id
    and status = 'draft'
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'draft consumable order not found';
  end if;

  if not exists (
    select 1 from public.consumable_order_items item
    where item.order_id = v_order.id
  ) then
    raise exception using errcode = '22023', message = 'consumable order has no items';
  end if;

  update public.consumable_orders
  set status = 'submitted', submitted_at = now()
  where id = v_order.id;

  perform private.record_audit(
    v_user_id,
    'member',
    'consumable_order.submitted',
    'consumable_order',
    v_order.id,
    jsonb_build_object('status', v_order.status),
    jsonb_build_object('status', 'submitted'),
    null
  );

  return v_order.id;
end;
$$;

create or replace function public.fulfill_consumable_order(
  p_order_id uuid,
  p_staff_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_order public.consumable_orders%rowtype;
  v_stock record;
begin
  if not private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[]) then
    raise exception using errcode = '42501', message = 'operations staff role required';
  end if;

  select * into v_order
  from public.consumable_orders
  where id = p_order_id
    and status in ('submitted', 'approved', 'ready')
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'fulfillable consumable order not found';
  end if;

  if exists (
    select 1
    from public.consumable_order_items item
    join public.consumable_skus sku on sku.id = item.consumable_sku_id
    where item.order_id = v_order.id
      and sku.inventory_lot_id is null
  ) then
    raise exception using errcode = '55000', message = 'consumable SKU is not linked to stock';
  end if;

  perform 1
  from public.inventory_lots lot
  where lot.id in (
    select sku.inventory_lot_id
    from public.consumable_order_items item
    join public.consumable_skus sku on sku.id = item.consumable_sku_id
    where item.order_id = v_order.id
  )
  order by lot.id
  for update;

  for v_stock in
    select
      lot.id as inventory_lot_id,
      lot.component_id,
      lot.quantity_on_hand,
      sum(item.quantity * sku.quantity_per_order_unit)::numeric as required_quantity
    from public.consumable_order_items item
    join public.consumable_skus sku on sku.id = item.consumable_sku_id
    join public.inventory_lots lot on lot.id = sku.inventory_lot_id
    where item.order_id = v_order.id
    group by lot.id, lot.component_id, lot.quantity_on_hand
    order by lot.id
  loop
    if v_stock.quantity_on_hand < v_stock.required_quantity then
      raise exception using errcode = '23514', message = 'insufficient consumable stock';
    end if;

    update public.inventory_lots
    set quantity_on_hand = quantity_on_hand - v_stock.required_quantity
    where id = v_stock.inventory_lot_id;

    insert into public.inventory_movements (
      component_id,
      inventory_lot_id,
      movement_kind,
      quantity_delta,
      actor_user_id,
      source,
      notes,
      metadata
    )
    values (
      v_stock.component_id,
      v_stock.inventory_lot_id,
      'stock_adjustment',
      -v_stock.required_quantity,
      v_staff_id,
      'consumable_order',
      nullif(btrim(p_staff_notes), ''),
      jsonb_build_object('consumable_order_id', v_order.id)
    );
  end loop;

  update public.consumable_orders
  set
    status = 'fulfilled',
    fulfilled_at = now(),
    fulfilled_by = v_staff_id,
    staff_notes = nullif(btrim(p_staff_notes), '')
  where id = v_order.id;

  perform private.record_audit(
    v_staff_id,
    'staff',
    'consumable_order.fulfilled',
    'consumable_order',
    v_order.id,
    jsonb_build_object('status', v_order.status),
    jsonb_build_object('status', 'fulfilled'),
    nullif(btrim(p_staff_notes), '')
  );

  return v_order.id;
end;
$$;

create or replace function public.create_consumable_order(
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_line record;
  v_sku_id uuid;
begin
  if jsonb_typeof(p_lines) <> 'array'
    or jsonb_array_length(p_lines) = 0
  then
    raise exception using errcode = '22023', message = 'consumable order lines must be a non-empty array';
  end if;

  v_order_id := public.create_consumable_order_draft(
    'consumable-order-' || extensions.gen_random_uuid()::text,
    null
  );

  for v_line in
    select
      nullif(btrim(line ->> 'sku_code'), '') as sku_code,
      case
        when (line ->> 'quantity') ~ '^[0-9]+$'
          then (line ->> 'quantity')::integer
        else null
      end as quantity
    from jsonb_array_elements(p_lines) line
  loop
    if v_line.sku_code is null or v_line.quantity is null then
      raise exception using errcode = '22023', message = 'each consumable line requires sku_code and quantity';
    end if;

    select id into v_sku_id
    from public.consumable_skus
    where sku_code = upper(v_line.sku_code) and active;
    if not found then
      raise exception using errcode = 'P0002', message = 'active consumable SKU not found';
    end if;

    perform public.set_consumable_order_item(
      v_order_id,
      v_sku_id,
      v_line.quantity
    );
  end loop;

  perform public.submit_consumable_order(v_order_id);
  return v_order_id;
end;
$$;

create or replace function public.set_consumable_order_status(
  p_order_id uuid,
  p_status public.consumable_order_status
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_order public.consumable_orders%rowtype;
begin
  if not private.is_staff(array['operations', 'admin', 'super_admin']::public.staff_role[]) then
    raise exception using errcode = '42501', message = 'operations staff role required';
  end if;

  if p_status = 'fulfilled' then
    return public.fulfill_consumable_order(
      p_order_id,
      'Collected at the lab desk'
    );
  end if;

  if p_status not in ('approved', 'ready', 'declined', 'cancelled') then
    raise exception using errcode = '22023', message = 'unsupported staff order status';
  end if;

  select * into v_order
  from public.consumable_orders
  where id = p_order_id
    and status in ('submitted', 'approved', 'ready')
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'mutable consumable order not found';
  end if;

  update public.consumable_orders
  set
    status = p_status,
    staff_notes = case
      when p_status = 'ready' then 'Ready for collection at the lab desk'
      else staff_notes
    end
  where id = v_order.id;

  perform private.record_audit(
    v_staff_id,
    'staff',
    'consumable_order.status_changed',
    'consumable_order',
    v_order.id,
    jsonb_build_object('status', v_order.status),
    jsonb_build_object(
      'status',
      p_status,
      'collection_method',
      'front_desk'
    ),
    null
  );

  return v_order.id;
end;
$$;

create or replace function public.start_toolkit_rental(
  p_toolkit_template_slug text,
  p_period interval
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attendance public.attendance_sessions%rowtype;
  v_kit public.toolkit_kits%rowtype;
  v_rental_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if not private.has_active_membership(v_user_id, now()) then
    raise exception using errcode = '42501', message = 'active membership is required';
  end if;

  if p_period is null or p_period <= interval '0 seconds' then
    raise exception using errcode = '22023', message = 'toolkit rental period must be positive';
  end if;

  select * into v_attendance
  from public.attendance_sessions
  where user_id = v_user_id
    and status = 'active'
  order by checked_in_at desc
  limit 1
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'active on-site attendance is required';
  end if;

  select kit.* into v_kit
  from public.toolkit_kits kit
  join public.toolkit_templates template
    on template.id = kit.toolkit_template_id
  join public.inventory_locations location
    on location.id = kit.inventory_location_id
  where template.slug = btrim(p_toolkit_template_slug)
    and template.active
    and kit.status = 'available'
    and location.lab_location_id = v_attendance.location_id
  order by kit.kit_tag
  limit 1
  for update of kit skip locked;
  if not found then
    raise exception using errcode = '55000', message = 'toolkit is not available at this location';
  end if;

  insert into public.toolkit_rental_sessions (
    member_id,
    attendance_session_id,
    toolkit_kit_id,
    requested_period,
    idempotency_key,
    checkout_condition_note
  )
  values (
    v_user_id,
    v_attendance.id,
    v_kit.id,
    p_period,
    'toolkit-rental-' || extensions.gen_random_uuid()::text,
    null
  )
  returning id into v_rental_id;

  update public.toolkit_kits
  set status = 'reserved'
  where id = v_kit.id;

  return v_rental_id;
end;
$$;

create or replace function public.add_toolkit_rental_item(
  p_toolkit_rental_session_id uuid,
  p_item_tag text,
  p_checkout_condition_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_rental public.toolkit_rental_sessions%rowtype;
  v_item public.toolkit_items%rowtype;
begin
  select * into v_rental
  from public.toolkit_rental_sessions
  where id = p_toolkit_rental_session_id
    and member_id = v_user_id
    and status = 'open'
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'open toolkit rental not found';
  end if;

  if not exists (
    select 1 from public.attendance_sessions attendance
    where attendance.id = v_rental.attendance_session_id
      and attendance.user_id = v_user_id
      and attendance.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'active on-site attendance is required';
  end if;

  select * into v_item
  from public.toolkit_items
  where item_tag = upper(btrim(p_item_tag))
    and toolkit_kit_id = v_rental.toolkit_kit_id
    and status = 'available'
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'toolkit item is not available in this kit';
  end if;

  insert into public.toolkit_rental_items (
    toolkit_rental_session_id,
    toolkit_item_id,
    checkout_condition_note
  )
  values (
    v_rental.id,
    v_item.id,
    nullif(btrim(p_checkout_condition_note), '')
  );

  update public.toolkit_items
  set
    status = 'checked_out',
    condition_note = coalesce(
      nullif(btrim(p_checkout_condition_note), ''),
      condition_note
    )
  where id = v_item.id;

  return v_item.id;
end;
$$;

create or replace function public.complete_toolkit_rental(
  p_toolkit_rental_session_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_rental public.toolkit_rental_sessions%rowtype;
begin
  select * into v_rental
  from public.toolkit_rental_sessions
  where id = p_toolkit_rental_session_id
    and member_id = v_user_id
    and status = 'open'
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'open toolkit rental not found';
  end if;

  if not exists (
    select 1 from public.attendance_sessions attendance
    where attendance.id = v_rental.attendance_session_id
      and attendance.user_id = v_user_id
      and attendance.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'active on-site attendance is required';
  end if;

  if not exists (
    select 1 from public.toolkit_rental_items rental_item
    where rental_item.toolkit_rental_session_id = v_rental.id
      and rental_item.returned_at is null
  ) then
    raise exception using errcode = '22023', message = 'toolkit rental has no scanned items';
  end if;

  if exists (
    select 1
    from public.toolkit_items item
    where item.toolkit_kit_id = v_rental.toolkit_kit_id
      and item.required
      and item.status <> 'maintenance'
      and not exists (
        select 1
        from public.toolkit_rental_items rental_item
        where rental_item.toolkit_rental_session_id = v_rental.id
          and rental_item.toolkit_item_id = item.id
          and rental_item.returned_at is null
      )
  ) then
    raise exception using errcode = '22023', message = 'required toolkit items are missing';
  end if;

  update public.toolkit_rental_sessions
  set status = 'checked_out', checked_out_at = now()
  where id = v_rental.id;
  update public.toolkit_kits
  set status = 'rented'
  where id = v_rental.toolkit_kit_id;

  return v_rental.id;
end;
$$;

create or replace function public.return_toolkit_rental(
  p_rental_id uuid,
  p_condition_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_staff boolean := private.is_staff(
    array['operations', 'admin', 'super_admin']::public.staff_role[]
  );
  v_rental public.toolkit_rental_sessions%rowtype;
  v_has_items boolean;
begin
  select * into v_rental
  from public.toolkit_rental_sessions
  where id = p_rental_id
    and status in ('open', 'checked_out')
    and (member_id = v_user_id or v_is_staff)
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'returnable toolkit rental not found';
  end if;

  if not v_is_staff and not exists (
    select 1 from public.attendance_sessions attendance
    where attendance.id = v_rental.attendance_session_id
      and attendance.user_id = v_user_id
      and attendance.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'active on-site attendance is required';
  end if;

  select exists (
    select 1 from public.toolkit_rental_items rental_item
    where rental_item.toolkit_rental_session_id = v_rental.id
      and rental_item.returned_at is null
  ) into v_has_items;

  update public.toolkit_items item
  set
    status = 'available',
    condition_note = coalesce(
      nullif(btrim(p_condition_note), ''),
      condition_note
    )
  where item.id in (
    select rental_item.toolkit_item_id
    from public.toolkit_rental_items rental_item
    where rental_item.toolkit_rental_session_id = v_rental.id
      and rental_item.returned_at is null
  );

  update public.toolkit_rental_items
  set
    returned_at = now(),
    return_condition_note = nullif(btrim(p_condition_note), '')
  where toolkit_rental_session_id = v_rental.id
    and returned_at is null;

  update public.toolkit_rental_sessions
  set
    status = (
      case when v_has_items then 'returned' else 'cancelled' end
    )::public.toolkit_rental_status,
    checked_out_at = case
      when v_has_items then coalesce(checked_out_at, now())
      else checked_out_at
    end,
    returned_at = case when v_has_items then now() else returned_at end,
    return_condition_note = nullif(btrim(p_condition_note), '')
  where id = v_rental.id;

  update public.toolkit_kits
  set
    status = 'available',
    condition_note = coalesce(
      nullif(btrim(p_condition_note), ''),
      condition_note
    )
  where id = v_rental.toolkit_kit_id;

  if v_is_staff then
    perform private.record_audit(
      v_user_id,
      'staff',
      'toolkit.staff_return',
      'toolkit_rental',
      v_rental.id,
      jsonb_build_object('status', v_rental.status),
      jsonb_build_object(
        'status',
        case when v_has_items then 'returned' else 'cancelled' end
      ),
      nullif(btrim(p_condition_note), '')
    );
  end if;

  return v_rental.id;
end;
$$;

revoke all on function public.request_locker_subscription(text, public.locker_plan_period) from public;
revoke all on function public.assign_locker_subscription(uuid, uuid) from public;
revoke all on function public.release_locker_subscription(uuid) from public;
revoke all on function public.extend_locker_subscription(uuid, public.locker_plan_period) from public;
revoke all on function public.create_consumable_order_draft(text, text) from public;
revoke all on function public.set_consumable_order_item(uuid, uuid, integer) from public;
revoke all on function public.submit_consumable_order(uuid) from public;
revoke all on function public.fulfill_consumable_order(uuid, text) from public;
revoke all on function public.create_consumable_order(jsonb) from public;
revoke all on function public.set_consumable_order_status(uuid, public.consumable_order_status) from public;
revoke all on function public.start_toolkit_rental(text, interval) from public;
revoke all on function public.add_toolkit_rental_item(uuid, text, text) from public;
revoke all on function public.complete_toolkit_rental(uuid) from public;
revoke all on function public.return_toolkit_rental(uuid, text) from public;

grant execute on function public.request_locker_subscription(text, public.locker_plan_period) to authenticated;
grant execute on function public.assign_locker_subscription(uuid, uuid) to authenticated;
grant execute on function public.release_locker_subscription(uuid) to authenticated;
grant execute on function public.extend_locker_subscription(uuid, public.locker_plan_period) to authenticated;
grant execute on function public.create_consumable_order_draft(text, text) to authenticated;
grant execute on function public.set_consumable_order_item(uuid, uuid, integer) to authenticated;
grant execute on function public.submit_consumable_order(uuid) to authenticated;
grant execute on function public.fulfill_consumable_order(uuid, text) to authenticated;
grant execute on function public.create_consumable_order(jsonb) to authenticated;
grant execute on function public.set_consumable_order_status(uuid, public.consumable_order_status) to authenticated;
grant execute on function public.start_toolkit_rental(text, interval) to authenticated;
grant execute on function public.add_toolkit_rental_item(uuid, text, text) to authenticated;
grant execute on function public.complete_toolkit_rental(uuid) to authenticated;
grant execute on function public.return_toolkit_rental(uuid, text) to authenticated;

revoke all on public.locker_plans from anon, authenticated;
revoke all on public.lockers from anon, authenticated;
revoke all on public.locker_assignments from anon, authenticated;
revoke all on public.consumable_skus from anon, authenticated;
revoke all on public.consumable_orders from anon, authenticated;
revoke all on public.consumable_order_items from anon, authenticated;
revoke all on public.toolkit_templates from anon, authenticated;
revoke all on public.toolkit_template_items from anon, authenticated;
revoke all on public.toolkit_kits from anon, authenticated;
revoke all on public.toolkit_items from anon, authenticated;
revoke all on public.toolkit_rental_sessions from anon, authenticated;
revoke all on public.toolkit_rental_items from anon, authenticated;
revoke all on public.toolkit_condition_evidence from anon, authenticated;

grant select, insert, update, delete on public.locker_plans to authenticated;
grant select, insert, update, delete on public.lockers to authenticated;
grant select, insert, update, delete on public.locker_assignments to authenticated;
grant select, insert, update, delete on public.consumable_skus to authenticated;
grant select, insert, update, delete on public.consumable_orders to authenticated;
grant select, insert, update, delete on public.consumable_order_items to authenticated;
grant select, insert, update, delete on public.toolkit_templates to authenticated;
grant select, insert, update, delete on public.toolkit_template_items to authenticated;
grant select, insert, update, delete on public.toolkit_kits to authenticated;
grant select, insert, update, delete on public.toolkit_items to authenticated;
grant select, insert, update, delete on public.toolkit_rental_sessions to authenticated;
grant select, insert, update, delete on public.toolkit_rental_items to authenticated;
grant select, insert, update, delete on public.toolkit_condition_evidence to authenticated;

grant select on public.public_locker_catalog to anon, authenticated;
grant select on public.public_consumable_catalog to anon, authenticated;
grant select on public.public_toolkit_catalog to anon, authenticated;

create policy toolkit_evidence_objects_member_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'inventory-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'toolkits'
  and exists (
    select 1
    from public.toolkit_rental_sessions rental
    where rental.id::text = (storage.foldername(name))[3]
      and rental.member_id = (select auth.uid())
      and rental.status in ('open', 'checked_out')
  )
);

insert into public.locker_plans (
  slug,
  offering_slug,
  name,
  description,
  period,
  duration,
  price_inr_including_gst
)
values
  (
    'weekly-locker',
    'maker-locker',
    'Weekly locker',
    'A short-term locker request for project hardware stored inside the lab.',
    'week',
    interval '7 days',
    null
  ),
  (
    'monthly-locker',
    'maker-locker',
    'Monthly locker',
    'A monthly locker request for active maker projects.',
    'month',
    interval '1 month',
    null
  ),
  (
    'annual-locker',
    'maker-locker',
    'Annual locker',
    'A long-term locker request for resident maker projects.',
    'year',
    interval '1 year',
    null
  );
