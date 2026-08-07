update public.locker_plans
set
  slug = case period
    when 'week' then 'small-parts-locker-week'
    when 'month' then 'small-parts-locker-month'
    when 'year' then 'small-parts-locker-year'
  end,
  offering_slug = 'small-parts-locker',
  name = case period
    when 'week' then 'Small parts locker - one week'
    when 'month' then 'Small parts locker - one month'
    when 'year' then 'Small parts locker - one year'
  end,
  description = 'Secure storage for controllers, sensors, hand tools, and project boxes.'
where offering_slug = 'maker-locker';

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
    'medium-project-locker-week',
    'medium-project-locker',
    'Medium project locker - one week',
    'Secure storage for robot subassemblies, test equipment, and work in progress.',
    'week',
    interval '7 days',
    null
  ),
  (
    'medium-project-locker-month',
    'medium-project-locker',
    'Medium project locker - one month',
    'Secure storage for robot subassemblies, test equipment, and work in progress.',
    'month',
    interval '1 month',
    null
  ),
  (
    'medium-project-locker-year',
    'medium-project-locker',
    'Medium project locker - one year',
    'Secure storage for robot subassemblies, test equipment, and work in progress.',
    'year',
    interval '1 year',
    null
  ),
  (
    'tall-build-locker-week',
    'tall-build-locker',
    'Tall build locker - one week',
    'Secure vertical storage for larger project cases and long-form assemblies.',
    'week',
    interval '7 days',
    null
  ),
  (
    'tall-build-locker-month',
    'tall-build-locker',
    'Tall build locker - one month',
    'Secure vertical storage for larger project cases and long-form assemblies.',
    'month',
    interval '1 month',
    null
  ),
  (
    'tall-build-locker-year',
    'tall-build-locker',
    'Tall build locker - one year',
    'Secure vertical storage for larger project cases and long-form assemblies.',
    'year',
    interval '1 year',
    null
  )
on conflict (offering_slug, period) do update
set
  name = excluded.name,
  description = excluded.description,
  duration = excluded.duration,
  price_inr_including_gst = excluded.price_inr_including_gst,
  active = true;

create or replace view public.public_locker_catalog
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
    and locker.metadata ->> 'offering_slug' = plan.offering_slug
    and not exists (
      select 1
      from public.locker_assignments assignment
      where assignment.locker_id = locker.id
        and assignment.status in ('reserved', 'active')
        and assignment.assignment_period
          && tstzrange(now(), now() + plan.duration, '[)')
    )
) availability on true
where plan.active;

comment on view public.public_locker_catalog is
  'Public size-specific locker plans with placeholder-capable INR pricing and coarse availability only.';

with catalog (
  id,
  slug,
  name,
  description,
  category,
  unit,
  safety_notes
) as (
  values
    (
      '72000000-0000-4000-8000-000000000001'::uuid,
      'metric-screw-assortment',
      'Metric screw assortment',
      'Common M2, M3, M4, and M5 machine screws for enclosures and mechanisms.',
      'Fasteners',
      'assorted pack',
      'Return unused pieces to the correctly labelled compartment.'
    ),
    (
      '72000000-0000-4000-8000-000000000002'::uuid,
      'metric-nuts-washers',
      'Metric nuts and washers',
      'Matching nuts, flat washers, and lock washers for common metric builds.',
      'Fasteners',
      'assorted pack',
      'Select the matching thread before tightening an assembly.'
    ),
    (
      '72000000-0000-4000-8000-000000000003'::uuid,
      'hookup-wire',
      'Hookup wire',
      'Stranded wire in multiple colours for low-voltage prototypes.',
      'Wire and cable',
      'cut length',
      'Use only within the wire marked voltage and current limits.'
    ),
    (
      '72000000-0000-4000-8000-000000000004'::uuid,
      'jumper-wires',
      'Jumper wires',
      'Male-male, male-female, and female-female leads for breadboard work.',
      'Wire and cable',
      'set',
      'Inspect loose terminals before applying power.'
    ),
    (
      '72000000-0000-4000-8000-000000000005'::uuid,
      'heat-shrink-tubing',
      'Heat-shrink tubing',
      'Assorted diameters for insulating joints and adding strain relief.',
      'Wire and cable',
      'assorted pack',
      'Use a controlled heat source at the designated bench.'
    ),
    (
      '72000000-0000-4000-8000-000000000006'::uuid,
      'headers-connectors',
      'Headers and connectors',
      'Breakaway headers, terminal blocks, and common crimp housings.',
      'Prototyping',
      'assorted pack',
      'Use the correct crimp tool and verify polarity before power-up.'
    ),
    (
      '72000000-0000-4000-8000-000000000007'::uuid,
      'cable-ties',
      'Cable ties',
      'Reusable and single-use ties for routing prototype wiring.',
      'Wire and cable',
      'pack',
      'Trim ends flush and avoid compressing delicate cables.'
    ),
    (
      '72000000-0000-4000-8000-000000000008'::uuid,
      'breadboards',
      'Solderless breadboards',
      'Reusable boards for low-voltage circuit experiments.',
      'Prototyping',
      'board',
      'Disconnect power before changing circuit wiring.'
    ),
    (
      '72000000-0000-4000-8000-000000000009'::uuid,
      'perfboard',
      'Perfboard',
      'Cuttable prototyping board for permanent hand-soldered circuits.',
      'Prototyping',
      'sheet',
      'Cut and solder only at the appropriate fabrication bench.'
    ),
    (
      '72000000-0000-4000-8000-000000000010'::uuid,
      'electronics-solder',
      'Electronics solder',
      'Small workshop quantities for electronics assembly and repair.',
      'Soldering',
      'small spool',
      'Use extraction, wash hands after use, and follow the spool handling label.'
    ),
    (
      '72000000-0000-4000-8000-000000000011'::uuid,
      'electronics-flux',
      'Electronics flux',
      'Controlled quantities of electronics-grade flux for rework and assembly.',
      'Soldering',
      'small container',
      'Use extraction and keep the container closed outside the soldering area.'
    ),
    (
      '72000000-0000-4000-8000-000000000012'::uuid,
      'low-voltage-fuses',
      'Low-voltage fuse assortment',
      'Common replaceable fuses for protected bench prototypes.',
      'Protection',
      'assorted pack',
      'Replace only with the specified type and rating after finding the fault.'
    ),
    (
      '72000000-0000-4000-8000-000000000013'::uuid,
      'prototype-adhesives',
      'Prototype adhesives',
      'Small packs of approved tape and general-purpose project adhesive.',
      'Adhesives',
      'pack',
      'Use only approved products in ventilated work areas and follow their labels.'
    ),
    (
      '72000000-0000-4000-8000-000000000014'::uuid,
      'alkaline-batteries',
      'Sealed alkaline batteries',
      'AA and 9V non-rechargeable cells for low-power test equipment and prototypes.',
      'Batteries',
      'pack',
      'Do not recharge or mix cells. Tape exposed 9V terminals and use the battery-return bin.'
    )
)
insert into public.components (
  id,
  slug,
  name,
  description,
  category,
  inventory_kind,
  unit,
  target_quantity,
  reorder_threshold,
  safety_notes,
  metadata
)
select
  catalog.id,
  catalog.slug,
  catalog.name,
  catalog.description,
  catalog.category,
  'consumable'::public.component_inventory_kind,
  catalog.unit,
  0,
  0,
  catalog.safety_notes,
  '{"maker_desk":true,"stock_requires_count":true}'::jsonb
from catalog
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  inventory_kind = excluded.inventory_kind,
  unit = excluded.unit,
  safety_notes = excluded.safety_notes,
  metadata = public.components.metadata || excluded.metadata,
  active = true;

with sku_catalog (
  component_slug,
  sku_code,
  name,
  description,
  order_unit
) as (
  values
    ('metric-screw-assortment', 'ARM-CNS-SCREWS', 'Metric screw assortment', 'M2 to M5 fasteners for lab pickup.', 'assorted pack'),
    ('metric-nuts-washers', 'ARM-CNS-NUTS', 'Metric nuts and washers', 'Matching nuts and washers for lab pickup.', 'assorted pack'),
    ('hookup-wire', 'ARM-CNS-WIRE', 'Hookup wire', 'Low-voltage stranded wire cut at the tool desk.', 'cut length'),
    ('jumper-wires', 'ARM-CNS-JUMPERS', 'Jumper wires', 'Common breadboard jumper-wire set.', 'set'),
    ('heat-shrink-tubing', 'ARM-CNS-HEATSHRINK', 'Heat-shrink tubing', 'Assorted heat-shrink sizes.', 'assorted pack'),
    ('headers-connectors', 'ARM-CNS-CONNECTORS', 'Headers and connectors', 'Common prototype connectors and headers.', 'assorted pack'),
    ('cable-ties', 'ARM-CNS-TIES', 'Cable ties', 'Reusable and single-use cable ties.', 'pack'),
    ('breadboards', 'ARM-CNS-BREADBOARD', 'Solderless breadboard', 'Reusable low-voltage prototyping board.', 'board'),
    ('perfboard', 'ARM-CNS-PERFBOARD', 'Perfboard', 'Cuttable permanent prototyping board.', 'sheet'),
    ('electronics-solder', 'ARM-CNS-SOLDER', 'Electronics solder', 'Workshop quantity for approved soldering benches.', 'small spool'),
    ('electronics-flux', 'ARM-CNS-FLUX', 'Electronics flux', 'Workshop quantity for approved soldering benches.', 'small container'),
    ('low-voltage-fuses', 'ARM-CNS-FUSES', 'Low-voltage fuse assortment', 'Common replacement fuses for protected prototypes.', 'assorted pack'),
    ('prototype-adhesives', 'ARM-CNS-ADHESIVE', 'Prototype adhesives', 'Approved tapes and project adhesives.', 'pack'),
    ('alkaline-batteries', 'ARM-CNS-ALKALINE', 'Sealed alkaline batteries', 'AA and 9V cells for low-power equipment.', 'pack')
)
insert into public.consumable_skus (
  component_id,
  sku_code,
  name,
  description,
  order_unit,
  quantity_per_order_unit,
  reference_price_inr_including_gst,
  metadata
)
select
  component.id,
  sku_catalog.sku_code,
  sku_catalog.name,
  sku_catalog.description,
  sku_catalog.order_unit,
  1,
  null,
  jsonb_build_object(
    'component_slug',
    sku_catalog.component_slug,
    'price_requires_staff_entry',
    true
  )
from sku_catalog
join public.components component on component.slug = sku_catalog.component_slug
on conflict (sku_code) do update
set
  component_id = excluded.component_id,
  name = excluded.name,
  description = excluded.description,
  order_unit = excluded.order_unit,
  quantity_per_order_unit = excluded.quantity_per_order_unit,
  metadata = public.consumable_skus.metadata || excluded.metadata,
  active = true;

with templates (id, slug, name, description, safety_notes) as (
  values
    (
      '73000000-0000-4000-8000-000000000001'::uuid,
      'electronics-bench-kit',
      'Electronics bench kit',
      'Portable essentials for wiring, prototyping, and board-level checks.',
      'Use only on de-energized circuits unless the bench procedure permits live testing.'
    ),
    (
      '73000000-0000-4000-8000-000000000002'::uuid,
      'mechanical-assembly-kit',
      'Mechanical assembly kit',
      'A compact toolbox for robot frames, mounts, and enclosures.',
      'Wear eye protection and secure the work before applying torque.'
    ),
    (
      '73000000-0000-4000-8000-000000000003'::uuid,
      'portable-soldering-kit',
      'Portable soldering kit',
      'A controlled kit for electronics assembly at designated soldering stations.',
      'Use only at an extraction-equipped soldering station after the required induction.'
    ),
    (
      '73000000-0000-4000-8000-000000000004'::uuid,
      'precision-repair-kit',
      'Precision repair kit',
      'Small drivers and handling tools for sensors, cameras, and compact mechanisms.',
      'Keep removed fasteners contained and use ESD controls for exposed electronics.'
    ),
    (
      '73000000-0000-4000-8000-000000000005'::uuid,
      'field-diagnostics-kit',
      'Field diagnostics kit',
      'Portable electrical and network checks for mobile robots around the lab.',
      'De-energize the system before continuity checks and isolate moving equipment.'
    )
)
insert into public.toolkit_templates (
  id,
  slug,
  name,
  description,
  safety_notes
)
select * from templates
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  safety_notes = excluded.safety_notes,
  active = true;

with items (template_slug, item_name, quantity, required, display_order) as (
  values
    ('electronics-bench-kit', 'Wire stripper', 1, true, 1),
    ('electronics-bench-kit', 'Flush cutters', 1, true, 2),
    ('electronics-bench-kit', 'Needle-nose pliers', 1, true, 3),
    ('electronics-bench-kit', 'Digital multimeter', 1, true, 4),
    ('electronics-bench-kit', 'Test-lead set', 1, true, 5),
    ('electronics-bench-kit', 'Crimp tool', 1, true, 6),
    ('mechanical-assembly-kit', 'Metric hex-key set', 1, true, 1),
    ('mechanical-assembly-kit', 'Combination screwdriver set', 1, true, 2),
    ('mechanical-assembly-kit', 'Small socket set', 1, true, 3),
    ('mechanical-assembly-kit', 'Adjustable spanner', 1, true, 4),
    ('mechanical-assembly-kit', 'Pliers', 1, true, 5),
    ('mechanical-assembly-kit', 'Tape measure', 1, true, 6),
    ('portable-soldering-kit', 'Temperature-controlled soldering unit', 1, true, 1),
    ('portable-soldering-kit', 'Iron stand', 1, true, 2),
    ('portable-soldering-kit', 'Tip cleaner', 1, true, 3),
    ('portable-soldering-kit', 'Desoldering pump', 1, true, 4),
    ('portable-soldering-kit', 'Solder wick', 1, true, 5),
    ('portable-soldering-kit', 'Heat-resistant mat', 1, true, 6),
    ('precision-repair-kit', 'Precision screwdriver set', 1, true, 1),
    ('precision-repair-kit', 'ESD tweezers', 2, true, 2),
    ('precision-repair-kit', 'Plastic opening tools', 2, true, 3),
    ('precision-repair-kit', 'Small parts tray', 1, true, 4),
    ('precision-repair-kit', 'Inspection loupe', 1, true, 5),
    ('field-diagnostics-kit', 'Digital multimeter', 1, true, 1),
    ('field-diagnostics-kit', 'Clamp meter', 1, true, 2),
    ('field-diagnostics-kit', 'USB logic analyzer', 1, true, 3),
    ('field-diagnostics-kit', 'USB network adapter', 1, true, 4),
    ('field-diagnostics-kit', 'Test-lead set', 1, true, 5),
    ('field-diagnostics-kit', 'Cable and adapter pouch', 1, true, 6)
)
insert into public.toolkit_template_items (
  toolkit_template_id,
  item_name,
  quantity,
  required,
  display_order
)
select
  template.id,
  items.item_name,
  items.quantity,
  items.required,
  items.display_order
from items
join public.toolkit_templates template on template.slug = items.template_slug
on conflict (toolkit_template_id, item_name) do update
set
  quantity = excluded.quantity,
  required = excluded.required,
  display_order = excluded.display_order;
