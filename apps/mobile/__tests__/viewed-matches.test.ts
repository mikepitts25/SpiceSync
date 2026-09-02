import {
  countUnseenReadyMatches,
  useViewedMatchesStore,
} from '../lib/match/viewedMatches';

describe('viewed matches store', () => {
  beforeEach(() => {
    useViewedMatchesStore.setState({
      viewedIds: {},
      seenReadyIdsByProfile: {},
    });
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

  it('acknowledges ready matches for only the active profile without marking their details viewed', () => {
    useViewedMatchesStore
      .getState()
      .acknowledgeReadyMatches('profile-a', ['massage', 'blindfolds']);

    expect(useViewedMatchesStore.getState()).toMatchObject({
      viewedIds: {},
      seenReadyIdsByProfile: {
        'profile-a': { massage: true, blindfolds: true },
      },
    });
  });

  it('counts only ready matches that have not been acknowledged for that profile', () => {
    expect(
      countUnseenReadyMatches(
        [{ id: 'massage' }, { id: 'blindfolds' }, { id: 'roleplay' }],
        { massage: true, roleplay: true }
      )
    ).toBe(1);
  });
});
