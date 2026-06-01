alter table public.spicesync_invites
  add column if not exists inviter_profile_name text,
  add column if not exists inviter_profile_avatar text;

alter table public.spicesync_couples
  add column if not exists member_a_profile_name text,
  add column if not exists member_b_profile_name text,
  add column if not exists member_a_profile_avatar text,
  add column if not exists member_b_profile_avatar text;

drop function if exists public.spicesync_create_invite(text, text, text, integer);
drop function if exists public.spicesync_accept_invite(text, text, text, text);

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

grant execute on function public.spicesync_create_invite(text, text, text, text, text, integer)
  to authenticated;
grant execute on function public.spicesync_accept_invite(text, text, text, text, text, text)
  to authenticated;
