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

  it('collects player setup and drinking mode before starting the inline game', () => {
    const source = readGameHubSource();

    expect(source).toContain('normalizeGamePlayers');
    expect(source).toContain('normalizeGamePlayerCount');
    expect(source).toContain('setDrinkingMode');
    expect(source).toContain('Number of Players');
    expect(source).toContain('Drinking game');
    expect(source).toContain('Player 4 name');
  });

  it('shows the current player, target, and drink consequence during play', () => {
    const source = readGameHubSource();

    expect(source).toContain('currentTurn.player');
    expect(source).toContain('currentTurn.target');
    expect(source).toContain('For');
    expect(source).toContain('Pass / Drink');
    expect(source).toContain('buildDrinkConsequence');
    expect(source).toContain('lastDrinkConsequence');
  });
});
