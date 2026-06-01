import { es } from '../lib/i18n/es';

describe('Spanish app UI translations', () => {
  it('covers core chrome and screen copy beyond card content', () => {
    expect(es.tabs.profiles).toBe('Perfiles');
    expect(es.tabs.deck).toBe('Cartas');

    expect(es.welcome.brandTagline).toBe('Descubran lo que ambos quieren');
    expect(es.settings.partnerCode).toBe('Sync de pareja');
    expect(es.deck.caughtUpTitle).toBe('Ya estás al día');
    expect(es.matches.shareResults).toBe('Compartir resultados');
    expect(es.game.gameNight).toBe('Noche de juego');
    expect(es.tours.deck[0].title).toBe('Elige una intensidad');
  });
});
