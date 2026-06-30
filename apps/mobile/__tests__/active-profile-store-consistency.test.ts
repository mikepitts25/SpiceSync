import fs from 'fs';
import path from 'path';

const appRoot = path.join(__dirname, '..', 'app');

const PROFILE_DEPENDENT_SCREENS = [
  path.join(appRoot, '(suggestions)', 'index.tsx'),
  path.join(appRoot, '(insights)', 'index.tsx'),
  path.join(appRoot, '(settings)', 'export.tsx'),
  path.join(appRoot, '(home)', 'activity', '[id].tsx'),
];

describe('active profile store consistency', () => {
  it('uses the profiles store for active profile dependent screens', () => {
    for (const screenPath of PROFILE_DEPENDENT_SCREENS) {
      const source = fs.readFileSync(screenPath, 'utf8');

      expect(source).toContain('useProfilesStore');
      expect(source).not.toContain(
        'useSettingsStore((state) => state.activeProfileId)'
      );
    }
  });
});
