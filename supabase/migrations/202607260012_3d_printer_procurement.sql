alter table public.component_offers
  add column customer_rating numeric(2, 1),
  add column customer_rating_count integer,
  add column rating_source text,
  add constraint component_offers_customer_rating_range check (
    customer_rating is null or customer_rating between 0 and 5
  ),
  add constraint component_offers_customer_rating_count_nonnegative check (
    customer_rating_count is null or customer_rating_count >= 0
  ),
  add constraint component_offers_rating_source_length check (
    rating_source is null or char_length(btrim(rating_source)) between 2 and 120
  ),
  add constraint component_offers_rating_complete check (
    (customer_rating is null and customer_rating_count is null and rating_source is null)
    or (customer_rating is not null and customer_rating_count is not null and rating_source is not null)
  );

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
values
  (
    '70000000-0000-4000-8000-000000000020',
    'bambu-lab-a1',
    'Bambu Lab A1 FDM printer',
    'Open-frame 256 x 256 x 256 mm FDM printer for routine PLA, PETG, TPU, and PVA robotics parts.',
    'Fabrication',
    'fixed_bookable',
    'printer',
    1,
    0,
    'Do not use for ABS, ASA, PC, PA, PET, or fibre-filled polymers. Keep the motion envelope clear.',
    '{"manufacturer_url":"https://bambulab.com/hu/a1/tech-specs","recommended_filaments":["PLA","PETG","TPU","PVA"],"build_volume_mm":[256,256,256]}'::jsonb
  ),
  (
    '70000000-0000-4000-8000-000000000021',
    'bambu-lab-p1s-combo',
    'Bambu Lab P1S Combo enclosed FDM printer',
    'Enclosed 256 x 256 x 256 mm CoreXY printer for ABS, ASA, and functional robotics parts.',
    'Fabrication',
    'fixed_bookable',
    'printer',
    1,
    0,
    'Use room extraction for ABS or ASA. The enclosure and carbon filter do not replace ventilation controls.',
    '{"manufacturer_url":"https://bambulab.com/en-us/p1p","recommended_filaments":["PLA","PETG","TPU","PVA","PET","ABS","ASA"],"build_volume_mm":[256,256,256],"ams_included":true}'::jsonb
  ),
  (
    '70000000-0000-4000-8000-000000000022',
    'elegoo-neptune-4-plus',
    'ELEGOO Neptune 4 Plus large-format FDM printer',
    'Large-format 320 x 320 x 385 mm FDM printer for rover panels, housings, fixtures, and robot structures.',
    'Fabrication',
    'fixed_bookable',
    'printer',
    1,
    0,
    'Use an enclosure and room extraction for ABS or ASA. Allow the full operating envelope on a deep, stable bench.',
    '{"manufacturer_url":"https://us.elegoo.com/products/neptune-4-plus-fdm-3d-printer","supported_filaments":["PLA","TPU","PETG","ABS","ASA","nylon"],"build_volume_mm":[320,320,385],"operating_envelope_mm":[578,750,860]}'::jsonb
  )
on conflict (id) do nothing;

insert into public.component_offers (
  id,
  component_id,
  vendor_name,
  variant,
  sku,
  order_url,
  display_price_inr,
  price_inr_including_gst,
  stock_status,
  checked_on,
  warranty_note,
  is_preferred,
  requires_validation,
  notes,
  customer_rating,
  customer_rating_count,
  rating_source
)
values
  (
    '71000000-0000-4000-8000-000000000018',
    '70000000-0000-4000-8000-000000000020',
    'Amazon.in',
    'Bambu Lab A1; 256 x 256 x 256 mm',
    'ASIN B0DPXBT99W',
    'https://www.amazon.in/dp/B0DPXBT99W',
    35199,
    35199,
    'in_stock',
    date '2026-07-26',
    'Confirm seller authorization, Bambu Lab India warranty, returns, GST invoice, and local service before PO.',
    true,
    true,
    'Rating and price are listing-specific snapshots. Review sample is small.',
    5.0,
    14,
    'Amazon.in'
  ),
  (
    '71000000-0000-4000-8000-000000000019',
    '70000000-0000-4000-8000-000000000021',
    'Amazon.in',
    'WOL3D Bambu Lab P1S Combo with AMS; 256 x 256 x 256 mm',
    'ASIN B0DSLLGZ3L',
    'https://www.amazon.in/dp/B0DSLLGZ3L',
    81999,
    81999,
    'in_stock',
    date '2026-07-26',
    'Confirm seller authorization, Bambu Lab India warranty, returns, GST invoice, and local service before PO.',
    true,
    true,
    'Rating and price are listing-specific snapshots. Recheck lead time and whether AMS is required.',
    4.6,
    10,
    'Amazon.in'
  ),
  (
    '71000000-0000-4000-8000-000000000020',
    '70000000-0000-4000-8000-000000000022',
    'Amazon.in',
    'ELEGOO Neptune 4 Plus; 320 x 320 x 385 mm',
    'ASIN B0CN4GDF1D',
    'https://www.amazon.in/dp/B0CN4GDF1D',
    38999,
    38999,
    'in_stock',
    date '2026-07-26',
    'Confirm WOL 3D seller authorization, ELEGOO India warranty, returns, GST invoice, and local service before PO.',
    true,
    true,
    'Rating sample is very small. Confirm the Type-C or ribbon-cable hardware revision.',
    4.7,
    5,
    'Amazon.in'
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
  ('so-arm100-so101', '70000000-0000-4000-8000-000000000020', 'optional', 1, 'Routine open-frame FDM capacity.'),
  ('gem', '70000000-0000-4000-8000-000000000020', 'required', 1, 'Routine open-frame FDM capacity.'),
  ('gem', '70000000-0000-4000-8000-000000000022', 'optional', 1, 'Large-format fabrication option.'),
  ('orca-hand', '70000000-0000-4000-8000-000000000020', 'required', 1, 'Routine open-frame FDM capacity.'),
  ('orca-hand', '70000000-0000-4000-8000-000000000021', 'optional', 1, 'Enclosed material option.'),
  ('amazinghand', '70000000-0000-4000-8000-000000000020', 'required', 1, 'Routine open-frame FDM capacity.'),
  ('amazinghand', '70000000-0000-4000-8000-000000000021', 'optional', 1, 'Enclosed material option.'),
  ('dexhand-v1', '70000000-0000-4000-8000-000000000020', 'required', 1, 'Routine open-frame FDM capacity.'),
  ('dexhand-v1', '70000000-0000-4000-8000-000000000021', 'optional', 1, 'Enclosed material option.'),
  ('openmower', '70000000-0000-4000-8000-000000000022', 'optional', 1, 'Large-format outdoor housing option.'),
  ('nasa-rover', '70000000-0000-4000-8000-000000000022', 'optional', 1, 'Large-format rover structure option.')
on conflict do nothing;
