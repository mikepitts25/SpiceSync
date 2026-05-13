import {
  useScreenToursStore,
  type ScreenToursState,
} from '../src/stores/screenTours';

const initialState = useScreenToursStore.getState();

function resetStore() {
  useScreenToursStore.setState({
    dismissedTourScreens: {},
    isTourDismissed: initialState.isTourDismissed,
    dismissTour: initialState.dismissTour,
    resetTour: initialState.resetTour,
    resetAllTours: initialState.resetAllTours,
  } satisfies ScreenToursState);
}

describe('screen tour store', () => {
  beforeEach(() => {
    resetStore();
  });

  it('dismisses only the requested screen', () => {
    useScreenToursStore.getState().dismissTour('profiles');

    expect(useScreenToursStore.getState().isTourDismissed('profiles')).toBe(
      true
    );
    expect(useScreenToursStore.getState().isTourDismissed('deck')).toBe(false);
  });

  it('resetTour restores only one screen', () => {
    useScreenToursStore.getState().dismissTour('profiles');
    useScreenToursStore.getState().dismissTour('deck');
    useScreenToursStore.getState().resetTour('profiles');

    expect(useScreenToursStore.getState().isTourDismissed('profiles')).toBe(
      false
    );
    expect(useScreenToursStore.getState().isTourDismissed('deck')).toBe(true);
  });

  it('resetAllTours clears every dismissed screen', () => {
    useScreenToursStore.getState().dismissTour('profiles');
    useScreenToursStore.getState().dismissTour('deck');
    useScreenToursStore.getState().resetAllTours();

    expect(useScreenToursStore.getState().isTourDismissed('profiles')).toBe(
      false
    );
    expect(useScreenToursStore.getState().isTourDismissed('deck')).toBe(false);
  });
});
