import fs from 'fs';
import path from 'path';

const mobileRoot = path.join(__dirname, '..');

describe('release check command', () => {
  it('exposes a one-command release verification script', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(mobileRoot, 'package.json'), 'utf8')
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.['release:check']).toBe(
      'node scripts/release-check.js'
    );
    expect(
      fs.existsSync(path.join(mobileRoot, 'scripts', 'release-check.js'))
    ).toBe(true);
  });
});
