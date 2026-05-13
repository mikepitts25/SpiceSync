jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

import { getVisibleTourStep } from '../components/ScreenTour';

describe('ScreenTour', () => {
  const steps = [
    { title: 'First step', body: 'First body' },
    { title: 'Second step', body: 'Second body' },
  ];

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
});
