const { by, device, element, waitFor } = require('detox');
const { expect: expectValue } = require('@jest/globals');

function frameFrom(attributes) {
  if (!attributes || Array.isArray(attributes) || !attributes.frame) {
    throw new Error('Expected one visible native element with a frame.');
  }
  return attributes.frame;
}

describe('Spice Deck maximum-content layout', () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
    });
    await device.openURL({
      url: 'spicesync:///spice-deck-layout-harness',
    });
  });

  it('keeps the Spanish four-player CTA inside the stage and above the tab bar', async () => {
    await waitFor(element(by.id('game-layout-stage')))
      .toBeVisible()
      .withTimeout(15000);
    await expect(element(by.id('game-setup-start-action'))).toBeVisible(100);
    await expect(element(by.id('game-setup-deck-mix'))).toExist();
    await expect(element(by.id('game-setup-player-index-4'))).toBeVisible(100);

    const stage = frameFrom(
      await element(by.id('game-layout-stage')).getAttributes()
    );
    const cta = frameFrom(
      await element(by.id('game-setup-start-action')).getAttributes()
    );
    const deckMix = frameFrom(
      await element(by.id('game-setup-deck-mix')).getAttributes()
    );
    const tabBar = frameFrom(
      await element(by.id('game-layout-tab-bar')).getAttributes()
    );

    const ctaBottom = cta.y + cta.height;
    const stageBottom = stage.y + stage.height;

    process.stdout.write(
      `Measured layout: stage=${JSON.stringify(stage)} ` +
        `deckMix=${JSON.stringify(deckMix)} cta=${JSON.stringify(cta)} ` +
        `tabBar=${JSON.stringify(tabBar)}\n`
    );

    expectValue(cta.height).toBeGreaterThanOrEqual(44);
    expectValue(cta.width).toBeGreaterThanOrEqual(190);
    expectValue(deckMix.y + deckMix.height).toBeLessThanOrEqual(stageBottom);
    expectValue(ctaBottom).toBeLessThanOrEqual(stageBottom);
    expectValue(ctaBottom).toBeLessThanOrEqual(tabBar.y);
  });

  it('keeps the Spanish four-player CTA reachable at an accessibility text size', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      launchArgs: {
        UIPreferredContentSizeCategoryName:
          'UICTContentSizeCategoryAccessibilityXL',
      },
    });
    await device.openURL({
      url: 'spicesync:///spice-deck-layout-harness',
    });

    await waitFor(element(by.id('game-setup-overflow-scroll')))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.id('game-setup-overflow-scroll')).scrollTo('bottom');
    await expect(element(by.id('game-setup-start-action'))).toBeVisible(100);
  });
});
