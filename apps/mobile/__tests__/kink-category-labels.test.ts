import * as categoryLabels from '../lib/i18n/kinkCategories';

describe('kink category labels', () => {
  it.each([
    ['aftercare', 'Cuidados posteriores'],
    ['communication', 'Comunicación'],
    ['environment', 'Entorno'],
    ['group', 'Juego en grupo'],
    ['light_restraint', 'Ataduras suaves'],
    ['paired_play', 'Juego en pareja'],
    ['props_and_toys', 'Accesorios y juguetes'],
    ['roleplay', 'Juego de roles'],
    ['sensory', 'Juego sensorial'],
  ])('translates %s into Spanish', (category, expected) => {
    const formatCategory = categoryLabels.formatKinkCategory;

    expect(formatCategory?.(category, 'es')).toBe(expected);
  });

  it('turns unknown category keys into readable labels', () => {
    const formatCategory = categoryLabels.formatKinkCategory;

    expect(formatCategory?.('new_category', 'es')).toBe('New category');
  });

  it('localizes the all-categories filter label', () => {
    const formatCategory = categoryLabels.formatKinkCategory;

    expect(formatCategory?.('all', 'es')).toBe('Todas las categorías');
  });
});
