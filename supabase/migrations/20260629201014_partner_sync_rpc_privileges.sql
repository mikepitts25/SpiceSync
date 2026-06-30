create or replace function public.spicesync_epoch(value timestamptz)
returns bigint
language sql
stable
set search_path = public, extensions
as $$
  select floor(extract(epoch from value))::bigint;
$$;

create or replace function public.spicesync_invite_status(
  accepted_at timestamptz,
  expires_at timestamptz
)
returns text
language sql
stable
set search_path = public
as $$
  select case
    when accepted_at is not null then 'accepted'
    when expires_at <= now() then 'expired'
    else 'pending'
  end;
$$;

revoke all on function public.spicesync_epoch(timestamptz)
  from public, anon, authenticated;
revoke all on function public.spicesync_invite_status(timestamptz, timestamptz)
  from public, anon, authenticated;

revoke all on function public.spicesync_create_invite(text, text, text, text, text, text, integer)
  from public, anon;
revoke all on function public.spicesync_get_invite(text)
  from public, anon;
revoke all on function public.spicesync_accept_invite(text, text, text, text, text, text, text)
  from public, anon;
revoke all on function public.spicesync_get_couple(text)
  from public, anon;
revoke all on function public.spicesync_append_event(text, text, text, integer, text, text, text)
  from public, anon;
revoke all on function public.spicesync_list_events(text, bigint, integer)
  from public, anon;
revoke all on function public.spicesync_revoke_couple(text)
  from public, anon;

grant execute on function public.spicesync_create_invite(text, text, text, text, text, text, integer)
  to authenticated;
grant execute on function public.spicesync_get_invite(text)
  to authenticated;
grant execute on function public.spicesync_accept_invite(text, text, text, text, text, text, text)
  to authenticated;
grant execute on function public.spicesync_get_couple(text)
  to authenticated;
grant execute on function public.spicesync_append_event(text, text, text, integer, text, text, text)
  to authenticated;
grant execute on function public.spicesync_list_events(text, bigint, integer)
  to authenticated;
grant execute on function public.spicesync_revoke_couple(text)
  to authenticated;
