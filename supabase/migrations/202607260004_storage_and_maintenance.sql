insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('certification-evidence', 'certification-evidence', false, 26214400),
  ('operational-documents', 'operational-documents', false, 26214400)
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit;

create policy avatars_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'avatars');

create policy avatars_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy certification_evidence_member_read on storage.objects
for select to authenticated
using (
  bucket_id = 'certification-evidence'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_staff(null))
  )
);

create policy certification_evidence_staff_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'certification-evidence'
  and (select private.is_staff(array['safety', 'admin', 'super_admin']::public.staff_role[]))
);

create policy certification_evidence_staff_update on storage.objects
for update to authenticated
using (
  bucket_id = 'certification-evidence'
  and (select private.is_staff(array['safety', 'admin', 'super_admin']::public.staff_role[]))
)
with check (
  bucket_id = 'certification-evidence'
  and (select private.is_staff(array['safety', 'admin', 'super_admin']::public.staff_role[]))
);

create policy certification_evidence_staff_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'certification-evidence'
  and (select private.is_staff(array['safety', 'admin', 'super_admin']::public.staff_role[]))
);

create policy operational_documents_staff_all on storage.objects
for all to authenticated
using (
  bucket_id = 'operational-documents'
  and (select private.is_staff(null))
)
with check (
  bucket_id = 'operational-documents'
  and (select private.is_staff(null))
);

create or replace function private.prevent_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '42501', message = 'audit events are immutable';
end;
$$;

create trigger audit_events_immutable
before update or delete on public.audit_events
for each row execute function private.prevent_audit_mutation();

create or replace function public.claim_due_reminders(
  p_limit integer default 50
)
returns setof public.reminder_deliveries
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with claimed as (
    select reminder.id
    from public.reminder_deliveries reminder
    join public.bookings booking on booking.id = reminder.booking_id
    where reminder.status in ('pending', 'failed')
      and reminder.scheduled_for <= now()
      and booking.status = 'confirmed'
      and booking.starts_at > now()
    order by reminder.scheduled_for
    limit least(greatest(p_limit, 1), 200)
    for update of reminder skip locked
  )
  update public.reminder_deliveries reminder
  set
    status = 'processing',
    attempt_count = reminder.attempt_count + 1,
    last_error = null
  from claimed
  where reminder.id = claimed.id
  returning reminder.*;
end;
$$;

create or replace function public.complete_reminder(
  p_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.reminder_deliveries
  set status = 'sent', delivered_at = now(), last_error = null
  where id = p_id;
$$;

create or replace function public.fail_reminder(
  p_id uuid,
  p_error text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.reminder_deliveries
  set
    status = case
      when attempt_count >= 6 then 'skipped'::public.reminder_status
      else 'failed'::public.reminder_status
    end,
    last_error = left(p_error, 4000)
  where id = p_id;
$$;

create or replace function public.run_attendance_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auto_closed integer := 0;
  v_no_shows integer := 0;
  v_expired_intents integer := 0;
  v_deleted_nonces integer := 0;
  v_released_jobs integer := 0;
  v_released_reminders integer := 0;
begin
  with closed as (
    update public.attendance_sessions session
    set
      status = 'auto_closed',
      checked_out_at = now(),
      review_flags = session.review_flags || '["auto_closed_after_grace"]'::jsonb
    from public.bookings booking
    join public.resources resource on resource.id = booking.resource_id
    where session.booking_id = booking.id
      and session.status = 'active'
      and now() > booking.ends_at + make_interval(mins => resource.checkout_grace_minutes)
    returning session.id, session.user_id, session.booking_id
  ), events as (
    insert into public.access_events (
      user_id,
      session_id,
      booking_id,
      event_type,
      reason
    )
    select
      closed.user_id,
      closed.id,
      closed.booking_id,
      'auto_close',
      'Booking checkout grace period elapsed'
    from closed
    returning 1
  )
  select count(*) into v_auto_closed from events;

  with marked as (
    update public.bookings booking
    set status = 'no_show'
    from public.resources resource
    where booking.resource_id = resource.id
      and booking.status = 'confirmed'
      and now() > booking.starts_at + make_interval(mins => resource.checkin_late_minutes)
      and not exists (
        select 1
        from public.attendance_sessions session
        where session.booking_id = booking.id
      )
    returning booking.id
  ), released as (
    update public.resource_reservations reservation
    set released_at = now()
    from marked
    where reservation.booking_id = marked.id
      and reservation.released_at is null
    returning reservation.id
  )
  select count(*) into v_no_shows from marked;

  update public.checkin_intents
  set status = 'expired'
  where status = 'pending' and expires_at <= now();
  get diagnostics v_expired_intents = row_count;

  delete from public.kiosk_request_nonces where expires_at <= now();
  get diagnostics v_deleted_nonces = row_count;

  update public.integration_outbox
  set
    status = 'failed',
    next_attempt_at = now(),
    locked_at = null,
    locked_by = null,
    last_error = 'Worker lease expired'
  where status = 'processing'
    and locked_at < now() - interval '15 minutes';
  get diagnostics v_released_jobs = row_count;

  update public.reminder_deliveries
  set
    status = 'failed',
    last_error = 'Worker lease expired'
  where status = 'processing'
    and updated_at < now() - interval '15 minutes';
  get diagnostics v_released_reminders = row_count;

  perform private.record_audit(
    null,
    'system',
    'maintenance.completed',
    'system',
    null,
    null,
    jsonb_build_object(
      'auto_closed', v_auto_closed,
      'no_shows', v_no_shows,
      'expired_intents', v_expired_intents,
      'deleted_nonces', v_deleted_nonces,
      'released_jobs', v_released_jobs,
      'released_reminders', v_released_reminders
    )
  );

  return jsonb_build_object(
    'auto_closed', v_auto_closed,
    'no_shows', v_no_shows,
    'expired_intents', v_expired_intents,
    'deleted_nonces', v_deleted_nonces,
    'released_jobs', v_released_jobs,
    'released_reminders', v_released_reminders
  );
end;
$$;

revoke all on function public.claim_due_reminders(integer) from public;
revoke all on function public.complete_reminder(uuid) from public;
revoke all on function public.fail_reminder(uuid, text) from public;
revoke all on function public.run_attendance_maintenance() from public;

grant execute on function public.claim_due_reminders(integer) to service_role;
grant execute on function public.complete_reminder(uuid) to service_role;
grant execute on function public.fail_reminder(uuid, text) to service_role;
grant execute on function public.run_attendance_maintenance() to service_role;
