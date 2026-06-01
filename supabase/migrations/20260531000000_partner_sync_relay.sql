create extension if not exists pgcrypto with schema extensions;

create table if not exists public.spicesync_invites (
  invite_id text primary key,
  inviter_user_id uuid not null references auth.users (id) on delete cascade,
  inviter_device_id text not null,
  inviter_public_key text not null,
  inviter_profile_name text,
  inviter_profile_avatar text,
  invite_secret_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  couple_id text
);

create table if not exists public.spicesync_couples (
  couple_id text primary key,
  member_a_user_id uuid not null references auth.users (id) on delete cascade,
  member_b_user_id uuid not null references auth.users (id) on delete cascade,
  member_a_device_id text not null,
  member_b_device_id text not null,
  member_a_public_key text not null,
  member_b_public_key text not null,
  member_a_profile_name text,
  member_b_profile_name text,
  member_a_profile_avatar text,
  member_b_profile_avatar text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.spicesync_events (
  server_sequence bigint generated always as identity primary key,
  event_id text not null unique,
  couple_id text not null references public.spicesync_couples (couple_id) on delete cascade,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  author_device_id text not null,
  client_sequence integer not null,
  encrypted_payload text not null,
  payload_hash text not null,
  signature text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (couple_id, author_device_id, client_sequence)
);

create index if not exists spicesync_invites_expires_at
  on public.spicesync_invites (expires_at);

create index if not exists spicesync_events_couple_sequence
  on public.spicesync_events (couple_id, server_sequence);

create index if not exists spicesync_events_expires_at
  on public.spicesync_events (expires_at);

alter table public.spicesync_invites enable row level security;
alter table public.spicesync_couples enable row level security;
alter table public.spicesync_events enable row level security;

create or replace function public.spicesync_epoch(value timestamptz)
returns bigint
language sql
stable
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
as $$
  select case
    when accepted_at is not null then 'accepted'
    when expires_at <= now() then 'expired'
    else 'pending'
  end;
$$;

create or replace function public.spicesync_create_invite(
  p_inviter_device_id text,
  p_inviter_public_key text,
  p_invite_secret_hash text,
  p_inviter_profile_name text default null,
  p_inviter_profile_avatar text default null,
  p_ttl_seconds integer default 604800
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite_id text;
  v_expires_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if length(trim(p_inviter_device_id)) = 0
    or length(trim(p_inviter_public_key)) = 0
    or length(trim(p_invite_secret_hash)) = 0 then
    raise exception 'Invalid invite input' using errcode = '22023';
  end if;
  if p_ttl_seconds < 60 or p_ttl_seconds > 1209600 then
    raise exception 'Invalid invite TTL' using errcode = '22023';
  end if;

  v_invite_id := 'inv_' || replace(gen_random_uuid()::text, '-', '');
  v_expires_at := now() + make_interval(secs => p_ttl_seconds);

  insert into public.spicesync_invites (
    invite_id,
    inviter_user_id,
    inviter_device_id,
    inviter_public_key,
    inviter_profile_name,
    inviter_profile_avatar,
    invite_secret_hash,
    expires_at
  ) values (
    v_invite_id,
    v_user_id,
    trim(p_inviter_device_id),
    trim(p_inviter_public_key),
    nullif(trim(coalesce(p_inviter_profile_name, '')), ''),
    nullif(trim(coalesce(p_inviter_profile_avatar, '')), ''),
    trim(p_invite_secret_hash),
    v_expires_at
  );

  return jsonb_build_object(
    'inviteId', v_invite_id,
    'expiresAt', public.spicesync_epoch(v_expires_at)
  );
end;
$$;

create or replace function public.spicesync_get_invite(p_invite_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.spicesync_invites%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_invite
  from public.spicesync_invites
  where invite_id = p_invite_id;

  if not found then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'inviteId', v_invite.invite_id,
    'inviterDeviceId', v_invite.inviter_device_id,
    'inviterPublicKey', v_invite.inviter_public_key,
    'inviterProfileName', v_invite.inviter_profile_name,
    'inviterProfileAvatar', v_invite.inviter_profile_avatar,
    'expiresAt', public.spicesync_epoch(v_invite.expires_at),
    'acceptedAt', case
      when v_invite.accepted_at is null then null
      else public.spicesync_epoch(v_invite.accepted_at)
    end,
    'coupleId', v_invite.couple_id,
    'status', public.spicesync_invite_status(
      v_invite.accepted_at,
      v_invite.expires_at
    )
  );
end;
$$;

create or replace function public.spicesync_accept_invite(
  p_invite_id text,
  p_accepter_device_id text,
  p_accepter_public_key text,
  p_invite_proof text,
  p_accepter_profile_name text default null,
  p_accepter_profile_avatar text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.spicesync_invites%rowtype;
  v_couple_id text;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_invite
  from public.spicesync_invites
  where invite_id = p_invite_id
  for update;

  if not found then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;
  if v_invite.accepted_at is not null then
    raise exception 'Invite already accepted' using errcode = '23505';
  end if;
  if v_invite.expires_at <= v_now then
    raise exception 'Invite expired' using errcode = '22023';
  end if;
  if v_invite.inviter_user_id = v_user_id then
    raise exception 'Cannot accept your own invite' using errcode = '22023';
  end if;
  if p_invite_proof <> v_invite.invite_secret_hash then
    raise exception 'Invite proof did not match' using errcode = '28000';
  end if;

  v_couple_id := 'cpl_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.spicesync_couples (
    couple_id,
    member_a_user_id,
    member_b_user_id,
    member_a_device_id,
    member_b_device_id,
    member_a_public_key,
    member_b_public_key,
    member_a_profile_name,
    member_b_profile_name,
    member_a_profile_avatar,
    member_b_profile_avatar,
    created_at
  ) values (
    v_couple_id,
    v_invite.inviter_user_id,
    v_user_id,
    v_invite.inviter_device_id,
    trim(p_accepter_device_id),
    v_invite.inviter_public_key,
    trim(p_accepter_public_key),
    v_invite.inviter_profile_name,
    nullif(trim(coalesce(p_accepter_profile_name, '')), ''),
    v_invite.inviter_profile_avatar,
    nullif(trim(coalesce(p_accepter_profile_avatar, '')), ''),
    v_now
  );

  update public.spicesync_invites
  set accepted_at = v_now,
      couple_id = v_couple_id
  where invite_id = p_invite_id;

  return jsonb_build_object(
    'coupleId', v_couple_id,
    'memberADeviceId', v_invite.inviter_device_id,
    'memberBDeviceId', trim(p_accepter_device_id),
    'memberAPublicKey', v_invite.inviter_public_key,
    'memberBPublicKey', trim(p_accepter_public_key),
    'memberAProfileName', v_invite.inviter_profile_name,
    'memberBProfileName', nullif(trim(coalesce(p_accepter_profile_name, '')), ''),
    'memberAProfileAvatar', v_invite.inviter_profile_avatar,
    'memberBProfileAvatar', nullif(trim(coalesce(p_accepter_profile_avatar, '')), ''),
    'createdAt', public.spicesync_epoch(v_now)
  );
end;
$$;

create or replace function public.spicesync_get_couple(p_couple_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple public.spicesync_couples%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_couple
  from public.spicesync_couples
  where couple_id = p_couple_id
    and revoked_at is null
    and v_user_id in (member_a_user_id, member_b_user_id);

  if not found then
    raise exception 'Couple not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'coupleId', v_couple.couple_id,
    'memberADeviceId', v_couple.member_a_device_id,
    'memberBDeviceId', v_couple.member_b_device_id,
    'memberAPublicKey', v_couple.member_a_public_key,
    'memberBPublicKey', v_couple.member_b_public_key,
    'memberAProfileName', v_couple.member_a_profile_name,
    'memberBProfileName', v_couple.member_b_profile_name,
    'memberAProfileAvatar', v_couple.member_a_profile_avatar,
    'memberBProfileAvatar', v_couple.member_b_profile_avatar,
    'createdAt', public.spicesync_epoch(v_couple.created_at),
    'revokedAt', case
      when v_couple.revoked_at is null then null
      else public.spicesync_epoch(v_couple.revoked_at)
    end
  );
end;
$$;

create or replace function public.spicesync_append_event(
  p_couple_id text,
  p_event_id text,
  p_author_device_id text,
  p_client_sequence integer,
  p_encrypted_payload text,
  p_payload_hash text,
  p_signature text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple public.spicesync_couples%rowtype;
  v_event public.spicesync_events%rowtype;
  v_expires_at timestamptz := now() + interval '90 days';
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_couple
  from public.spicesync_couples
  where couple_id = p_couple_id
    and revoked_at is null
    and v_user_id in (member_a_user_id, member_b_user_id);

  if not found then
    raise exception 'Couple not found' using errcode = 'P0002';
  end if;
  if p_client_sequence < 1 then
    raise exception 'Invalid client sequence' using errcode = '22023';
  end if;
  if not (
    (v_user_id = v_couple.member_a_user_id and p_author_device_id = v_couple.member_a_device_id)
    or
    (v_user_id = v_couple.member_b_user_id and p_author_device_id = v_couple.member_b_device_id)
  ) then
    raise exception 'Author is not a couple member' using errcode = '28000';
  end if;
  if encode(digest(p_encrypted_payload, 'sha256'), 'base64') <> p_payload_hash then
    raise exception 'Payload hash mismatch' using errcode = '22000';
  end if;

  insert into public.spicesync_events (
    event_id,
    couple_id,
    author_user_id,
    author_device_id,
    client_sequence,
    encrypted_payload,
    payload_hash,
    signature,
    expires_at
  ) values (
    trim(p_event_id),
    p_couple_id,
    v_user_id,
    trim(p_author_device_id),
    p_client_sequence,
    p_encrypted_payload,
    p_payload_hash,
    p_signature,
    v_expires_at
  )
  on conflict (event_id) do nothing
  returning * into v_event;

  if not found then
    select * into v_event
    from public.spicesync_events
    where event_id = p_event_id
      and couple_id = p_couple_id;
  end if;

  if not found then
    raise exception 'Duplicate sync event' using errcode = '23505';
  end if;

  return jsonb_build_object(
    'serverSequence', v_event.server_sequence,
    'eventId', v_event.event_id,
    'coupleId', v_event.couple_id,
    'authorDeviceId', v_event.author_device_id,
    'clientSequence', v_event.client_sequence,
    'encryptedPayload', v_event.encrypted_payload,
    'payloadHash', v_event.payload_hash,
    'createdAt', public.spicesync_epoch(v_event.created_at),
    'expiresAt', case
      when v_event.expires_at is null then null
      else public.spicesync_epoch(v_event.expires_at)
    end
  );
end;
$$;

create or replace function public.spicesync_list_events(
  p_couple_id text,
  p_after_server_sequence bigint default 0,
  p_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := least(greatest(p_limit, 1), 100);
  v_events jsonb;
  v_cursor bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_after_server_sequence < 0 then
    raise exception 'Invalid after cursor' using errcode = '22023';
  end if;

  perform 1
  from public.spicesync_couples
  where couple_id = p_couple_id
    and revoked_at is null
    and v_user_id in (member_a_user_id, member_b_user_id);

  if not found then
    raise exception 'Couple not found' using errcode = 'P0002';
  end if;

  with limited_events as (
    select *
    from public.spicesync_events
    where couple_id = p_couple_id
      and server_sequence > p_after_server_sequence
    order by server_sequence asc
    limit v_limit
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'serverSequence', server_sequence,
          'eventId', event_id,
          'coupleId', couple_id,
          'authorDeviceId', author_device_id,
          'clientSequence', client_sequence,
          'encryptedPayload', encrypted_payload,
          'payloadHash', payload_hash,
          'createdAt', public.spicesync_epoch(created_at),
          'expiresAt', case
            when expires_at is null then null
            else public.spicesync_epoch(expires_at)
          end
        )
        order by server_sequence asc
      ),
      '[]'::jsonb
    ),
    coalesce(max(server_sequence), p_after_server_sequence)
  into v_events, v_cursor
  from limited_events;

  return jsonb_build_object(
    'events', v_events,
    'cursor', v_cursor
  );
end;
$$;

create or replace function public.spicesync_revoke_couple(p_couple_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_revoked_at timestamptz := now();
  v_couple public.spicesync_couples%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  update public.spicesync_couples
  set revoked_at = coalesce(revoked_at, v_revoked_at)
  where couple_id = p_couple_id
    and v_user_id in (member_a_user_id, member_b_user_id)
  returning * into v_couple;

  if not found then
    raise exception 'Couple not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'coupleId', v_couple.couple_id,
    'revokedAt', public.spicesync_epoch(v_couple.revoked_at)
  );
end;
$$;

grant execute on function public.spicesync_create_invite(text, text, text, text, text, integer)
  to authenticated;
grant execute on function public.spicesync_get_invite(text)
  to authenticated;
grant execute on function public.spicesync_accept_invite(text, text, text, text, text, text)
  to authenticated;
grant execute on function public.spicesync_get_couple(text)
  to authenticated;
grant execute on function public.spicesync_append_event(text, text, text, integer, text, text, text)
  to authenticated;
grant execute on function public.spicesync_list_events(text, bigint, integer)
  to authenticated;
grant execute on function public.spicesync_revoke_couple(text)
  to authenticated;
