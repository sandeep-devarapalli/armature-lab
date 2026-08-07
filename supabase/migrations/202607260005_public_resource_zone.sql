create or replace view public.public_resources
with (security_barrier = true)
as
select
  resource.id,
  resource.slug,
  resource.name,
  resource.description,
  resource.kind,
  resource.risk,
  resource.capacity,
  resource.max_guests,
  resource.guests_allowed,
  resource.reservable,
  resource.image_url,
  resource.default_duration_minutes,
  resource.increment_minutes,
  resource.max_duration_minutes,
  resource.booking_horizon_days,
  location.slug as location_slug,
  location.name as location_name,
  location.timezone,
  resource.metadata ->> 'zone' as zone
from public.resources resource
join public.locations location on location.id = resource.location_id
where resource.active and location.active;

comment on view public.public_resources is
  'Safe public resource projection, including only the display zone from operational metadata.';

grant select on public.public_resources to anon, authenticated;
