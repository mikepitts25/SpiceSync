jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

import { fireEvent, render } from '@testing-library/react-native';
import { Modal } from 'react-native';

import { useScreenToursStore } from '../src/stores/screenTours';
import { getVisibleTourStep } from '../components/ScreenTour';
import { ScreenTour } from '../components/ScreenTour';

describe('ScreenTour', () => {
  const steps = [
    { title: 'First step', body: 'First body' },
    { title: 'Second step', body: 'Second body' },
  ];

  beforeEach(() => {
    useScreenToursStore.setState({
      dismissedTourScreens: {},
    });
  });

  it('returns the first visible step with progress and Next label', () => {
    expect(getVisibleTourStep(steps, 0)).toEqual({
      step: steps[0],
      index: 0,
      progressLabel: '1 of 2',
      primaryLabel: 'Next',
      isLastStep: false,
    });
  });

  it('returns Done for the final visible step', () => {
    expect(getVisibleTourStep(steps, 1)).toEqual({
      step: steps[1],
      index: 1,
      progressLabel: '2 of 2',
      primaryLabel: 'Done',
      isLastStep: true,
    });
  });

  it('clamps an out-of-range requested step to the final step', () => {
    expect(getVisibleTourStep(steps, 99)?.index).toBe(1);
  });

  it('ignores blank tour steps', () => {
    expect(
      getVisibleTourStep(
        [
          { title: 'Valid step', body: 'Valid body' },
          { title: '', body: 'Ignored body' },
        ],
        1
      )
    ).toEqual({
      step: { title: 'Valid step', body: 'Valid body' },
      index: 0,
      progressLabel: '1 of 1',
      primaryLabel: 'Done',
      isLastStep: true,
    });
  });

  it('returns null when no visible tour steps remain', () => {
    expect(getVisibleTourStep([], 0)).toBeNull();
  });

  it('renders as a visible overlay modal when the screen tour is active', () => {
    const rendered = render(
      <ScreenTour screenId="deck" screenLabel="Deck" steps={steps} />
    );

    expect(rendered.UNSAFE_getByType(Modal).props.visible).toBe(true);
  });

  it('permanently dismisses the current screen tour from the close button', () => {
    const rendered = render(
      <ScreenTour screenId="deck" screenLabel="Deck" steps={steps} />
    );

    fireEvent.press(rendered.getByLabelText('Close Deck tour'));

    expect(useScreenToursStore.getState().isTourDismissed('deck')).toBe(true);
    expect(useScreenToursStore.getState().isTourDismissed('matches')).toBe(
      false
    );
  });
});
