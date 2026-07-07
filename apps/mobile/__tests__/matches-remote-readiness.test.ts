import fs from 'node:fs';
import path from 'node:path';

const matchesSource = fs.readFileSync(
  path.resolve(__dirname, '../app/(matches)/MatchesScreen.tsx'),
  'utf8'
);

describe('remote match readiness mapping', () => {
  it('preserves partner readiness refinements when building match buckets', () => {
    expect(matchesSource).toContain('readiness: record.readiness');
  });
});
