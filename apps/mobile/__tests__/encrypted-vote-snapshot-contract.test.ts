import fs from 'node:fs';
import path from 'node:path';

describe('encrypted vote snapshot migration contract', () => {
  const migration = fs.readFileSync(
    path.resolve(
      __dirname,
      '../../../supabase/migrations/20260828134623_encrypted_vote_snapshots.sql'
    ),
    'utf8'
  );

  it('stores ciphertext only and exposes current-device snapshot RPCs', () => {
    expect(migration).toContain('create table public.spicesync_vote_snapshots');
    expect(migration).toContain('encrypted_payload text not null');
    expect(migration).toContain('payload_hash text not null');
    expect(migration).toContain('signature text not null');
    expect(migration).toContain('spicesync_put_vote_snapshot');
    expect(migration).toContain('spicesync_get_vote_snapshot');
    expect(migration).not.toMatch(/\bcard_id\b/i);
    expect(migration).not.toMatch(/\bvote_value\b/i);
  });

  it('increments the recovering recipient request generation', () => {
    expect(migration).toContain('member_a_snapshot_request_generation');
    expect(migration).toContain('member_b_snapshot_request_generation');
    expect(migration).toMatch(
      /member_a_snapshot_request_generation\s*:=\s*old\.member_a_snapshot_request_generation\s*\+\s*1/
    );
    expect(migration).toMatch(
      /member_b_snapshot_request_generation\s*:=\s*old\.member_b_snapshot_request_generation\s*\+\s*1/
    );
  });

  it('locks down the table and RPC execution surface', () => {
    expect(migration).toContain(
      'alter table public.spicesync_vote_snapshots enable row level security'
    );
    expect(migration).toContain(
      'revoke all on table public.spicesync_vote_snapshots from anon, authenticated'
    );
    expect(migration).toContain(
      'grant execute on function public.spicesync_put_vote_snapshot'
    );
    expect(migration).toContain(
      'grant execute on function public.spicesync_get_vote_snapshot'
    );
  });
});
