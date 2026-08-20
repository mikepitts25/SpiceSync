begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

create or replace function tests.get_supabase_uid(identifier text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select (
    pg_catalog.substr(pg_catalog.md5('spicesync-test:' || identifier), 1, 8) || '-' ||
    pg_catalog.substr(pg_catalog.md5('spicesync-test:' || identifier), 9, 4) || '-' ||
    pg_catalog.substr(pg_catalog.md5('spicesync-test:' || identifier), 13, 4) || '-' ||
    pg_catalog.substr(pg_catalog.md5('spicesync-test:' || identifier), 17, 4) || '-' ||
    pg_catalog.substr(pg_catalog.md5('spicesync-test:' || identifier), 21, 12)
  )::uuid;
$$;

create or replace function tests.create_supabase_user(
  identifier text,
  is_anonymous boolean
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := tests.get_supabase_uid(identifier);
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_user_id,
    'authenticated',
    'authenticated',
    identifier || '@spicesync.test',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    is_anonymous
  )
  on conflict (id) do update
  set is_anonymous = excluded.is_anonymous,
      updated_at = excluded.updated_at;

  return v_user_id;
end;
$$;

create or replace function tests.authenticate_as(identifier text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := tests.get_supabase_uid(identifier);
  v_is_anonymous boolean;
begin
  select users.is_anonymous
  into v_is_anonymous
  from auth.users as users
  where users.id = v_user_id;

  if not found then
    raise exception 'Unknown test user: %', identifier;
  end if;

  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', v_user_id,
      'role', 'authenticated',
      'is_anonymous', v_is_anonymous
    )::text,
    true
  );
  perform pg_catalog.set_config('request.jwt.claim.sub', v_user_id::text, true);
  perform pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
end;
$$;

select plan(38);

select tests.create_supabase_user('anonymous-user', is_anonymous := true);
select tests.create_supabase_user('permanent-a', is_anonymous := false);
select tests.create_supabase_user('permanent-b', is_anonymous := false);
select tests.create_supabase_user('permanent-solo', is_anonymous := false);

insert into public.spicesync_devices (
  device_id,
  user_id,
  signing_public_key,
  encryption_public_key,
  status
) values
  ('dev_a1', tests.get_supabase_uid('permanent-a'), 'sign_a1', 'enc_a1', 'active'),
  ('dev_b', tests.get_supabase_uid('permanent-b'), 'sign_b', 'enc_b', 'active');

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
  created_at
) values (
  'cpl_test',
  tests.get_supabase_uid('permanent-a'),
  tests.get_supabase_uid('permanent-b'),
  'dev_a1',
  'dev_b',
  'enc_a1',
  'enc_b',
  'sign_a1',
  'sign_b',
  pg_catalog.now()
);

select tests.authenticate_as('permanent-a');
create temporary table stale_invite_fixture on commit drop as
select response->>'inviteId' as invite_id
from (
  select public.spicesync_create_invite(
    'dev_a1',
    'enc_a1',
    'sign_a1',
    'stale_invite_secret'
  ) as response
) as created_invite;

select tests.authenticate_as('anonymous-user');
select throws_ok(
  $$ select public.spicesync_register_or_recover_device('dev_x','enc_x','sign_x') $$,
  '28000', 'Permanent account required'
);

select tests.authenticate_as('permanent-a');
select lives_ok(
  $$ select public.spicesync_register_or_recover_device('dev_a2','enc_a2','sign_a2') $$,
  'owner can replace their device'
);
select is(
  (
    select pg_catalog.count(*)
    from public.spicesync_devices
    where user_id = tests.get_supabase_uid('permanent-a')
      and status = 'active'
  ),
  1::bigint
);

select is(
  (select status from public.spicesync_devices where device_id = 'dev_a1'),
  'revoked',
  'the replaced device is revoked'
);

select is(
  (select member_a_key_version from public.spicesync_couples where couple_id = 'cpl_test'),
  2,
  'the recovering member key version increments'
);

select lives_ok(
  $$ select public.spicesync_revoke_device('dev_a1') $$,
  'repeated revocation of an owned replaced device is idempotent'
);

select is(
  (
    with registration as materialized (
      select public.spicesync_register_or_recover_device(
        'dev_a2',
        'enc_a2',
        'sign_a2'
      )
    )
    select couple.member_a_key_version
    from public.spicesync_couples as couple
    cross join registration
    where couple.couple_id = 'cpl_test'
  ),
  2,
  'same-device registration does not rotate the key version'
);

select tests.authenticate_as('permanent-b');
select throws_ok(
  pg_catalog.format(
    'select public.spicesync_accept_invite(%L,''dev_b'',''enc_b'',''sign_b'',''stale_invite_secret'')',
    (select invite_id from stale_invite_fixture)
  ),
  'P0001',
  'INVITE_DEVICE_CHANGED',
  'a stale invite cannot bind a revoked inviter device'
);

select throws_ok(
  $$ select public.spicesync_append_event_v2('cpl_test','evt_stale','dev_b','dev_a1',1,'cipher','hash','sig') $$,
  'P0001', 'RECIPIENT_KEY_CHANGED'
);

select tests.authenticate_as('permanent-a');
select throws_ok(
  $$ select public.spicesync_append_event('cpl_test','evt_legacy','dev_a2',1,'cipher','hash','sig') $$,
  'P0001', 'CLIENT_UPGRADE_REQUIRED'
);

select lives_ok(
  $$ select public.spicesync_revoke_device('dev_a2') $$,
  'the owner can explicitly revoke the current device'
);

select is(
  (
    select pg_catalog.count(*)
    from public.spicesync_devices
    where user_id = tests.get_supabase_uid('permanent-a')
      and status = 'active'
  ),
  0::bigint,
  'explicit revocation leaves no active device'
);

select tests.authenticate_as('permanent-solo');
select is(
  (
    select pg_catalog.jsonb_build_object(
      'couple', recovery.response->'couple',
      'recoveryCursor', recovery.response->'recoveryCursor'
    )
    from (
      select public.spicesync_register_or_recover_device(
        'dev_solo',
        'enc_solo',
        'sign_solo'
      ) as response
    ) as recovery
  ),
  '{"couple":null,"recoveryCursor":0}'::jsonb,
  'a permanent user without a couple receives a zero recovery cursor'
);

select tests.create_supabase_user('anonymous-couple-a', is_anonymous := true);
select tests.create_supabase_user('anonymous-couple-b', is_anonymous := true);

insert into public.spicesync_devices (
  device_id,
  user_id,
  signing_public_key,
  encryption_public_key,
  status
) values
  ('dev_anon_a', tests.get_supabase_uid('anonymous-couple-a'), 'sign_anon_a', 'enc_anon_a', 'active'),
  ('dev_anon_b', tests.get_supabase_uid('anonymous-couple-b'), 'sign_anon_b', 'enc_anon_b', 'active');

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
  created_at
) values (
  'cpl_anon',
  tests.get_supabase_uid('anonymous-couple-a'),
  tests.get_supabase_uid('anonymous-couple-b'),
  'dev_anon_a',
  'dev_anon_b',
  'enc_anon_a',
  'enc_anon_b',
  'sign_anon_a',
  'sign_anon_b',
  pg_catalog.now()
);

insert into public.spicesync_invites (
  invite_id,
  inviter_user_id,
  inviter_device_id,
  inviter_public_key,
  inviter_signing_public_key,
  invite_secret_hash,
  expires_at
) values (
  'inv_anon_partner',
  tests.get_supabase_uid('anonymous-couple-b'),
  'dev_anon_b',
  'enc_anon_b',
  'sign_anon_b',
  'anon-proof',
  pg_catalog.now() + interval '1 day'
);

select tests.authenticate_as('anonymous-couple-a');
select throws_ok(
  $$ select public.spicesync_create_invite('dev_anon_a','enc_anon_a','sign_anon_a','anon-hash') $$,
  '28000', 'Permanent account required',
  'a live anonymous user cannot create a new partner invite'
);
select throws_ok(
  $$ select public.spicesync_accept_invite('inv_anon_partner','dev_anon_new','enc_anon_new','sign_anon_new','anon-proof') $$,
  '28000', 'Permanent account required',
  'a live anonymous user cannot accept a new partner invite'
);
select throws_ok(
  $$ select public.spicesync_revoke_device('dev_anon_a') $$,
  '28000', 'Permanent account required',
  'a live anonymous user cannot revoke a device registry row'
);
select lives_ok(
  $$ select public.spicesync_get_invite('inv_anon_partner') $$,
  'a live anonymous user retains compatible invite read access'
);
select lives_ok(
  $$ select public.spicesync_get_couple('cpl_anon') $$,
  'a live anonymous couple member can read their couple'
);
select lives_ok(
  $$ select public.spicesync_append_event('cpl_anon','evt_anon_v1','dev_anon_a',1,'anon-v1-payload',encode(extensions.digest('anon-v1-payload','sha256'),'base64'),'anon-v1-signature') $$,
  'a live anonymous couple member can append a compatible v1 event'
);
select lives_ok(
  $$ select public.spicesync_append_event_v2('cpl_anon','evt_anon_v2','dev_anon_a','dev_anon_b',2,'anon-v2-payload',encode(extensions.digest('anon-v2-payload','sha256'),'base64'),'anon-v2-signature') $$,
  'a live anonymous couple member can append a current v2 event'
);
select lives_ok(
  $$ select public.spicesync_list_events('cpl_anon',0,100) $$,
  'a live anonymous couple member can list their events'
);
select lives_ok(
  $$ select public.spicesync_find_couple_for_device('dev_anon_a') $$,
  'a live anonymous couple member can find their couple by owned device'
);
select lives_ok(
  $$ select public.spicesync_revoke_couple('cpl_anon') $$,
  'a live anonymous couple member can revoke their couple'
);

select tests.create_supabase_user('stale-deleted-user', is_anonymous := false);
select tests.create_supabase_user('stale-surviving-user', is_anonymous := false);

insert into public.spicesync_devices (
  device_id,
  user_id,
  signing_public_key,
  encryption_public_key,
  status
) values
  ('dev_stale_deleted', tests.get_supabase_uid('stale-deleted-user'), 'sign_stale_deleted', 'enc_stale_deleted', 'active'),
  ('dev_stale_surviving', tests.get_supabase_uid('stale-surviving-user'), 'sign_stale_surviving', 'enc_stale_surviving', 'active');

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
  created_at
) values (
  'cpl_stale_deleted',
  tests.get_supabase_uid('stale-deleted-user'),
  tests.get_supabase_uid('stale-surviving-user'),
  'dev_stale_deleted',
  'dev_stale_surviving',
  'enc_stale_deleted',
  'enc_stale_surviving',
  'sign_stale_deleted',
  'sign_stale_surviving',
  pg_catalog.now()
);

insert into public.spicesync_invites (
  invite_id,
  inviter_user_id,
  inviter_device_id,
  inviter_public_key,
  inviter_signing_public_key,
  invite_secret_hash,
  expires_at
) values (
  'inv_stale_survives',
  tests.get_supabase_uid('stale-surviving-user'),
  'dev_stale_surviving',
  'enc_stale_surviving',
  'sign_stale_surviving',
  'stale-proof',
  pg_catalog.now() + interval '1 day'
);

select tests.authenticate_as('stale-deleted-user');
delete from auth.users where id = tests.get_supabase_uid('stale-deleted-user');

select is(
  (select pg_catalog.count(*) from auth.users where id = tests.get_supabase_uid('stale-deleted-user')),
  0::bigint,
  'the stale JWT subject no longer has an auth.users row'
);
select is(
  (select pg_catalog.count(*) from public.spicesync_devices where user_id = tests.get_supabase_uid('stale-deleted-user')),
  0::bigint,
  'auth deletion cascades the stale subject device registry rows'
);
select is(
  (select pg_catalog.count(*) from public.spicesync_couples where couple_id = 'cpl_stale_deleted'),
  0::bigint,
  'auth deletion cascades the stale subject couple rows'
);
select is(
  (select pg_catalog.count(*) from public.spicesync_events where couple_id = 'cpl_stale_deleted'),
  0::bigint,
  'auth deletion cascades the stale subject event rows'
);

select throws_ok($$ select public.spicesync_create_invite('dev_stale_new','enc_stale_new','sign_stale_new','hash_stale') $$, '28000', 'Authentication required', 'a stale JWT cannot create an invite or register a device');
select throws_ok($$ select public.spicesync_get_invite('inv_stale_survives') $$, '28000', 'Authentication required', 'a stale JWT cannot access another account invite');
select throws_ok($$ select public.spicesync_accept_invite('inv_stale_survives','dev_stale_new','enc_stale_new','sign_stale_new','stale-proof') $$, '28000', 'Authentication required', 'a stale JWT cannot accept an invite');
select throws_ok($$ select public.spicesync_get_couple('cpl_stale_deleted') $$, '28000', 'Authentication required', 'a stale JWT cannot access a deleted couple');
select throws_ok($$ select public.spicesync_register_or_recover_device('dev_stale_new','enc_stale_new','sign_stale_new') $$, '28000', 'Authentication required', 'a stale JWT cannot register or recover a device');
select throws_ok($$ select public.spicesync_revoke_device('dev_stale_deleted') $$, '28000', 'Authentication required', 'a stale JWT cannot revoke a device');
select throws_ok($$ select public.spicesync_append_event('cpl_stale_deleted','evt_stale_deleted','dev_stale_deleted',1,'cipher','hash','sig') $$, '28000', 'Authentication required', 'a stale JWT cannot append legacy events');
select throws_ok($$ select public.spicesync_append_event_v2('cpl_stale_deleted','evt_stale_deleted_v2','dev_stale_deleted','dev_stale_surviving',1,'cipher','hash','sig') $$, '28000', 'Authentication required', 'a stale JWT cannot append current events');
select throws_ok($$ select public.spicesync_list_events('cpl_stale_deleted',0,10) $$, '28000', 'Authentication required', 'a stale JWT cannot pull events');
select throws_ok($$ select public.spicesync_revoke_couple('cpl_stale_deleted') $$, '28000', 'Authentication required', 'a stale JWT cannot revoke a couple');
select throws_ok($$ select public.spicesync_find_couple_for_device('dev_stale_deleted') $$, '28000', 'Authentication required', 'a stale JWT cannot find a couple by device');

select * from finish();
rollback;
