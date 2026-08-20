create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table private.spicesync_google_deletion_challenges (
  challenge_id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  constraint spicesync_google_deletion_challenge_expiry
    check (expires_at > created_at)
);

revoke all on table private.spicesync_google_deletion_challenges
  from public, anon, authenticated;

create or replace function public.spicesync_issue_google_deletion_challenge(
  p_user_id uuid
)
returns table(challenge_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null or not exists (
    select 1 from auth.users where id = p_user_id
  ) then
    raise exception 'Authenticated user is required';
  end if;

  delete from private.spicesync_google_deletion_challenges as challenges
  where challenges.expires_at <= now()
    or challenges.consumed_at is not null;

  return query
  insert into private.spicesync_google_deletion_challenges(user_id)
  values (p_user_id)
  returning
    spicesync_google_deletion_challenges.challenge_id,
    spicesync_google_deletion_challenges.expires_at;
end;
$$;

create or replace function public.spicesync_consume_google_deletion_challenge(
  p_challenge_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consumed uuid;
begin
  update private.spicesync_google_deletion_challenges
  set consumed_at = now()
  where challenge_id = p_challenge_id
    and user_id = p_user_id
    and consumed_at is null
    and expires_at > now()
  returning challenge_id into v_consumed;

  return v_consumed is not null;
end;
$$;

revoke all on function public.spicesync_issue_google_deletion_challenge(uuid)
  from public, anon, authenticated;
revoke all on function public.spicesync_consume_google_deletion_challenge(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.spicesync_issue_google_deletion_challenge(uuid)
  to service_role;
grant execute on function public.spicesync_consume_google_deletion_challenge(uuid, uuid)
  to service_role;
