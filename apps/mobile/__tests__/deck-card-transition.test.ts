import fs from 'fs';
import path from 'path';

const appRoot = path.resolve(__dirname, '..');
const deckScreenPath = path.join(appRoot, 'app/(tabs)/deck.tsx');

function readDeckScreen() {
  return fs.readFileSync(deckScreenPath, 'utf8');
}

describe('deck card transitions', () => {
  it('crossfades the visible card during vote transitions', () => {
    const source = readDeckScreen();

    expect(source).toMatch(/SWIPE_FADE_OUT_MS\s*=\s*180/);
    expect(source).toMatch(/ACTIVE_CARD_FADE_IN_MS\s*=\s*220/);
    expect(source).toMatch(/cardOpacity\.value\s*\*\s*enterProgress\.value/);
    expect(source).toMatch(/cardOpacity\.value\s*=\s*withTiming\(\s*0/);
    expect(source).toMatch(/activeCardOpacity\.value\s*=\s*0;\s+setReadiness/);
    expect(source).toMatch(/useLayoutEffect\(\(\)\s*=>/);
    expect(source).toMatch(/activeCardOpacity\.value\s*=\s*withTiming\(\s*1/);
    expect(source).toMatch(/key=\{current\.id\}/);
    expect(source).not.toMatch(/nextKinkCard/);
  });
});
