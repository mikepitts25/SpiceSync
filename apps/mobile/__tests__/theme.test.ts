import {
  COLORS,
  GRADIENTS,
  RADII,
  SIZES,
  TYPOGRAPHY,
} from '../constants/theme';

describe('Scarlet Pulse theme contract', () => {
  it('exposes the required redesign color tokens', () => {
    expect(COLORS.bg).toBe('#0D0006');
    expect(COLORS.card).toBe('#120008');
    expect(COLORS.pink).toBe('#FF2D92');
    expect(COLORS.border).toBe('rgba(194,24,91,0.33)');
    expect(COLORS.textSub).toBe('rgba(255,255,255,0.72)');
  });

  it('exposes the required gradients and card radius', () => {
    expect(GRADIENTS.primary).toEqual(['#C2185B', '#FF2D92']);
    expect(GRADIENTS.cardAccentBar).toEqual(['#C2185B', '#FF2D92', '#FF4500']);
    expect(RADII.card).toBe(24);
  });

  it('keeps normal text readable at the shared theme level', () => {
    expect(TYPOGRAPHY.body.fontSize).toBe(16);
    expect(TYPOGRAPHY.body.lineHeight).toBe(23);
    expect(SIZES.body).toBe(16);
    expect(SIZES.small).toBe(16);
    expect(SIZES.caption).toBe(16);
  });
});
