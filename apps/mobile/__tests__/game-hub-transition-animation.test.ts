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

  it('integrates turn context inside the active game card', () => {
    const source = readGameHubSource();

    expect(source).toContain('styles.activeGameHeader');
    expect(source).toContain('styles.activeGameTitleRow');
    expect(source).toContain('styles.endGameButton');
    expect(source).toContain('styles.cardTurnPanel');
    expect(source).toContain('styles.cardTurnRoute');
    expect(source).toContain('styles.cardTurnArrow');
    expect(source).toContain('styles.statusPill');
    expect(source).toContain('styles.cardConsequenceAlert');
    expect(source).toContain('buildGameConsequence');
    expect(source).toContain('buildGameShareMessage');
    expect(source).toContain('savePersistedGameSession');
    expect(source).toContain('loadPersistedGameSession');
    expect(source).toContain('clearPersistedGameSession');
    expect(source).toContain('Alert.alert');
    expect(source).toContain('confirmEndGame');
    expect(source).toContain('customDeckMode');
    expect(source).toContain('Custom Only');
    expect(source).toContain('currentTurn.player');
    expect(source).toContain('currentTurn.target');
    expect(source).toContain('→');
    expect(source).toContain('Pass / Risk');
    expect(source).toContain('lastConsequence');
    expect(source).not.toContain('styles.turnStrip');
    expect(source).not.toContain('styles.activeGameControlsRow');
    expect(source).not.toContain('renderModeSelector(true)');
    expect(source).not.toContain('styles.activeGameNoticePill');
    expect(source).not.toContain('styles.cardTopRow');
    expect(source).not.toContain('styles.categoryLabel');
    expect(source).not.toContain('IntensityDots');
    expect(source).not.toContain('turnTargetLabel}>For');
    expect(source).not.toContain('turnDrinkMode');
  });
});
