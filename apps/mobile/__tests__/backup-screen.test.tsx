import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import BackupSettingsScreen from '../app/(settings)/backup';

const mockSetString = jest.fn();
const mockGetString = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('expo-clipboard', () => ({
  setStringAsync: (...args: unknown[]) => mockSetString(...args),
  getStringAsync: () => mockGetString(),
}));

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

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('backup screen', () => {
  it('renders both create and restore sections', () => {
    const screen = render(<BackupSettingsScreen />);

    expect(screen.getByLabelText('Create backup')).toBeTruthy();
    expect(screen.getByLabelText('Recovery phrase')).toBeTruthy();
    expect(screen.getByLabelText('Restore backup')).toBeTruthy();
  });

  it('shows the recovery phrase only after a backup is created', async () => {
    const screen = render(<BackupSettingsScreen />);

    expect(screen.queryByLabelText('Copy recovery phrase')).toBeNull();

    fireEvent.press(screen.getByLabelText('Create backup'));

    await waitFor(
      () => {
        expect(screen.getByLabelText('Copy recovery phrase')).toBeTruthy();
      },
      { timeout: 15000 }
    );
  }, 30000);

  it('keeps restore disabled until both fields have content', () => {
    const screen = render(<BackupSettingsScreen />);
    const button = screen.getByLabelText('Restore backup');

    expect(button.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Recovery phrase'), 'anchor');
    expect(button.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Encrypted backup'), '{}');
    expect(button.props.accessibilityState?.disabled).toBe(false);
  });

  it('pastes the clipboard into the backup field', async () => {
    mockGetString.mockResolvedValue('{"format":"spicesync-backup-v1"}');
    const screen = render(<BackupSettingsScreen />);

    fireEvent.press(screen.getByLabelText('Paste backup'));

    await waitFor(() => {
      expect(screen.getByLabelText('Encrypted backup').props.value).toBe(
        '{"format":"spicesync-backup-v1"}'
      );
    });
  });

  it('surfaces a readable error for a bad phrase without throwing', async () => {
    const screen = render(<BackupSettingsScreen />);

    fireEvent.changeText(
      screen.getByLabelText('Recovery phrase'),
      'zzzznotaword'
    );
    fireEvent.changeText(screen.getByLabelText('Encrypted backup'), '{}');
    fireEvent.press(screen.getByLabelText('Restore backup'));

    await waitFor(() => {
      expect(
        screen.getByText(/recovery phrase has this many words/i)
      ).toBeTruthy();
    });
  });
});
