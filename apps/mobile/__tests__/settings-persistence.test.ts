let mockFinishWrite: (() => void) | undefined;

jest.mock('../lib/storage/mmkv', () => ({
  mmkvStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn(
      () =>
        new Promise<void>((resolve) => {
          mockFinishWrite = resolve;
        })
    ),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('settings persistence', () => {
  it('keeps the persistence waiter pending until the age-consent write finishes', async () => {
    const settings = require('../lib/state/useStore') as {
      useSettings: {
        getState: () => { setAgeConfirmed: (value: boolean) => void };
      };
      waitForSettingsPersistence?: () => Promise<void>;
    };

    expect(settings.waitForSettingsPersistence).toEqual(expect.any(Function));

    settings.useSettings.getState().setAgeConfirmed(true);
    let finished = false;
    const waiting = settings.waitForSettingsPersistence!().then(() => {
      finished = true;
    });
    await Promise.resolve();

    expect(finished).toBe(false);

    mockFinishWrite?.();
    await waiting;
    expect(finished).toBe(true);
  });
});
