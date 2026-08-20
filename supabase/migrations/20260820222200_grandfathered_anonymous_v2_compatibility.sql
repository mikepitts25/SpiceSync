begin;

-- A pre-device-registry anonymous couple has no unambiguous row to backfill:
-- the couple row is the only durable device/key ownership record. Preserve a
-- narrow version-one path for that live installation while keeping the normal
-- active-registry rule for every registered, replaced, or rotated device.
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
  v_user_id uuid := public.spicesync_require_current_auth_user();
  v_author_device_id text := trim(coalesce(p_author_device_id, ''));
  v_recipient_device_id text := trim(coalesce(p_recipient_device_id, ''));
  v_expected_recipient_device_id text;
  v_author_encryption_public_key text;
  v_author_signing_public_key text;
  v_recipient_encryption_public_key text;
  v_recipient_signing_public_key text;
  v_author_key_version integer;
  v_recipient_key_version integer;
  v_recipient_user_id uuid;
  v_author_is_anonymous boolean;
  v_recipient_is_anonymous boolean;
  v_author_is_registered boolean := false;
  v_recipient_is_registered boolean := false;
  v_couple public.spicesync_couples%rowtype;
  v_event public.spicesync_events%rowtype;
  v_now timestamptz := now();
  v_expires_at timestamptz := now() + interval '90 days';
begin
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
    v_author_encryption_public_key := v_couple.member_a_public_key;
    v_author_signing_public_key := v_couple.member_a_signing_public_key;
    v_recipient_encryption_public_key := v_couple.member_b_public_key;
    v_recipient_signing_public_key := v_couple.member_b_signing_public_key;
    v_author_key_version := v_couple.member_a_key_version;
    v_recipient_key_version := v_couple.member_b_key_version;
    v_recipient_user_id := v_couple.member_b_user_id;
  elsif v_user_id = v_couple.member_b_user_id then
    if v_author_device_id <> v_couple.member_b_device_id then
      raise exception 'Author device is not active' using errcode = '28000';
    end if;
    v_expected_recipient_device_id := v_couple.member_a_device_id;
    v_author_encryption_public_key := v_couple.member_b_public_key;
    v_author_signing_public_key := v_couple.member_b_signing_public_key;
    v_recipient_encryption_public_key := v_couple.member_a_public_key;
    v_recipient_signing_public_key := v_couple.member_a_signing_public_key;
    v_author_key_version := v_couple.member_b_key_version;
    v_recipient_key_version := v_couple.member_a_key_version;
    v_recipient_user_id := v_couple.member_a_user_id;
  else
    raise exception 'Author is not a couple member' using errcode = '28000';
  end if;

  if v_recipient_device_id <> v_expected_recipient_device_id then
    raise exception 'RECIPIENT_KEY_CHANGED' using errcode = 'P0001';
  end if;

  select exists (
    select 1
    from public.spicesync_devices as device
    where device.device_id = v_author_device_id
      and device.user_id = v_user_id
      and device.status = 'active'
      and device.encryption_public_key = v_author_encryption_public_key
      and device.signing_public_key = v_author_signing_public_key
  ) into v_author_is_registered;

  select exists (
    select 1
    from public.spicesync_devices as device
    where device.device_id = v_recipient_device_id
      and device.user_id = v_recipient_user_id
      and device.status = 'active'
      and device.encryption_public_key = v_recipient_encryption_public_key
      and device.signing_public_key = v_recipient_signing_public_key
  ) into v_recipient_is_registered;

  if not v_author_is_registered then
    select users.is_anonymous
    into v_author_is_anonymous
    from auth.users as users
    where users.id = v_user_id;

    if not found
      or not coalesce(v_author_is_anonymous, false)
      or v_author_key_version <> 1
      or v_recipient_key_version <> 1
      or exists (
        select 1
        from public.spicesync_devices as device
        where device.user_id = v_user_id
           or device.device_id = v_author_device_id
      ) then
      raise exception 'Author device is not active' using errcode = '28000';
    end if;

    -- The opposite member must still be a live Auth owner. It may either be
    -- another untouched anonymous side with no registry history, or an exact
    -- active version-one device registered while protecting the same couple.
    select users.is_anonymous
    into v_recipient_is_anonymous
    from auth.users as users
    where users.id = v_recipient_user_id;

    if not found or not (
      v_recipient_is_registered
      or (
        coalesce(v_recipient_is_anonymous, false)
        and not exists (
          select 1
          from public.spicesync_devices as device
          where device.user_id = v_recipient_user_id
             or device.device_id = v_recipient_device_id
        )
      )
    ) then
      raise exception 'Recipient device is not active' using errcode = '28000';
    end if;
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

  if v_author_is_registered then
    update public.spicesync_devices as device
    set last_seen_at = v_now
    where device.device_id = v_author_device_id
      and device.user_id = v_user_id
      and device.status = 'active';
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

revoke all on function public.spicesync_append_event_v2(
  text, text, text, text, integer, text, text, text
) from public, anon, authenticated;
grant execute on function public.spicesync_append_event_v2(
  text, text, text, text, integer, text, text, text
) to authenticated;

commit;
