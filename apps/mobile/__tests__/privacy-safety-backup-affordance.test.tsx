import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import PrivacySafetyScreen from '../app/(settings)/privacy-safety';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockResetAppOnDevice = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: React.PropsWithChildren) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: React.PropsWithChildren) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../lib/safety/localDataControls', () => ({
  clearActiveProfileVotes: jest.fn(() => true),
  disconnectRemotePartnerLocal: jest.fn(),
  resetAppOnDevice: () => mockResetAppOnDevice(),
}));

type AlertButton = { text?: string; onPress?: () => void };

function lastAlert(): { title: string; body: string; buttons: AlertButton[] } {
  const spy = Alert.alert as jest.Mock;
  const call = spy.mock.calls[spy.mock.calls.length - 1];
  return { title: call[0], body: call[1], buttons: call[2] ?? [] };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('privacy & safety backup affordance', () => {
  it('links to the backup screen from data controls', () => {
    const screen = render(<PrivacySafetyScreen />);

    fireEvent.press(screen.getByText('Encrypted backup'));

    expect(mockPush).toHaveBeenCalledWith('/(settings)/backup');
  });

  it('offers a back-up detour before resetting the device', () => {
    const screen = render(<PrivacySafetyScreen />);

    fireEvent.press(screen.getByText('Reset app on this device'));

    const { body, buttons } = lastAlert();
    // The warning must no longer claim a reset is simply unrecoverable.
    expect(body).toMatch(/encrypted backup/i);

    const backUp = buttons.find((button) => button.text === 'Back up first');
    expect(backUp).toBeDefined();
    backUp?.onPress?.();
    expect(mockPush).toHaveBeenCalledWith('/(settings)/backup');
    // Taking the detour must not reset anything.
    expect(mockResetAppOnDevice).not.toHaveBeenCalled();
  });

  it('still resets when the destructive action is confirmed', async () => {
    const screen = render(<PrivacySafetyScreen />);

    fireEvent.press(screen.getByText('Reset app on this device'));
    const reset = lastAlert().buttons.find(
      (button) => button.text === 'Reset device'
    );
    // The handler is async and flips `resetting`; await it so the state
    // update settles inside act().
    await act(async () => {
      await reset?.onPress?.();
    });

    expect(mockResetAppOnDevice).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/welcome');
  });
});
