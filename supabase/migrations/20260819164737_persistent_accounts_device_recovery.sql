begin;

create table public.spicesync_devices (
  device_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  signing_public_key text not null,
  encryption_public_key text not null,
  status text not null check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index spicesync_devices_user_id
  on public.spicesync_devices(user_id);

create unique index spicesync_devices_one_active_per_user
  on public.spicesync_devices(user_id)
  where status = 'active';

alter table public.spicesync_devices enable row level security;

alter table public.spicesync_couples
  add column member_a_key_version integer not null default 1
    check (member_a_key_version > 0),
  add column member_b_key_version integer not null default 1
    check (member_b_key_version > 0);

alter table public.spicesync_events
  add column recipient_device_id text;

create or replace function public.spicesync_create_invite(
  p_inviter_device_id text,
  p_inviter_public_key text,
  p_inviter_signing_public_key text,
  p_invite_secret_hash text,
  p_inviter_profile_name text default null,
  p_inviter_profile_avatar text default null,
  p_ttl_seconds integer default 604800
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_device_id text := trim(coalesce(p_inviter_device_id, ''));
  v_encryption_public_key text := trim(coalesce(p_inviter_public_key, ''));
  v_signing_public_key text := trim(coalesce(p_inviter_signing_public_key, ''));
  v_invite_secret_hash text := trim(coalesce(p_invite_secret_hash, ''));
  v_active_device public.spicesync_devices%rowtype;
  v_registered_user_id uuid;
  v_invite_id text;
  v_expires_at timestamptz;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, true) then
    raise exception 'Permanent account required' using errcode = '28000';
  end if;
  if v_device_id = ''
    or v_encryption_public_key = ''
    or v_signing_public_key = ''
    or v_invite_secret_hash = '' then
    raise exception 'Invalid invite input' using errcode = '22023';
  end if;
  if p_ttl_seconds < 60 or p_ttl_seconds > 1209600 then
    raise exception 'Invalid invite TTL' using errcode = '22023';
  end if;

  perform 1
  from auth.users as users
  where users.id = v_user_id
  for update;

  if not found then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  perform 1
  from public.spicesync_devices as target_device
  where target_device.device_id = v_device_id
    and target_device.user_id <> v_user_id;

  if found then
    raise exception 'Device id already registered' using errcode = '23505';
  end if;

  select active_device.*
  into v_active_device
  from public.spicesync_devices as active_device
  where active_device.user_id = v_user_id
    and active_device.status = 'active'
  for update;

  if found and (
    v_active_device.device_id is distinct from v_device_id
    or v_active_device.encryption_public_key is distinct from v_encryption_public_key
    or v_active_device.signing_public_key is distinct from v_signing_public_key
  ) then
    raise exception 'Device recovery required' using errcode = 'P0001';
  end if;

  insert into public.spicesync_devices as registered_device (
    device_id,
    user_id,
    signing_public_key,
    encryption_public_key,
    status,
    last_seen_at,
    revoked_at
  ) values (
    v_device_id,
    v_user_id,
    v_signing_public_key,
    v_encryption_public_key,
    'active',
    v_now,
    null
  )
  on conflict (device_id) do update
  set signing_public_key = excluded.signing_public_key,
      encryption_public_key = excluded.encryption_public_key,
      status = 'active',
      last_seen_at = excluded.last_seen_at,
      revoked_at = null
  where registered_device.user_id = excluded.user_id
  returning registered_device.user_id into v_registered_user_id;

  if v_registered_user_id is null then
    raise exception 'Device id already registered' using errcode = '23505';
  end if;

  v_invite_id := 'inv_' || replace(extensions.gen_random_uuid()::text, '-', '');
  v_expires_at := v_now + make_interval(secs => p_ttl_seconds);

  insert into public.spicesync_invites (
    invite_id,
    inviter_user_id,
    inviter_device_id,
    inviter_public_key,
    inviter_signing_public_key,
    inviter_profile_name,
    inviter_profile_avatar,
    invite_secret_hash,
    expires_at
  ) values (
    v_invite_id,
    v_user_id,
    v_device_id,
    v_encryption_public_key,
    v_signing_public_key,
    nullif(trim(coalesce(p_inviter_profile_name, '')), ''),
    nullif(trim(coalesce(p_inviter_profile_avatar, '')), ''),
    v_invite_secret_hash,
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
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.spicesync_invites%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select invite.*
  into v_invite
  from public.spicesync_invites as invite
  where invite.invite_id = p_invite_id;

  if not found then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'inviteId', v_invite.invite_id,
    'inviterDeviceId', v_invite.inviter_device_id,
    'inviterPublicKey', v_invite.inviter_public_key,
    'inviterSigningPublicKey', v_invite.inviter_signing_public_key,
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
  p_accepter_signing_public_key text,
  p_invite_proof text,
  p_accepter_profile_name text default null,
  p_accepter_profile_avatar text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_device_id text := trim(coalesce(p_accepter_device_id, ''));
  v_encryption_public_key text := trim(coalesce(p_accepter_public_key, ''));
  v_signing_public_key text := trim(coalesce(p_accepter_signing_public_key, ''));
  v_active_device public.spicesync_devices%rowtype;
  v_registered_user_id uuid;
  v_invite public.spicesync_invites%rowtype;
  v_couple_id text;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, true) then
    raise exception 'Permanent account required' using errcode = '28000';
  end if;
  if v_device_id = ''
    or v_encryption_public_key = ''
    or v_signing_public_key = '' then
    raise exception 'Invalid accepter input' using errcode = '22023';
  end if;

  perform 1
  from auth.users as users
  where users.id = v_user_id
  for update;

  if not found then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  perform 1
  from public.spicesync_devices as target_device
  where target_device.device_id = v_device_id
    and target_device.user_id <> v_user_id;

  if found then
    raise exception 'Device id already registered' using errcode = '23505';
  end if;

  select active_device.*
  into v_active_device
  from public.spicesync_devices as active_device
  where active_device.user_id = v_user_id
    and active_device.status = 'active'
  for update;

  if found and (
    v_active_device.device_id is distinct from v_device_id
    or v_active_device.encryption_public_key is distinct from v_encryption_public_key
    or v_active_device.signing_public_key is distinct from v_signing_public_key
  ) then
    raise exception 'Device recovery required' using errcode = 'P0001';
  end if;

  insert into public.spicesync_devices as registered_device (
    device_id,
    user_id,
    signing_public_key,
    encryption_public_key,
    status,
    last_seen_at,
    revoked_at
  ) values (
    v_device_id,
    v_user_id,
    v_signing_public_key,
    v_encryption_public_key,
    'active',
    v_now,
    null
  )
  on conflict (device_id) do update
  set signing_public_key = excluded.signing_public_key,
      encryption_public_key = excluded.encryption_public_key,
      status = 'active',
      last_seen_at = excluded.last_seen_at,
      revoked_at = null
  where registered_device.user_id = excluded.user_id
  returning registered_device.user_id into v_registered_user_id;

  if v_registered_user_id is null then
    raise exception 'Device id already registered' using errcode = '23505';
  end if;

  select invite.*
  into v_invite
  from public.spicesync_invites as invite
  where invite.invite_id = p_invite_id
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

  v_couple_id := 'cpl_' || replace(extensions.gen_random_uuid()::text, '-', '');

  insert into public.spicesync_couples (
    couple_id,
    member_a_user_id,
    member_b_user_id,
    member_a_device_id,
    member_b_device_id,
    member_a_public_key,
    member_b_public_key,
    member_a_signing_public_key,
    member_b_signing_public_key,
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
    v_device_id,
    v_invite.inviter_public_key,
    v_encryption_public_key,
    v_invite.inviter_signing_public_key,
    v_signing_public_key,
    v_invite.inviter_profile_name,
    nullif(trim(coalesce(p_accepter_profile_name, '')), ''),
    v_invite.inviter_profile_avatar,
    nullif(trim(coalesce(p_accepter_profile_avatar, '')), ''),
    v_now
  );

  update public.spicesync_invites as invite
  set accepted_at = v_now,
      couple_id = v_couple_id
  where invite.invite_id = p_invite_id;

  return jsonb_build_object(
    'coupleId', v_couple_id,
    'memberADeviceId', v_invite.inviter_device_id,
    'memberBDeviceId', v_device_id,
    'memberAPublicKey', v_invite.inviter_public_key,
    'memberBPublicKey', v_encryption_public_key,
    'memberASigningPublicKey', v_invite.inviter_signing_public_key,
    'memberBSigningPublicKey', v_signing_public_key,
    'memberAKeyVersion', 1,
    'memberBKeyVersion', 1,
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
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple public.spicesync_couples%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select couple.*
  into v_couple
  from public.spicesync_couples as couple
  where couple.couple_id = p_couple_id
    and couple.revoked_at is null
    and v_user_id in (couple.member_a_user_id, couple.member_b_user_id);

  if not found then
    raise exception 'Couple not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'coupleId', v_couple.couple_id,
    'memberADeviceId', v_couple.member_a_device_id,
    'memberBDeviceId', v_couple.member_b_device_id,
    'memberAPublicKey', v_couple.member_a_public_key,
    'memberBPublicKey', v_couple.member_b_public_key,
    'memberASigningPublicKey', v_couple.member_a_signing_public_key,
    'memberBSigningPublicKey', v_couple.member_b_signing_public_key,
    'memberAKeyVersion', v_couple.member_a_key_version,
    'memberBKeyVersion', v_couple.member_b_key_version,
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

create or replace function public.spicesync_register_or_recover_device(
  p_device_id text,
  p_encryption_public_key text,
  p_signing_public_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_device_id text := trim(coalesce(p_device_id, ''));
  v_encryption_public_key text := trim(coalesce(p_encryption_public_key, ''));
  v_signing_public_key text := trim(coalesce(p_signing_public_key, ''));
  v_active_device public.spicesync_devices%rowtype;
  v_couple public.spicesync_couples%rowtype;
  v_has_active_device boolean := false;
  v_has_couple boolean := false;
  v_is_replacement boolean := false;
  v_registered_user_id uuid;
  v_recovery_cursor bigint := 0;
  v_my_key_version integer := 1;
  v_partner_key_version integer;
  v_couple_json jsonb;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, true) then
    raise exception 'Permanent account required' using errcode = '28000';
  end if;
  if v_device_id = ''
    or v_encryption_public_key = ''
    or v_signing_public_key = '' then
    raise exception 'Invalid device input' using errcode = '22023';
  end if;

  -- All registration paths serialize on auth.users, then lock couple before
  -- device rows. Append-v2 uses the same couple-before-device order.
  perform 1
  from auth.users as users
  where users.id = v_user_id
  for update;

  if not found then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select couple.*
  into v_couple
  from public.spicesync_couples as couple
  where couple.revoked_at is null
    and v_user_id in (couple.member_a_user_id, couple.member_b_user_id)
  order by couple.created_at desc, couple.couple_id desc
  limit 1
  for update;
  v_has_couple := found;

  perform 1
  from public.spicesync_devices as target_device
  where target_device.device_id = v_device_id
    and target_device.user_id <> v_user_id;

  if found then
    raise exception 'Device id already registered' using errcode = '23505';
  end if;

  select active_device.*
  into v_active_device
  from public.spicesync_devices as active_device
  where active_device.user_id = v_user_id
    and active_device.status = 'active'
  for update;
  v_has_active_device := found;

  if v_has_active_device and (
    v_active_device.device_id is distinct from v_device_id
    or v_active_device.encryption_public_key is distinct from v_encryption_public_key
    or v_active_device.signing_public_key is distinct from v_signing_public_key
  ) then
    v_is_replacement := true;
  end if;

  if v_has_couple and v_user_id = v_couple.member_a_user_id and (
    v_couple.member_a_device_id is distinct from v_device_id
    or v_couple.member_a_public_key is distinct from v_encryption_public_key
    or v_couple.member_a_signing_public_key is distinct from v_signing_public_key
  ) then
    v_is_replacement := true;
  elsif v_has_couple and v_user_id = v_couple.member_b_user_id and (
    v_couple.member_b_device_id is distinct from v_device_id
    or v_couple.member_b_public_key is distinct from v_encryption_public_key
    or v_couple.member_b_signing_public_key is distinct from v_signing_public_key
  ) then
    v_is_replacement := true;
  end if;

  if v_has_active_device and (
    v_active_device.device_id is distinct from v_device_id
    or v_active_device.encryption_public_key is distinct from v_encryption_public_key
    or v_active_device.signing_public_key is distinct from v_signing_public_key
  ) then
    update public.spicesync_devices as old_device
    set status = 'revoked',
        revoked_at = v_now,
        last_seen_at = v_now
    where old_device.device_id = v_active_device.device_id;
  end if;

  insert into public.spicesync_devices as registered_device (
    device_id,
    user_id,
    signing_public_key,
    encryption_public_key,
    status,
    last_seen_at,
    revoked_at
  ) values (
    v_device_id,
    v_user_id,
    v_signing_public_key,
    v_encryption_public_key,
    'active',
    v_now,
    null
  )
  on conflict (device_id) do update
  set signing_public_key = excluded.signing_public_key,
      encryption_public_key = excluded.encryption_public_key,
      status = 'active',
      last_seen_at = excluded.last_seen_at,
      revoked_at = null
  where registered_device.user_id = excluded.user_id
  returning registered_device.user_id into v_registered_user_id;

  if v_registered_user_id is null then
    raise exception 'Device id already registered' using errcode = '23505';
  end if;

  if v_has_couple and v_user_id = v_couple.member_a_user_id then
    update public.spicesync_couples as couple
    set member_a_device_id = v_device_id,
        member_a_public_key = v_encryption_public_key,
        member_a_signing_public_key = v_signing_public_key,
        member_a_key_version = couple.member_a_key_version
          + case when v_is_replacement then 1 else 0 end
    where couple.couple_id = v_couple.couple_id
    returning couple.* into v_couple;

    v_my_key_version := v_couple.member_a_key_version;
    v_partner_key_version := v_couple.member_b_key_version;
  elsif v_has_couple and v_user_id = v_couple.member_b_user_id then
    update public.spicesync_couples as couple
    set member_b_device_id = v_device_id,
        member_b_public_key = v_encryption_public_key,
        member_b_signing_public_key = v_signing_public_key,
        member_b_key_version = couple.member_b_key_version
          + case when v_is_replacement then 1 else 0 end
    where couple.couple_id = v_couple.couple_id
    returning couple.* into v_couple;

    v_my_key_version := v_couple.member_b_key_version;
    v_partner_key_version := v_couple.member_a_key_version;
  end if;

  if v_has_couple then
    select coalesce(max(event.server_sequence), 0)
    into v_recovery_cursor
    from public.spicesync_events as event
    where event.couple_id = v_couple.couple_id;

    v_couple_json := jsonb_build_object(
      'coupleId', v_couple.couple_id,
      'memberADeviceId', v_couple.member_a_device_id,
      'memberBDeviceId', v_couple.member_b_device_id,
      'memberAPublicKey', v_couple.member_a_public_key,
      'memberBPublicKey', v_couple.member_b_public_key,
      'memberASigningPublicKey', v_couple.member_a_signing_public_key,
      'memberBSigningPublicKey', v_couple.member_b_signing_public_key,
      'memberAKeyVersion', v_couple.member_a_key_version,
      'memberBKeyVersion', v_couple.member_b_key_version,
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
  end if;

  return jsonb_build_object(
    'couple', v_couple_json,
    'recoveryCursor', v_recovery_cursor,
    'myDeviceId', v_device_id,
    'myKeyVersion', v_my_key_version,
    'partnerKeyVersion', v_partner_key_version
  );
end;
$$;

create or replace function public.spicesync_revoke_device(p_device_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_device_id text := trim(coalesce(p_device_id, ''));
  v_device public.spicesync_devices%rowtype;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, true) then
    raise exception 'Permanent account required' using errcode = '28000';
  end if;
  if v_device_id = '' then
    raise exception 'Invalid device id' using errcode = '22023';
  end if;

  perform 1
  from auth.users as users
  where users.id = v_user_id
  for update;

  if not found then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select device.*
  into v_device
  from public.spicesync_devices as device
  where device.device_id = v_device_id
    and device.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Device not found' using errcode = 'P0002';
  end if;

  if v_device.status = 'revoked' then
    perform 1
    from public.spicesync_devices as active_device
    where active_device.user_id = v_user_id
      and active_device.status = 'active'
      and active_device.device_id <> v_device_id;

    if found then
      raise exception 'Device is not active' using errcode = '28000';
    end if;

    return;
  end if;

  update public.spicesync_devices as device
  set status = 'revoked',
      revoked_at = v_now,
      last_seen_at = v_now
  where device.device_id = v_device_id
    and device.user_id = v_user_id
    and device.status = 'active';
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
set search_path = ''
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

  select couple.*
  into v_couple
  from public.spicesync_couples as couple
  where couple.couple_id = p_couple_id
    and couple.revoked_at is null
    and v_user_id in (couple.member_a_user_id, couple.member_b_user_id)
  for update;

  if not found then
    raise exception 'Couple not found' using errcode = 'P0002';
  end if;
  if v_couple.member_a_key_version > 1
    or v_couple.member_b_key_version > 1 then
    raise exception 'CLIENT_UPGRADE_REQUIRED' using errcode = 'P0001';
  end if;
  if p_client_sequence < 1 then
    raise exception 'Invalid client sequence' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_signature, ''))) = 0 then
    raise exception 'Invalid signature' using errcode = '22023';
  end if;
  if not (
    (v_user_id = v_couple.member_a_user_id
      and trim(coalesce(p_author_device_id, '')) = v_couple.member_a_device_id)
    or
    (v_user_id = v_couple.member_b_user_id
      and trim(coalesce(p_author_device_id, '')) = v_couple.member_b_device_id)
  ) then
    raise exception 'Author is not a couple member' using errcode = '28000';
  end if;
  if encode(extensions.digest(p_encrypted_payload, 'sha256'), 'base64') <> p_payload_hash then
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
    recipient_device_id,
    expires_at
  ) values (
    trim(p_event_id),
    p_couple_id,
    v_user_id,
    trim(p_author_device_id),
    p_client_sequence,
    p_encrypted_payload,
    p_payload_hash,
    trim(p_signature),
    null,
    v_expires_at
  )
  on conflict (event_id) do nothing
  returning * into v_event;

  if not found then
    select event.*
    into v_event
    from public.spicesync_events as event
    where event.event_id = p_event_id
      and event.couple_id = p_couple_id;
  end if;

  if not found then
    raise exception 'Duplicate sync event' using errcode = '23505';
  end if;

  return jsonb_build_object(
    'serverSequence', v_event.server_sequence,
    'eventId', v_event.event_id,
    'coupleId', v_event.couple_id,
    'authorDeviceId', v_event.author_device_id,
    'recipientDeviceId', v_event.recipient_device_id,
    'clientSequence', v_event.client_sequence,
    'encryptedPayload', v_event.encrypted_payload,
    'payloadHash', v_event.payload_hash,
    'signature', v_event.signature,
    'createdAt', public.spicesync_epoch(v_event.created_at),
    'expiresAt', case
      when v_event.expires_at is null then null
      else public.spicesync_epoch(v_event.expires_at)
    end
  );
end;
$$;

create or replace function public.spicesync_append_event_v2(
  p_couple_id text,
  p_event_id text,
  p_author_device_id text,
  p_recipient_device_id text,
  p_client_sequence integer,
  p_encrypted_payload text,
  p_payload_hash text,
  p_signature text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_author_device_id text := trim(coalesce(p_author_device_id, ''));
  v_recipient_device_id text := trim(coalesce(p_recipient_device_id, ''));
  v_expected_recipient_device_id text;
  v_couple public.spicesync_couples%rowtype;
  v_author_device public.spicesync_devices%rowtype;
  v_event public.spicesync_events%rowtype;
  v_now timestamptz := now();
  v_expires_at timestamptz := now() + interval '90 days';
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select couple.*
  into v_couple
  from public.spicesync_couples as couple
  where couple.couple_id = p_couple_id
    and couple.revoked_at is null
    and v_user_id in (couple.member_a_user_id, couple.member_b_user_id)
  for update;

  if not found then
    raise exception 'Couple not found' using errcode = 'P0002';
  end if;
  if p_client_sequence < 1 then
    raise exception 'Invalid client sequence' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_signature, ''))) = 0 then
    raise exception 'Invalid signature' using errcode = '22023';
  end if;

  if v_user_id = v_couple.member_a_user_id then
    if v_author_device_id <> v_couple.member_a_device_id then
      raise exception 'Author device is not active' using errcode = '28000';
    end if;
    v_expected_recipient_device_id := v_couple.member_b_device_id;
  elsif v_user_id = v_couple.member_b_user_id then
    if v_author_device_id <> v_couple.member_b_device_id then
      raise exception 'Author device is not active' using errcode = '28000';
    end if;
    v_expected_recipient_device_id := v_couple.member_a_device_id;
  else
    raise exception 'Author is not a couple member' using errcode = '28000';
  end if;

  select device.*
  into v_author_device
  from public.spicesync_devices as device
  where device.device_id = v_author_device_id
    and device.user_id = v_user_id
    and device.status = 'active'
  for update;

  if not found then
    raise exception 'Author device is not active' using errcode = '28000';
  end if;

  if v_recipient_device_id <> v_expected_recipient_device_id then
    raise exception 'RECIPIENT_KEY_CHANGED' using errcode = 'P0001';
  end if;
  if encode(extensions.digest(p_encrypted_payload, 'sha256'), 'base64') <> p_payload_hash then
    raise exception 'Payload hash mismatch' using errcode = '22000';
  end if;

  insert into public.spicesync_events (
    event_id,
    couple_id,
    author_user_id,
    author_device_id,
    recipient_device_id,
    client_sequence,
    encrypted_payload,
    payload_hash,
    signature,
    expires_at
  ) values (
    trim(p_event_id),
    p_couple_id,
    v_user_id,
    v_author_device_id,
    v_recipient_device_id,
    p_client_sequence,
    p_encrypted_payload,
    p_payload_hash,
    trim(p_signature),
    v_expires_at
  )
  on conflict (event_id) do nothing
  returning * into v_event;

  if not found then
    select event.*
    into v_event
    from public.spicesync_events as event
    where event.event_id = p_event_id
      and event.couple_id = p_couple_id;
  end if;

  if not found then
    raise exception 'Duplicate sync event' using errcode = '23505';
  end if;

  update public.spicesync_devices as device
  set last_seen_at = v_now
  where device.device_id = v_author_device_id
    and device.user_id = v_user_id
    and device.status = 'active';

  return jsonb_build_object(
    'serverSequence', v_event.server_sequence,
    'eventId', v_event.event_id,
    'coupleId', v_event.couple_id,
    'authorDeviceId', v_event.author_device_id,
    'recipientDeviceId', v_event.recipient_device_id,
    'clientSequence', v_event.client_sequence,
    'encryptedPayload', v_event.encrypted_payload,
    'payloadHash', v_event.payload_hash,
    'signature', v_event.signature,
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
set search_path = ''
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
  from public.spicesync_couples as couple
  where couple.couple_id = p_couple_id
    and couple.revoked_at is null
    and v_user_id in (couple.member_a_user_id, couple.member_b_user_id);

  if not found then
    raise exception 'Couple not found' using errcode = 'P0002';
  end if;

  with limited_events as (
    select event.*
    from public.spicesync_events as event
    where event.couple_id = p_couple_id
      and event.server_sequence > p_after_server_sequence
    order by event.server_sequence asc
    limit v_limit
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'serverSequence', limited_events.server_sequence,
          'eventId', limited_events.event_id,
          'coupleId', limited_events.couple_id,
          'authorDeviceId', limited_events.author_device_id,
          'recipientDeviceId', limited_events.recipient_device_id,
          'clientSequence', limited_events.client_sequence,
          'encryptedPayload', limited_events.encrypted_payload,
          'payloadHash', limited_events.payload_hash,
          'signature', limited_events.signature,
          'createdAt', public.spicesync_epoch(limited_events.created_at),
          'expiresAt', case
            when limited_events.expires_at is null then null
            else public.spicesync_epoch(limited_events.expires_at)
          end
        )
        order by limited_events.server_sequence asc
      ),
      '[]'::jsonb
    ),
    coalesce(max(limited_events.server_sequence), p_after_server_sequence)
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
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_revoked_at timestamptz := now();
  v_couple public.spicesync_couples%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  update public.spicesync_couples as couple
  set revoked_at = coalesce(couple.revoked_at, v_revoked_at)
  where couple.couple_id = p_couple_id
    and v_user_id in (couple.member_a_user_id, couple.member_b_user_id)
  returning couple.* into v_couple;

  if not found then
    raise exception 'Couple not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'coupleId', v_couple.couple_id,
    'revokedAt', public.spicesync_epoch(v_couple.revoked_at)
  );
end;
$$;

create or replace function public.spicesync_find_couple_for_device(
  p_device_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_device_id text := trim(coalesce(p_device_id, ''));
  v_couple_id text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_device_id = '' then
    raise exception 'Invalid device id' using errcode = '22023';
  end if;

  select candidate.couple_id
  into v_couple_id
  from (
    select couple.couple_id, couple.created_at
    from public.spicesync_couples as couple
    where couple.member_a_user_id = v_user_id
      and couple.member_a_device_id = v_device_id
      and couple.revoked_at is null

    union all

    select couple.couple_id, couple.created_at
    from public.spicesync_couples as couple
    where couple.member_b_user_id = v_user_id
      and couple.member_b_device_id = v_device_id
      and couple.revoked_at is null
  ) as candidate
  order by candidate.created_at desc, candidate.couple_id desc
  limit 1;

  if v_couple_id is null then
    return null;
  end if;

  return public.spicesync_get_couple(v_couple_id);
end;
$$;

revoke all on table public.spicesync_devices
  from public, anon, authenticated;
revoke all on table public.spicesync_invites
  from public, anon, authenticated;
revoke all on table public.spicesync_couples
  from public, anon, authenticated;
revoke all on table public.spicesync_events
  from public, anon, authenticated;

revoke all on function public.spicesync_create_invite(text, text, text, text, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.spicesync_get_invite(text)
  from public, anon, authenticated;
revoke all on function public.spicesync_accept_invite(text, text, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.spicesync_get_couple(text)
  from public, anon, authenticated;
revoke all on function public.spicesync_register_or_recover_device(text, text, text)
  from public, anon, authenticated;
revoke all on function public.spicesync_revoke_device(text)
  from public, anon, authenticated;
revoke all on function public.spicesync_append_event(text, text, text, integer, text, text, text)
  from public, anon, authenticated;
revoke all on function public.spicesync_append_event_v2(text, text, text, text, integer, text, text, text)
  from public, anon, authenticated;
revoke all on function public.spicesync_list_events(text, bigint, integer)
  from public, anon, authenticated;
revoke all on function public.spicesync_revoke_couple(text)
  from public, anon, authenticated;
revoke all on function public.spicesync_find_couple_for_device(text)
  from public, anon, authenticated;

grant execute on function public.spicesync_create_invite(text, text, text, text, text, text, integer)
  to authenticated;
grant execute on function public.spicesync_get_invite(text)
  to authenticated;
grant execute on function public.spicesync_accept_invite(text, text, text, text, text, text, text)
  to authenticated;
grant execute on function public.spicesync_get_couple(text)
  to authenticated;
grant execute on function public.spicesync_register_or_recover_device(text, text, text)
  to authenticated;
grant execute on function public.spicesync_revoke_device(text)
  to authenticated;
grant execute on function public.spicesync_append_event(text, text, text, integer, text, text, text)
  to authenticated;
grant execute on function public.spicesync_append_event_v2(text, text, text, text, integer, text, text, text)
  to authenticated;
grant execute on function public.spicesync_list_events(text, bigint, integer)
  to authenticated;
grant execute on function public.spicesync_revoke_couple(text)
  to authenticated;
grant execute on function public.spicesync_find_couple_for_device(text)
  to authenticated;

commit;
