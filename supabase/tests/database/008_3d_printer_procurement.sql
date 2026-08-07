begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

select has_column(
  'public',
  'component_offers',
  'customer_rating',
  'component offers record dated customer ratings'
);

select is(
  (
    select sum(target_quantity)::integer
    from public.components
    where slug in ('bambu-lab-a1', 'bambu-lab-p1s-combo', 'elegoo-neptune-4-plus')
  ),
  3,
  'fabrication fleet targets three printers'
);

select is(
  (
    select count(*)::integer
    from public.component_offers offer
    join public.components component on component.id = offer.component_id
    where component.slug in ('bambu-lab-a1', 'bambu-lab-p1s-combo', 'elegoo-neptune-4-plus')
      and offer.vendor_name = 'Amazon.in'
      and offer.sku like 'ASIN %'
      and offer.customer_rating is not null
      and offer.customer_rating_count is not null
      and offer.rating_source = 'Amazon.in'
  ),
  3,
  'all three printer models have dated Amazon listing audits'
);

select is(
  (
    select count(*)::integer
    from public.project_components mapping
    join public.components component on component.id = mapping.component_id
    where component.slug in ('bambu-lab-a1', 'bambu-lab-p1s-combo', 'elegoo-neptune-4-plus')
  ),
  11,
  'printer capacity is mapped to fabrication-heavy projects'
);

select * from finish();

rollback;
