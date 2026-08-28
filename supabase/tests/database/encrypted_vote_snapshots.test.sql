begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

create or replace function tests.snapshot_authenticate(p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', p_user_id,
      'role', 'authenticated',
      'is_anonymous', false
    )::text,
    true
  );
  perform pg_catalog.set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
end;
$$;

select plan(17);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_anonymous
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'snapshot-a@test.invalid', '', now(), '{}', '{}', now(), now(), false),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'snapshot-b@test.invalid', '', now(), '{}', '{}', now(), now(), false),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'snapshot-outsider@test.invalid', '', now(), '{}', '{}', now(), now(), false);

insert into public.spicesync_devices (
  device_id, user_id, signing_public_key, encryption_public_key, status
) values
  ('snapshot_dev_a', '10000000-0000-0000-0000-000000000001', 'sign_a', 'enc_a', 'active'),
  ('snapshot_dev_b', '10000000-0000-0000-0000-000000000002', 'sign_b', 'enc_b', 'active');

insert into public.spicesync_couples (
  couple_id, member_a_user_id, member_b_user_id,
  member_a_device_id, member_b_device_id,
  member_a_public_key, member_b_public_key,
  member_a_signing_public_key, member_b_signing_public_key
) values (
  'cpl_snapshot_test',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'snapshot_dev_a', 'snapshot_dev_b', 'enc_a', 'enc_b', 'sign_a', 'sign_b'
);

select ok(
  not has_table_privilege('authenticated', 'public.spicesync_vote_snapshots', 'select'),
  'authenticated clients have no direct snapshot table access'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.spicesync_put_vote_snapshot(text,text,text,integer,bigint,text,text,text)',
    'execute'
  ),
  'authenticated clients can execute snapshot put RPC'
);

select tests.snapshot_authenticate('10000000-0000-0000-0000-000000000001');
select lives_ok(
  $$ select public.spicesync_put_vote_snapshot(
    'cpl_snapshot_test', 'snapshot_dev_a', 'snapshot_dev_b', 1, 10,
    'cipher-v10', encode(extensions.digest('cipher-v10', 'sha256'), 'base64'), 'signature'
  ) $$,
  'member can publish an encrypted snapshot'
);
select is(
  (public.spicesync_get_vote_snapshot('cpl_snapshot_test')->>'mySnapshotVersion')::bigint,
  10::bigint,
  'get RPC returns the caller publication floor'
);
select throws_ok(
  $$ select public.spicesync_put_vote_snapshot(
    'cpl_snapshot_test', 'wrong_author', 'snapshot_dev_b', 1, 11,
    'cipher', encode(extensions.digest('cipher', 'sha256'), 'base64'), 'signature'
  ) $$,
  'P0001', 'AUTHOR_DEVICE_CHANGED', 'wrong author device is rejected'
);
select throws_ok(
  $$ select public.spicesync_put_vote_snapshot(
    'cpl_snapshot_test', 'snapshot_dev_a', 'wrong_recipient', 1, 11,
    'cipher', encode(extensions.digest('cipher', 'sha256'), 'base64'), 'signature'
  ) $$,
  'P0001', 'RECIPIENT_KEY_CHANGED', 'wrong recipient device is rejected'
);
select throws_ok(
  $$ select public.spicesync_put_vote_snapshot(
    'cpl_snapshot_test', 'snapshot_dev_a', 'snapshot_dev_b', 9, 11,
    'cipher', encode(extensions.digest('cipher', 'sha256'), 'base64'), 'signature'
  ) $$,
  'P0001', 'SNAPSHOT_REQUEST_CHANGED', 'stale request generation is rejected'
);
select is(
  (public.spicesync_put_vote_snapshot(
    'cpl_snapshot_test', 'snapshot_dev_a', 'snapshot_dev_b', 1, 9,
    'older-cipher', encode(extensions.digest('older-cipher', 'sha256'), 'base64'), 'signature'
  )->>'snapshotVersion')::bigint,
  10::bigint,
  'older publication cannot replace a newer snapshot'
);
select is(
  (public.spicesync_put_vote_snapshot(
    'cpl_snapshot_test', 'snapshot_dev_a', 'snapshot_dev_b', 1, 11,
    'cipher-v11', encode(extensions.digest('cipher-v11', 'sha256'), 'base64'), 'signature'
  )->>'snapshotVersion')::bigint,
  11::bigint,
  'newer publication replaces the prior snapshot'
);

select tests.snapshot_authenticate('10000000-0000-0000-0000-000000000002');
select is(
  public.spicesync_get_vote_snapshot('cpl_snapshot_test')->'snapshot'->>'encryptedPayload',
  'cipher-v11',
  'partner receives the latest ciphertext'
);
select is(
  (public.spicesync_get_vote_snapshot('cpl_snapshot_test')->>'myRequestGeneration')::integer,
  1,
  'recipient sees its current request generation'
);

select tests.snapshot_authenticate('10000000-0000-0000-0000-000000000003');
select throws_ok(
  $$ select public.spicesync_get_vote_snapshot('cpl_snapshot_test') $$,
  'P0002', 'Couple not found', 'non-member cannot read the snapshot mailbox'
);

select tests.snapshot_authenticate('10000000-0000-0000-0000-000000000002');
update public.spicesync_couples
set member_b_public_key = 'enc_b_rotated'
where couple_id = 'cpl_snapshot_test';
select is(
  (select member_b_snapshot_request_generation from public.spicesync_couples where couple_id = 'cpl_snapshot_test'),
  2,
  'recipient key rotation increments snapshot request generation'
);
select is(
  public.spicesync_get_vote_snapshot('cpl_snapshot_test')->'snapshot',
  'null'::jsonb,
  'ciphertext for the prior recipient key is no longer returned'
);

select tests.snapshot_authenticate('10000000-0000-0000-0000-000000000001');
select throws_ok(
  $$ select public.spicesync_put_vote_snapshot(
    'cpl_snapshot_test', 'snapshot_dev_a', 'snapshot_dev_b', 1, 12,
    'cipher', encode(extensions.digest('cipher', 'sha256'), 'base64'), 'signature'
  ) $$,
  'P0001', 'SNAPSHOT_REQUEST_CHANGED', 'old generation cannot publish after key rotation'
);
select lives_ok(
  $$ select public.spicesync_put_vote_snapshot(
    'cpl_snapshot_test', 'snapshot_dev_a', 'snapshot_dev_b', 2, 12,
    'new-key-cipher', encode(extensions.digest('new-key-cipher', 'sha256'), 'base64'), 'signature'
  ) $$,
  'current generation can publish after key rotation'
);

update public.spicesync_couples
set revoked_at = now()
where couple_id = 'cpl_snapshot_test';
select throws_ok(
  $$ select public.spicesync_get_vote_snapshot('cpl_snapshot_test') $$,
  'P0002', 'Couple not found', 'revoked couples cannot read snapshots'
);

select * from finish();
rollback;
