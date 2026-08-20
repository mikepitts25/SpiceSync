-- Supabase access tokens are stateless until expiry. Every durable application
-- action must therefore establish that auth.uid() still names a permanent row.
begin;

create or replace function public.spicesync_require_current_permanent_user()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_anonymous boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select users.is_anonymous
    into v_is_anonymous
    from auth.users
    where users.id = v_user_id;
  if not found then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if coalesce(v_is_anonymous, false) then
    raise exception 'Permanent account required' using errcode = '28000';
  end if;
  return v_user_id;
end;
$$;

revoke all on function public.spicesync_require_current_permanent_user() from public, anon;
grant execute on function public.spicesync_require_current_permanent_user() to authenticated;

do $$
declare
  v_function regprocedure;
  v_definition text;
begin
  foreach v_function in array array[
    'public.spicesync_create_invite(text,text,text,text,text,text,integer)'::regprocedure,
    'public.spicesync_get_invite(text)'::regprocedure,
    'public.spicesync_accept_invite(text,text,text,text,text,text,text)'::regprocedure,
    'public.spicesync_get_couple(text)'::regprocedure,
    'public.spicesync_register_or_recover_device(text,text,text)'::regprocedure,
    'public.spicesync_revoke_device(text)'::regprocedure,
    'public.spicesync_append_event(text,text,text,integer,text,text,text)'::regprocedure,
    'public.spicesync_append_event_v2(text,text,text,text,integer,text,text,text)'::regprocedure,
    'public.spicesync_list_events(text,bigint,integer)'::regprocedure,
    'public.spicesync_revoke_couple(text)'::regprocedure,
    'public.spicesync_find_couple_for_device(text)'::regprocedure
  ] loop
    v_definition := pg_get_functiondef(v_function);
    if position('v_user_id uuid := auth.uid();' in v_definition) = 0 then
      raise exception 'Expected auth guard marker was not found in %', v_function;
    end if;
    execute replace(
      v_definition,
      'v_user_id uuid := auth.uid();',
      'v_user_id uuid := public.spicesync_require_current_permanent_user();'
    );
  end loop;
end;
$$;

commit;
