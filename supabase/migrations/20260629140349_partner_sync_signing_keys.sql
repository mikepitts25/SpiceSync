alter table public.spicesync_invites
  add column if not exists inviter_signing_public_key text;

alter table public.spicesync_couples
  add column if not exists member_a_signing_public_key text,
  add column if not exists member_b_signing_public_key text;

update public.spicesync_invites
set inviter_signing_public_key = ''
where inviter_signing_public_key is null;

update public.spicesync_couples
set member_a_signing_public_key = coalesce(member_a_signing_public_key, ''),
    member_b_signing_public_key = coalesce(member_b_signing_public_key, '')
where member_a_signing_public_key is null
   or member_b_signing_public_key is null;

alter table public.spicesync_invites
  alter column inviter_signing_public_key set default '',
  alter column inviter_signing_public_key set not null;

alter table public.spicesync_couples
  alter column member_a_signing_public_key set default '',
  alter column member_a_signing_public_key set not null,
  alter column member_b_signing_public_key set default '',
  alter column member_b_signing_public_key set not null;

drop function if exists public.spicesync_create_invite(text, text, text, text, text, integer);
drop function if exists public.spicesync_accept_invite(text, text, text, text, text, text);

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
    or length(trim(p_inviter_signing_public_key)) = 0
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
    inviter_signing_public_key,
    inviter_profile_name,
    inviter_profile_avatar,
    invite_secret_hash,
    expires_at
  ) values (
    v_invite_id,
    v_user_id,
    trim(p_inviter_device_id),
    trim(p_inviter_public_key),
    trim(p_inviter_signing_public_key),
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
  if length(trim(p_accepter_device_id)) = 0
    or length(trim(p_accepter_public_key)) = 0
    or length(trim(p_accepter_signing_public_key)) = 0 then
    raise exception 'Invalid accepter input' using errcode = '22023';
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
    trim(p_accepter_device_id),
    v_invite.inviter_public_key,
    trim(p_accepter_public_key),
    v_invite.inviter_signing_public_key,
    trim(p_accepter_signing_public_key),
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
    'memberASigningPublicKey', v_invite.inviter_signing_public_key,
    'memberBSigningPublicKey', trim(p_accepter_signing_public_key),
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
    'memberASigningPublicKey', v_couple.member_a_signing_public_key,
    'memberBSigningPublicKey', v_couple.member_b_signing_public_key,
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
  if length(trim(p_signature)) = 0 then
    raise exception 'Invalid signature' using errcode = '22023';
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
    trim(p_signature),
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
          'signature', signature,
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

revoke all on function public.spicesync_create_invite(text, text, text, text, text, text, integer) from public;
revoke all on function public.spicesync_get_invite(text) from public;
revoke all on function public.spicesync_accept_invite(text, text, text, text, text, text, text) from public;
revoke all on function public.spicesync_get_couple(text) from public;
revoke all on function public.spicesync_append_event(text, text, text, integer, text, text, text) from public;
revoke all on function public.spicesync_list_events(text, bigint, integer) from public;

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
