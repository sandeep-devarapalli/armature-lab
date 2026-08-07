begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

select is(
  (
    select count(*)::integer
    from public.locker_plans
    where active
      and offering_slug in (
        'small-parts-locker',
        'medium-project-locker',
        'tall-build-locker'
      )
  ),
  9,
  'three locker sizes each provide week, month, and year terms'
);

select is(
  (
    select count(distinct period)::integer
    from public.locker_plans
    where offering_slug = 'tall-build-locker'
  ),
  3,
  'tall build lockers offer every subscription term'
);

select is(
  (
    select count(*)::integer
    from public.consumable_skus
    where sku_code in (
      'ARM-CNS-SCREWS',
      'ARM-CNS-NUTS',
      'ARM-CNS-WIRE',
      'ARM-CNS-JUMPERS',
      'ARM-CNS-HEATSHRINK',
      'ARM-CNS-CONNECTORS',
      'ARM-CNS-TIES',
      'ARM-CNS-BREADBOARD',
      'ARM-CNS-PERFBOARD',
      'ARM-CNS-SOLDER',
      'ARM-CNS-FLUX',
      'ARM-CNS-FUSES',
      'ARM-CNS-ADHESIVE',
      'ARM-CNS-ALKALINE'
    )
  ),
  14,
  'maker desk seeds every published bench-stock line'
);

select is(
  (
    select count(*)::integer
    from public.public_consumable_catalog
    where availability_status = 'unavailable'
      and sku_code <> 'ARM-CNS-TESTWIRE'
  ),
  14,
  'unverified consumable stock remains unavailable until staff counts a lot'
);

select is(
  (
    select count(*)::integer
    from public.toolkit_templates
    where slug in (
      'electronics-bench-kit',
      'mechanical-assembly-kit',
      'portable-soldering-kit',
      'precision-toolkit',
      'field-diagnostics-kit'
    )
  ),
  5,
  'maker desk seeds five portable toolkit templates'
);

select is(
  (
    select count(*)::integer
    from public.toolkit_template_items item
    join public.toolkit_templates template
      on template.id = item.toolkit_template_id
    where template.slug in (
      'electronics-bench-kit',
      'mechanical-assembly-kit',
      'portable-soldering-kit',
      'precision-toolkit',
      'field-diagnostics-kit'
    )
  ),
  30,
  'published toolkit templates have complete contents checklists'
);

select is(
  (
    select count(*)::integer
    from public.public_toolkit_catalog
    where slug in (
      'electronics-bench-kit',
      'mechanical-assembly-kit',
      'portable-soldering-kit',
      'precision-toolkit',
      'field-diagnostics-kit'
    )
      and availability_status = 'unavailable'
  ),
  5,
  'toolkit templates stay unavailable until physical tagged kits are enrolled'
);

insert into public.locations (id, slug, name, timezone, active)
values (
  '27000000-0000-4000-8000-000000000001',
  'maker-catalog-test-lab',
  'Maker catalog test lab',
  'Asia/Kolkata',
  true
);

insert into public.lockers (
  id,
  location_id,
  code,
  size_label,
  metadata
)
values
  (
    '27000000-0000-4000-8000-000000000002',
    '27000000-0000-4000-8000-000000000001',
    'ARM-LKR-CAT01',
    'Small',
    '{"offering_slug":"small-parts-locker"}'
  ),
  (
    '27000000-0000-4000-8000-000000000003',
    '27000000-0000-4000-8000-000000000001',
    'ARM-LKR-CAT02',
    'Small',
    '{"offering_slug":"small-parts-locker"}'
  ),
  (
    '27000000-0000-4000-8000-000000000004',
    '27000000-0000-4000-8000-000000000001',
    'ARM-LKR-CAT03',
    'Tall',
    '{"offering_slug":"tall-build-locker"}'
  );

select is(
  (
    select availability_status
    from public.public_locker_catalog
    where offering_slug = 'small-parts-locker'
      and period = 'week'
  ),
  'available',
  'locker availability counts only units matching the requested size'
);

select is(
  (
    select availability_status
    from public.public_locker_catalog
    where offering_slug = 'tall-build-locker'
      and period = 'week'
  ),
  'low_stock',
  'one matching locker is reported as low stock'
);

select * from finish();

rollback;
