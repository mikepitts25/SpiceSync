import { act } from '@testing-library/react-native';
import { useVotes } from '../lib/state/useStore';

test('vote persistence', () => {
  const { vote } = useVotes.getState() as any;
  act(() => vote('sys-001', 'yes'));
  expect(useVotes.getState().votesA['sys-001']).toBe('yes');
});
