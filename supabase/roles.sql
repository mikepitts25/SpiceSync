-- Hosted projects include this helper before application migrations run. The
-- local stack does not, so provide a no-op definition for reproducible replay.
create or replace function public.rls_auto_enable()
returns void
language plpgsql
set search_path = ''
as $$
begin
  return;
end;
$$;
