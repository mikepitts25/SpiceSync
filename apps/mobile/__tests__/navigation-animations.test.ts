import fs from 'fs';
import path from 'path';

const appRoot = path.resolve(__dirname, '..');
const transitionsPath = path.join(appRoot, 'lib/navigation/transitions.ts');

const stackLayoutFiles = [
  'app/_layout.tsx',
  'app/(game)/_layout.tsx',
  'app/(insights)/_layout.tsx',
  'app/(onboarding)/_layout.tsx',
  'app/(settings)/_layout.tsx',
];

const primaryTabRouteFiles = [
  'app/(tabs)/profiles.tsx',
  'app/(tabs)/deck.tsx',
  'app/(tabs)/matches.tsx',
  'app/(tabs)/conversation.tsx',
  'app/(tabs)/game.tsx',
];

const fadeAnimationPattern = /animation:\s*['"]fade['"]/;
const sharedOptionsPattern = /STACK_SCREEN_OPTIONS/;

function readMobileFile(relativePath: string) {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf8');
}

describe('navigation stack animations', () => {
  it.each(stackLayoutFiles)(
    '%s opts into the shared fade transition',
    (relativePath) => {
      const source = readMobileFile(relativePath);

      if (sharedOptionsPattern.test(source)) {
        expect(readMobileFile('lib/navigation/transitions.ts')).toMatch(
          fadeAnimationPattern
        );
        return;
      }

      expect(source).toMatch(fadeAnimationPattern);
    }
  );

  it('keeps the shared stack transition from falling back to a horizontal slide', () => {
    expect(fs.existsSync(transitionsPath)).toBe(true);
    const source = readMobileFile('lib/navigation/transitions.ts');

    expect(source).toMatch(fadeAnimationPattern);
    expect(source).not.toMatch(
      /animation:\s*['"](?:slide_from_right|simple_push|default)['"]/
    );
  });

  it.each(primaryTabRouteFiles)(
    '%s stays in the tab navigator for primary tab switching',
    (relativePath) => {
      const source = readMobileFile(relativePath);

      expect(source).not.toMatch(/\bRedirect\b/);
      expect(source).not.toMatch(/<Redirect\b/);
      expect(source).not.toMatch(/href=['"]\/\((conversation|game)\)['"]/);
    }
  );
});
