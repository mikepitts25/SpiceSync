import { es } from '../lib/i18n/es';
import { conversationTranslations } from '../lib/i18n/conversation';
import { ui } from '../lib/i18n/uiLiteral';
import { useSettingsStore } from '../src/stores/settingsStore';

describe('Spanish app UI translations', () => {
  it('covers core chrome and screen copy beyond card content', () => {
    expect(es.tabs.profiles).toBe('Perfiles');
    expect(es.tabs.deck).toBe('Cartas');

    expect(es.welcome.brandTagline).toBe('Descubran lo que ambos quieren');
    expect(es.settings.partnerCode).toBe('Sincronización de pareja');
    expect(es.deck.caughtUpTitle).toBe('Ya estás al día');
    expect(es.matches.shareResults).toBe('Compartir resultados');
    expect(es.game.gameNight).toBe('Noche de juego');
    expect(es.tours.deck[0].title).toBe('Elige una intensidad');
  });

  it('uses natural Spanish for a private no vote', () => {
    expect(es.deck.hardNo).toBe('No');
    expect(es.matches.hiddenBlurb).toBe(
      'Los límites quedan ocultos para ambos'
    );
    expect(es.matches.hiddenInfo).toBe(
      'Cualquier opción que uno de los dos marque como «No» se mantendrá privada. Nunca aparecerá entre las coincidencias.'
    );
  });

  it('uses natural grammar in high-traffic Spanish UI copy', () => {
    expect(es.deck.swipeHint).toBe(
      'Desliza a la derecha para Sí y a la izquierda para No'
    );
    expect(es.deck.endOfDeckDesc).toBe(
      'Has votado por todo lo de esta categoría.'
    );
    expect(es.matches.bucketReadyBlurb).toBe(
      'Un sí claro por ambas partes, con roles compatibles'
    );
    expect(es.matches.bucketTalkBlurb).toBe(
      'Primero hay que hablar del momento, los roles o la preparación'
    );
    expect(es.loveLanguages.timeDesc).toBe(
      'Te sientes querido cuando tu pareja te presta toda su atención y pasa tiempo de calidad contigo.'
    );
    expect(es.kinks.header).toBe('¿De qué humor estás hoy?');
    expect(es.matchMissions.subtitle).toBe(
      'Pequeñas misiones opcionales basadas en sus coincidencias.'
    );
    expect(es.knowMeBetter.summaryClosing).toBe(
      'Con cada ronda, coincidan o no, se conocen un poco mejor.'
    );
    expect(conversationTranslations.es.dateNightDesc).toBe(
      'Preguntas coquetas, situaciones hipotéticas y debates divertidos'
    );
    expect(conversationTranslations.es.spicyDesc).toBe(
      'Deseos, fantasías y formas de explorar juntos'
    );
  });

  it('uses the concise No label in dynamically localized UI', () => {
    useSettingsStore.setState({ language: 'es' });
    expect(ui('HARD NO')).toBe('NO');
    expect(ui('Complete the quiz or revisit your current result.')).toBe(
      'Completa el cuestionario o revisa tu resultado actual.'
    );
    useSettingsStore.setState({ language: 'en' });
  });
});
