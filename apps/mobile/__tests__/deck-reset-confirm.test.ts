import fs from 'fs';
import path from 'path';

const appRoot = path.resolve(__dirname, '..');
const deckScreenPath = path.join(appRoot, 'app/(tabs)/deck.tsx');
const enPath = path.join(appRoot, 'lib/i18n/en.ts');
const esPath = path.join(appRoot, 'lib/i18n/es.ts');

function readDeckScreen() {
  return fs.readFileSync(deckScreenPath, 'utf8');
}

describe('deck reset confirmation', () => {
  it('routes the reset button through a confirmation instead of clearing votes on press', () => {
    const source = readDeckScreen();

    expect(source).toMatch(/onPress=\{handleResetDeck\}/);
    expect(source).toMatch(/const handleResetDeck = useCallback/);
    expect(source).toMatch(/Alert\.alert\(\s*t\.deck\.resetDeckConfirmTitle/);
    expect(source).toMatch(/style: 'cancel'/);
    expect(source).toMatch(/style: 'destructive'/);

    // The wipe must only be reachable from inside the confirm handler.
    const clearCalls = source.match(
      /clearVotesForKinks\(activeProfileIdValue/g
    );
    expect(clearCalls).toHaveLength(1);
    const confirmBlock = source.slice(
      source.indexOf('const handleResetDeck'),
      source.indexOf('const applyTierFilter')
    );
    expect(confirmBlock).toMatch(
      /onPress: \(\) => \{\s*clearVotesForKinks\(activeProfileIdValue, allKinkIdsInFilter\);/
    );
  });

  it('tells the user how many votes the reset erases', () => {
    const source = readDeckScreen();

    expect(source).toMatch(/const clearedCount = allKinkIdsInFilter\.filter/);
    expect(source).toMatch(/count: clearedCount/);

    for (const localePath of [enPath, esPath]) {
      const locale = fs.readFileSync(localePath, 'utf8');
      expect(locale).toMatch(/resetDeckConfirmTitle:/);
      expect(locale).toMatch(/resetDeckConfirmAction:/);
      expect(locale).toMatch(/resetDeckConfirmBody:[\s\S]{0,200}\{\{count\}\}/);
    }
  });
});
