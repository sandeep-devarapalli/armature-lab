update public.toolkit_templates
set
  slug = 'precision-toolkit',
  name = 'Precision toolkit',
  description = 'Small-format tools for sensors, cameras, controllers, and delicate assemblies.',
  safety_notes = 'Use the wrist strap only at a verified ESD-safe workstation.'
where slug = 'precision-repair-kit';

update public.toolkit_template_items item
set item_name = case item.item_name
  when 'Test-lead set' then 'Test leads'
  when 'Metric hex-key set' then 'Metric hex keys'
  when 'Combination screwdriver set' then 'Combination screwdrivers'
  when 'Precision screwdriver set' then 'Precision bit driver'
  when 'Small parts tray' then 'Fine pliers'
  when 'Clamp meter' then 'DC clamp meter'
  when 'USB logic analyzer' then 'USB power meter'
  when 'USB network adapter' then 'Logic probe'
  when 'Cable and adapter pouch' then 'Cable and connector adapters'
  else item.item_name
end
where item.item_name in (
  'Test-lead set',
  'Metric hex-key set',
  'Combination screwdriver set',
  'Precision screwdriver set',
  'Small parts tray',
  'Clamp meter',
  'USB logic analyzer',
  'USB network adapter',
  'Cable and adapter pouch'
);

insert into public.toolkit_template_items (
  toolkit_template_id,
  item_name,
  quantity,
  required,
  display_order
)
select
  template.id,
  'ESD wrist strap',
  1,
  true,
  6
from public.toolkit_templates template
where template.slug = 'precision-toolkit'
on conflict (toolkit_template_id, item_name) do update
set quantity = excluded.quantity, required = excluded.required;

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
  v_offering_slug text;
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

  select plan.offering_slug into v_offering_slug
  from public.locker_plans plan
  where plan.id = v_assignment.locker_plan_id;

  if coalesce(v_locker.metadata ->> 'offering_slug', '') <> v_offering_slug then
    raise exception using
      errcode = '22023',
      message = 'physical locker size does not match the requested offering';
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
      v_locker.code,
      'offering_slug',
      v_offering_slug
    ),
    'Physical locker assigned'
  );

  return v_assignment.id;
end;
$$;
