import { useCoupleDiceStore } from '../lib/state/coupleDice';
import { rollDice } from '../lib/coupleDice';

beforeEach(() => {
  useCoupleDiceStore.setState({ savedByProfileId: {} });
});

describe('couple dice store', () => {
  it('partitions saved rolls by profile id', () => {
    const store = useCoupleDiceStore.getState();
    const roll = rollDice({ random: () => 0.2 });

    store.saveRoll('profile-1', roll, 1000);

    expect(useCoupleDiceStore.getState().getSaved('profile-1')).toHaveLength(1);
    expect(useCoupleDiceStore.getState().getSaved('profile-2')).toHaveLength(0);
  });

  it('adds newest saved rolls first', () => {
    const store = useCoupleDiceStore.getState();
    const rollA = rollDice({ random: () => 0.1 });
    const rollB = rollDice({ random: () => 0.8 });

    store.saveRoll('profile-1', rollA, 1000);
    store.saveRoll('profile-1', rollB, 2000);

    const saved = useCoupleDiceStore.getState().getSaved('profile-1');
    expect(saved[0].savedAt).toBe(2000);
    expect(saved[1].savedAt).toBe(1000);
  });

  it('supports deleting a saved roll by id', () => {
    const store = useCoupleDiceStore.getState();
    const roll = rollDice({ random: () => 0.3 });
    store.saveRoll('profile-1', roll, 1000);

    const [saved] = useCoupleDiceStore.getState().getSaved('profile-1');
    useCoupleDiceStore.getState().deleteSaved('profile-1', saved.id);

    expect(useCoupleDiceStore.getState().getSaved('profile-1')).toHaveLength(0);
  });

  it('deleting from one profile does not affect another', () => {
    const store = useCoupleDiceStore.getState();
    const roll = rollDice({ random: () => 0.5 });
    store.saveRoll('profile-1', roll, 1000);
    store.saveRoll('profile-2', roll, 1000);

    const [savedA] = useCoupleDiceStore.getState().getSaved('profile-1');
    useCoupleDiceStore.getState().deleteSaved('profile-1', savedA.id);

    expect(useCoupleDiceStore.getState().getSaved('profile-1')).toHaveLength(0);
    expect(useCoupleDiceStore.getState().getSaved('profile-2')).toHaveLength(1);
  });
});
