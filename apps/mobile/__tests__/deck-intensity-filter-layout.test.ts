import fs from 'node:fs';
import path from 'node:path';

const deckSource = fs.readFileSync(
  path.resolve(__dirname, '../app/(tabs)/deck.tsx'),
  'utf8'
);

describe('Deck intensity filter layout', () => {
  it('does not render a duplicate selected intensity summary', () => {
    expect(deckSource).not.toContain('activeFilterLabel');
    expect(deckSource).not.toContain('filterSummary');
  });

  it('uses a wrapped grid for intensity options', () => {
    expect(deckSource).toContain('styles.tierGrid');
    expect(deckSource).toContain("flexWrap: 'wrap'");
  });

  it('keeps the swipe card headline slightly smaller than the old oversized title', () => {
    expect(deckSource).toContain('fontSize: 32');
    expect(deckSource).toContain('lineHeight: 36');
    expect(deckSource).not.toContain('fontSize: 34');
  });
});
