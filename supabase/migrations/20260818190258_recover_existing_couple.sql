create index if not exists spicesync_couples_member_a_recovery
  on public.spicesync_couples (member_a_user_id, member_a_device_id, created_at desc)
  where revoked_at is null;

create index if not exists spicesync_couples_member_b_recovery
  on public.spicesync_couples (member_b_user_id, member_b_device_id, created_at desc)
  where revoked_at is null;

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
    select couple_id, created_at
    from public.spicesync_couples
    where member_a_user_id = v_user_id
      and member_a_device_id = v_device_id
      and revoked_at is null

    union all

    select couple_id, created_at
    from public.spicesync_couples
    where member_b_user_id = v_user_id
      and member_b_device_id = v_device_id
      and revoked_at is null
  ) as candidate
  order by candidate.created_at desc
  limit 1;

  if v_couple_id is null then
    return null;
  end if;

  return public.spicesync_get_couple(v_couple_id);
end;
$$;

revoke all on function public.spicesync_find_couple_for_device(text)
  from public, anon;
grant execute on function public.spicesync_find_couple_for_device(text)
  to authenticated;
