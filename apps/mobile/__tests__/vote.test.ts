import { useVotes } from '../lib/state/useStore';

test('vote persistence', () => {
  const { setVote } = useVotes.getState();
  setVote('profile-001', 'sys-001', 'yes');
  expect(useVotes.getState().votesByProfile['profile-001']?.['sys-001']).toBe(
    'yes'
  );
});
