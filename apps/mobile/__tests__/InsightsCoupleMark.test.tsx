import { render } from '@testing-library/react-native';

import InsightsCoupleMark from '../components/InsightsCoupleMark';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('lucide-react-native', () => ({ Heart: 'Heart' }));

describe('InsightsCoupleMark', () => {
  it('shows the real avatar pair for an active link', () => {
    const rendered = render(
      <InsightsCoupleMark linked activeAvatar="flame" partnerAvatar="rose" />
    );

    expect(rendered.getByTestId('insights-couple-pair')).toBeTruthy();
    expect(rendered.queryByTestId('insights-couple-artwork')).toBeNull();
  });

  it('shows generic artwork when no partner is linked', () => {
    const rendered = render(
      <InsightsCoupleMark
        linked={false}
        activeAvatar="flame"
        partnerAvatar={null}
      />
    );

    expect(rendered.getByTestId('insights-couple-artwork')).toBeTruthy();
    expect(rendered.queryByTestId('insights-couple-pair')).toBeNull();
  });
});
