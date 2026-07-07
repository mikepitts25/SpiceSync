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

  it('centers partner vote status text across the status pill', () => {
    expect(deckSource).toContain('styles.partnerAvatarSlot');
    expect(deckSource).toMatch(
      /partnerPill:\s*{[^}]*position: 'relative'[^}]*justifyContent: 'center'/s
    );
    expect(deckSource).toMatch(
      /partnerCopy:\s*{[^}]*width: '100%'[^}]*alignItems: 'center'/s
    );
    expect(deckSource).toMatch(
      /partnerName:\s*{[^}]*width: '100%'[^}]*textAlign: 'center'/s
    );
    expect(deckSource).toMatch(
      /partnerStatus:\s*{[^}]*width: '100%'[^}]*textAlign: 'center'/s
    );
  });

  it('shows every readiness choice directly on the card', () => {
    expect(deckSource).toContain("label: 'Hard No'");
    expect(deckSource).toContain("label: 'Not Now'");
    expect(deckSource).toContain("label: 'Curious'");
    expect(deckSource).toContain("label: 'Yes'");
    expect(deckSource).toContain("readiness: 'hard_no'");
    expect(deckSource).toContain("readiness: 'not_now'");
    expect(deckSource).toContain("readiness: 'curious'");
    expect(deckSource).toContain("readiness: 'yes'");
    expect(deckSource).toContain('setReadiness');
  });

  it('plays a sound effect when a visible vote choice is pressed', () => {
    expect(deckSource).toContain(
      "import { playGameSound } from '../../lib/gameSounds';"
    );
    expect(deckSource).toContain("playGameSound('cardFlip')");
  });
});
