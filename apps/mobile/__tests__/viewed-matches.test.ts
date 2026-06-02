import { useViewedMatchesStore } from '../lib/match/viewedMatches';

describe('viewed matches store', () => {
  beforeEach(() => {
    useViewedMatchesStore.setState({ viewedIds: {} });
  });

  it('marks match ids as viewed without duplicating state shape', () => {
    useViewedMatchesStore.getState().markViewed('pair:massage');
    useViewedMatchesStore.getState().markViewed('pair:massage');
    useViewedMatchesStore.getState().markViewed('blindfolds');

    expect(useViewedMatchesStore.getState().viewedIds).toEqual({
      'pair:massage': true,
      blindfolds: true,
    });
  });
});
