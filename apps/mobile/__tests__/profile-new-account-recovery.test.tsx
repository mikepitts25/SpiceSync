import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { useProfilesStore } from '../lib/state/profiles';
import { useSettingsStore } from '../src/stores/settingsStore';

const mockRouter = { back: jest.fn(), replace: jest.fn() };
const mockSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockSearchParams(),
  useRouter: () => mockRouter,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../components/EmojiMenu', () => () => null);
jest.mock('../components/ProfileAvatarIcon', () => () => null);
jest.mock('../components/app-chrome', () => ({
  BackHeader: () => null,
  CardAccentTop: () => null,
  SpiceSyncLogo: () => null,
}));

const NewProfileScreen = require('../app/(settings)/profiles/new')
  .default as typeof import('../app/(settings)/profiles/new').default;

describe('account-recovery profile creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.mockReturnValue({ from: 'account-recovery' });
    useSettingsStore.setState({ language: 'en' });
    useProfilesStore.setState({
      profiles: [],
      activeProfileId: null,
      currentUserId: null,
      hydrated: true,
    });
  });

  it('returns a newly submitted recovery profile to confirmation', async () => {
    const screen = render(<NewProfileScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter name'), 'Alex');
    fireEvent.press(screen.getByText('Create Profile'));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/confirm-profile')
    );
    expect(useProfilesStore.getState().getProfiles()).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Alex' })])
    );
  });
});
