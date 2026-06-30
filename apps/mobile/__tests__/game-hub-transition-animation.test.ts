import fs from 'fs';
import path from 'path';

const appRoot = path.resolve(__dirname, '..');
const gameHubPath = path.join(appRoot, 'app/(game)/index.tsx');

function readGameHubSource() {
  return fs.readFileSync(gameHubPath, 'utf8');
}

describe('game hub transition animation', () => {
  it('crossfades between the intro and active game scenes without changing routes', () => {
    const source = readGameHubSource();

    expect(source).toMatch(/Animated\.Value\(0\)/);
    expect(source).toMatch(/Animated\.timing\(gameTransitionProgress/);
    expect(source).toMatch(/setVisibleGameScene\('game'\)/);
    expect(source).toMatch(/setVisibleGameScene\('intro'\)/);
    expect(source).toMatch(/useNativeDriver:\s*true/);
  });
});
