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

select plan(13);

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

select * from finish();
rollback;
