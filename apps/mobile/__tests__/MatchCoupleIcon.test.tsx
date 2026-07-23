import { render } from '@testing-library/react-native';

import MatchCoupleIcon from '../components/MatchCoupleIcon';

describe('MatchCoupleIcon', () => {
  it('renders bundled couple artwork with an accessible label', () => {
    const rendered = render(
      <MatchCoupleIcon
        size={40}
        accessibilityLabel="SpiceSync couple match"
        testID="match-couple-icon"
      />
    );

    expect(rendered.getByTestId('match-couple-icon')).toBeTruthy();
    expect(rendered.getByLabelText('SpiceSync couple match')).toBeTruthy();
  });
});
