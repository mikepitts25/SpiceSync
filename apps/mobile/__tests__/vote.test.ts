import { useVotes } from '../lib/state/useStore';

beforeEach(() => {
  useVotes.setState({ votesByProfile: {} });
});

describe('vote persistence', () => {
  it('stores plain votes for unpaired cards', () => {
    const { setVote } = useVotes.getState();
    setVote('profile-001', 'sys-001', 'yes');
    expect(useVotes.getState().votesByProfile['profile-001']?.['sys-001']).toBe(
      'yes'
    );
    expect(useVotes.getState().getVote('profile-001', 'sys-001')).toBe('yes');
  });

  it('stores paired preference on paired cards', () => {
    const { setVote } = useVotes.getState();
    setVote('profile-001', 'pair:oral-pleasure', 'yes', 'give');

    expect(
      useVotes.getState().votesByProfile['profile-001']?.['pair:oral-pleasure']
    ).toEqual({ value: 'yes', pairPreference: 'give' });
    expect(
      useVotes.getState().getVote('profile-001', 'pair:oral-pleasure')
    ).toBe('yes');
    expect(
      useVotes.getState().getVoteRecord('profile-001', 'pair:oral-pleasure')
    ).toEqual({ value: 'yes', pairPreference: 'give' });
  });
});
