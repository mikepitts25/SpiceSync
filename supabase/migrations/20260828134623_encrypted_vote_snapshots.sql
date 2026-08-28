begin;

alter table public.spicesync_couples
  add column member_a_snapshot_request_generation integer not null default 1
    check (member_a_snapshot_request_generation > 0),
  add column member_b_snapshot_request_generation integer not null default 1
    check (member_b_snapshot_request_generation > 0);

create table public.spicesync_vote_snapshots (
  couple_id text not null references public.spicesync_couples(couple_id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  author_device_id text not null,
  recipient_device_id text not null,
  request_generation integer not null check (request_generation > 0),
  snapshot_version bigint not null check (snapshot_version > 0),
  encrypted_payload text not null,
  payload_hash text not null,
  signature text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (couple_id, author_user_id),
  check (author_user_id <> recipient_user_id),
  check (author_device_id <> recipient_device_id)
);

alter table public.spicesync_vote_snapshots enable row level security;
revoke all on table public.spicesync_vote_snapshots from anon, authenticated;

create or replace function public.spicesync_bump_snapshot_request_generation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.member_a_device_id is distinct from old.member_a_device_id
    or new.member_a_public_key is distinct from old.member_a_public_key
    or new.member_a_signing_public_key is distinct from old.member_a_signing_public_key then
    new.member_a_snapshot_request_generation := old.member_a_snapshot_request_generation + 1;
  end if;
  if new.member_b_device_id is distinct from old.member_b_device_id
    or new.member_b_public_key is distinct from old.member_b_public_key
    or new.member_b_signing_public_key is distinct from old.member_b_signing_public_key then
    new.member_b_snapshot_request_generation := old.member_b_snapshot_request_generation + 1;
  end if;
  return new;
end;
$$;

create trigger spicesync_couples_bump_snapshot_request_generation
before update of
  member_a_device_id,
  member_a_public_key,
  member_a_signing_public_key,
  member_b_device_id,
  member_b_public_key,
  member_b_signing_public_key
on public.spicesync_couples
for each row execute function public.spicesync_bump_snapshot_request_generation();

create or replace function public.spicesync_vote_snapshot_json(
  p_snapshot public.spicesync_vote_snapshots
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'coupleId', p_snapshot.couple_id,
    'authorDeviceId', p_snapshot.author_device_id,
    'recipientDeviceId', p_snapshot.recipient_device_id,
    'requestGeneration', p_snapshot.request_generation,
    'snapshotVersion', p_snapshot.snapshot_version,
    'encryptedPayload', p_snapshot.encrypted_payload,
    'payloadHash', p_snapshot.payload_hash,
    'signature', p_snapshot.signature,
    'createdAt', public.spicesync_epoch(p_snapshot.created_at),
    'updatedAt', public.spicesync_epoch(p_snapshot.updated_at)
  );
$$;

create or replace function public.spicesync_put_vote_snapshot(
  p_couple_id text,
  p_author_device_id text,
  p_recipient_device_id text,
  p_request_generation integer,
  p_snapshot_version bigint,
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
  v_couple public.spicesync_couples%rowtype;
  v_recipient_user_id uuid;
  v_expected_author_device_id text;
  v_expected_recipient_device_id text;
  v_expected_request_generation integer;
  v_snapshot public.spicesync_vote_snapshots%rowtype;
begin
  select couple.* into v_couple
  from public.spicesync_couples as couple
  where couple.couple_id = p_couple_id
    and couple.revoked_at is null
    and v_user_id in (couple.member_a_user_id, couple.member_b_user_id)
  for update;
  if not found then
    raise exception 'Couple not found' using errcode = 'P0002';
  end if;

  if v_user_id = v_couple.member_a_user_id then
    v_recipient_user_id := v_couple.member_b_user_id;
    v_expected_author_device_id := v_couple.member_a_device_id;
    v_expected_recipient_device_id := v_couple.member_b_device_id;
    v_expected_request_generation := v_couple.member_b_snapshot_request_generation;
  else
    v_recipient_user_id := v_couple.member_a_user_id;
    v_expected_author_device_id := v_couple.member_b_device_id;
    v_expected_recipient_device_id := v_couple.member_a_device_id;
    v_expected_request_generation := v_couple.member_a_snapshot_request_generation;
  end if;

  if trim(coalesce(p_author_device_id, '')) <> v_expected_author_device_id then
    raise exception 'AUTHOR_DEVICE_CHANGED' using errcode = 'P0001';
  end if;
  if trim(coalesce(p_recipient_device_id, '')) <> v_expected_recipient_device_id then
    raise exception 'RECIPIENT_KEY_CHANGED' using errcode = 'P0001';
  end if;
  if p_request_generation is distinct from v_expected_request_generation then
    raise exception 'SNAPSHOT_REQUEST_CHANGED' using errcode = 'P0001';
  end if;
  if p_snapshot_version is null or p_snapshot_version < 1
    or length(coalesce(p_encrypted_payload, '')) = 0
    or length(trim(coalesce(p_signature, ''))) = 0 then
    raise exception 'Invalid snapshot input' using errcode = '22023';
  end if;
  if encode(extensions.digest(p_encrypted_payload, 'sha256'), 'base64') <> p_payload_hash then
    raise exception 'Payload hash mismatch' using errcode = '22000';
  end if;

  insert into public.spicesync_vote_snapshots as snapshot (
    couple_id,
    author_user_id,
    recipient_user_id,
    author_device_id,
    recipient_device_id,
    request_generation,
    snapshot_version,
    encrypted_payload,
    payload_hash,
    signature
  ) values (
    p_couple_id,
    v_user_id,
    v_recipient_user_id,
    v_expected_author_device_id,
    v_expected_recipient_device_id,
    p_request_generation,
    p_snapshot_version,
    p_encrypted_payload,
    p_payload_hash,
    trim(p_signature)
  )
  on conflict (couple_id, author_user_id) do update
  set recipient_user_id = excluded.recipient_user_id,
      author_device_id = excluded.author_device_id,
      recipient_device_id = excluded.recipient_device_id,
      request_generation = excluded.request_generation,
      snapshot_version = excluded.snapshot_version,
      encrypted_payload = excluded.encrypted_payload,
      payload_hash = excluded.payload_hash,
      signature = excluded.signature,
      updated_at = now()
  where snapshot.author_device_id <> excluded.author_device_id
     or snapshot.recipient_device_id <> excluded.recipient_device_id
     or snapshot.request_generation < excluded.request_generation
     or (
       snapshot.request_generation = excluded.request_generation
       and snapshot.snapshot_version < excluded.snapshot_version
     )
  returning * into v_snapshot;

  if not found then
    select snapshot.* into v_snapshot
    from public.spicesync_vote_snapshots as snapshot
    where snapshot.couple_id = p_couple_id
      and snapshot.author_user_id = v_user_id;
  end if;
  return public.spicesync_vote_snapshot_json(v_snapshot);
end;
$$;

create or replace function public.spicesync_get_vote_snapshot(p_couple_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.spicesync_require_current_auth_user();
  v_couple public.spicesync_couples%rowtype;
  v_partner_user_id uuid;
  v_my_device_id text;
  v_my_request_generation integer;
  v_partner_request_generation integer;
  v_snapshot public.spicesync_vote_snapshots%rowtype;
  v_snapshot_json jsonb := null;
begin
  select couple.* into v_couple
  from public.spicesync_couples as couple
  where couple.couple_id = p_couple_id
    and couple.revoked_at is null
    and v_user_id in (couple.member_a_user_id, couple.member_b_user_id);
  if not found then
    raise exception 'Couple not found' using errcode = 'P0002';
  end if;

  if v_user_id = v_couple.member_a_user_id then
    v_partner_user_id := v_couple.member_b_user_id;
    v_my_device_id := v_couple.member_a_device_id;
    v_my_request_generation := v_couple.member_a_snapshot_request_generation;
    v_partner_request_generation := v_couple.member_b_snapshot_request_generation;
  else
    v_partner_user_id := v_couple.member_a_user_id;
    v_my_device_id := v_couple.member_b_device_id;
    v_my_request_generation := v_couple.member_b_snapshot_request_generation;
    v_partner_request_generation := v_couple.member_a_snapshot_request_generation;
  end if;

  select snapshot.* into v_snapshot
  from public.spicesync_vote_snapshots as snapshot
  where snapshot.couple_id = p_couple_id
    and snapshot.author_user_id = v_partner_user_id
    and snapshot.recipient_user_id = v_user_id
    and snapshot.recipient_device_id = v_my_device_id
    and snapshot.request_generation = v_my_request_generation;
  if found then
    v_snapshot_json := public.spicesync_vote_snapshot_json(v_snapshot);
  end if;

  return jsonb_build_object(
    'snapshot', v_snapshot_json,
    'myRequestGeneration', v_my_request_generation,
    'partnerRequestGeneration', v_partner_request_generation
  );
end;
$$;

revoke all on function public.spicesync_bump_snapshot_request_generation() from public, anon, authenticated;
revoke all on function public.spicesync_vote_snapshot_json(public.spicesync_vote_snapshots) from public, anon, authenticated;
revoke all on function public.spicesync_put_vote_snapshot(text, text, text, integer, bigint, text, text, text) from public, anon, authenticated;
revoke all on function public.spicesync_get_vote_snapshot(text) from public, anon, authenticated;
grant execute on function public.spicesync_put_vote_snapshot(text, text, text, integer, bigint, text, text, text) to authenticated;
grant execute on function public.spicesync_get_vote_snapshot(text) to authenticated;

commit;
