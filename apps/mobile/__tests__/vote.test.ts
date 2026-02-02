import { useVotesStore } from '../src/stores/votes';

test('vote persistence (by profile)', () => {
  const profileId = 'test-profile';
  const kinkId = 'sys-001';

  useVotesStore.getState().clearProfile(profileId);
  useVotesStore.getState().setVote(profileId, kinkId, 'yes');

  expect(useVotesStore.getState().getVote(profileId, kinkId)).toBe('yes');
});