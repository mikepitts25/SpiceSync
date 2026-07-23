import { render } from '@testing-library/react-native';

import CoupleAvatarPair from '../components/CoupleAvatarPair';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('lucide-react-native', () => ({ Heart: 'Heart' }));

describe('CoupleAvatarPair', () => {
  it('renders both profile avatars with one heart badge', () => {
    const rendered = render(
      <CoupleAvatarPair
        firstAvatar="flame"
        secondAvatar="rose"
        size={64}
        testID="active-couple"
      />
    );

    expect(rendered.getByTestId('active-couple-first-avatar')).toBeTruthy();
    expect(rendered.getByTestId('active-couple-second-avatar')).toBeTruthy();
    expect(rendered.getByTestId('active-couple-heart')).toBeTruthy();
  });
});
