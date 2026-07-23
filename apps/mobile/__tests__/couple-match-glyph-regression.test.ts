import fs from 'fs';
import path from 'path';

const mobileRoot = path.resolve(__dirname, '..');
const sourceRoots = ['app', 'components', 'constants', 'lib', 'src'];
const legacyGlyph = String.fromCodePoint(0x1f491);

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return /\.tsx?$/.test(entry.name) ? [fullPath] : [];
  });
}

describe('legacy couple glyph', () => {
  it('exists only in the non-rendered profile avatar migration list', () => {
    const occurrences = sourceRoots
      .flatMap((root) => collectSourceFiles(path.join(mobileRoot, root)))
      .flatMap((filePath) =>
        fs
          .readFileSync(filePath, 'utf8')
          .split('\n')
          .map((line) => ({ filePath, line }))
          .filter(({ line }) => line.includes(legacyGlyph))
      );

    expect(occurrences).toHaveLength(1);
    expect(path.relative(mobileRoot, occurrences[0].filePath)).toBe(
      path.join('src', 'constants', 'emojis.ts')
    );
    expect(occurrences[0].line).toContain('legacy:');
  });
});
