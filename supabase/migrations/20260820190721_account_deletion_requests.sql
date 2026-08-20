create table public.spicesync_account_deletion_requests (
  request_id uuid primary key default extensions.gen_random_uuid(),
  provider text not null check (provider in ('apple', 'google')),
  contact text not null,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.spicesync_account_deletion_requests enable row level security;

revoke all on table public.spicesync_account_deletion_requests
  from public, anon, authenticated;
