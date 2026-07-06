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
    expect(source).toContain('resolveGameRoundOutcome');
    expect(source).toContain('styles.consequenceModalBackdrop');
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
    expect(source).not.toContain('buildGameShareMessage');
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

  it('keeps card draws hidden behind roulette and blocks on pass consequences', () => {
    const source = readGameHubSource();

    expect(source).toContain(
      "type GameRoundPhase = 'ready' | 'spinning' | 'revealed'"
    );
    expect(source).toContain('startRouletteDraw');
    expect(source).toContain('rouletteIntervalRef');
    expect(source).toContain('acknowledgeConsequence');
    expect(source).toContain('styles.consequenceModalBackdrop');
    expect(source).toContain('styles.cardBackPanel');
    expect(source).toContain('resolveGameRoundOutcome');
    expect(source).toContain('Player up');
    expect(source).toContain('Tap to Spin');
    expect(source).not.toContain('Share2');
    expect(source).not.toContain('handleShare');
    expect(source).not.toContain('buildGameShareMessage');
  });

  it('uses the hidden card itself as the draw control', () => {
    const source = readGameHubSource();

    expect(source).toContain(
      "readyPrompt: (player) => `${player}, tap the card to spin.`"
    );
    expect(source).toContain("tapDraw: 'Tap to Spin'");
    expect(source).toContain('styles.cardBackPress');
    expect(source).toContain('accessibilityLabel={cardCopy.tapDraw}');
    expect(source).toContain('onPress={startRouletteDraw}');
    expect(source).not.toContain('cardCopy.draw.toUpperCase()');
    expect(source).not.toContain(
      "roundPhase === 'ready' ? startRouletteDraw : undefined"
    );
  });

  it('offers an English and Spanish toggle on the game card text', () => {
    const source = readGameHubSource();

    expect(source).toContain('cardLanguage');
    expect(source).toContain('setCardLanguage');
    expect(source).toContain('getGameCardDisplayContent');
    expect(source).toContain('styles.cardLanguageToggle');
    expect(source).toContain('EN');
    expect(source).toContain('ES');
  });

  it('uses the card language toggle for game-state copy around hidden cards', () => {
    const source = readGameHubSource();

    expect(source).toContain('CARD_LANGUAGE_COPY');
    expect(source).toContain('cardCopy.playerUp');
    expect(source).toContain('cardCopy.mysteryCard');
    expect(source).toContain('cardCopy.tapDraw');
    expect(source).toContain('cardCopy.hiddenCardBody');
    expect(source).toContain('Jugador activo');
    expect(source).toContain('Objetivo');
    expect(source).toContain('Carta misteriosa');
    expect(source).toContain('Toca para girar');
    expect(source).toContain('La próxima carta se mantiene oculta');
    expect(source).toContain('Bebiendo');
    expect(source).toContain('Pasar / Riesgo');
  });

  it('translates generated pass consequences when Spanish card mode is active', () => {
    const source = readGameHubSource();

    expect(source).toContain('formatGameConsequenceText');
    expect(source).toContain('cardLanguage');
    expect(source).toContain('no puede pasar durante los próximos 2 turnos');
    expect(source).toContain('se quita una prenda');
    expect(source).toContain('toma un shot');
  });
});
