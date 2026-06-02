export type VoteValue = 'yes' | 'maybe' | 'no';
export type PairPreference = 'give' | 'receive' | 'both';

export type KinkVote =
  | VoteValue
  | {
      value: VoteValue;
      pairPreference?: PairPreference;
    };

export type NormalizedKinkVote = {
  value: VoteValue;
  pairPreference?: PairPreference;
};

export const DEFAULT_PAIR_PREFERENCE: PairPreference = 'both';

const VALID_VOTES = new Set(['yes', 'maybe', 'no']);
const VALID_PAIR_PREFERENCES = new Set(['give', 'receive', 'both']);

export function isVoteValue(value: unknown): value is VoteValue {
  return typeof value === 'string' && VALID_VOTES.has(value);
}

export function isPairPreference(value: unknown): value is PairPreference {
  return typeof value === 'string' && VALID_PAIR_PREFERENCES.has(value);
}

export function normalizeVoteRecord(
  vote: unknown
): NormalizedKinkVote | undefined {
  if (isVoteValue(vote)) {
    return { value: vote };
  }

  if (!vote || typeof vote !== 'object') {
    return undefined;
  }

  const record = vote as { value?: unknown; pairPreference?: unknown };
  if (!isVoteValue(record.value)) {
    return undefined;
  }

  return {
    value: record.value,
    pairPreference: isPairPreference(record.pairPreference)
      ? record.pairPreference
      : undefined,
  };
}

export function voteValue(vote: KinkVote | undefined): VoteValue | undefined {
  return normalizeVoteRecord(vote)?.value;
}

export function votePairPreference(
  vote: KinkVote | undefined
): PairPreference | undefined {
  return normalizeVoteRecord(vote)?.pairPreference;
}

export function makeVoteRecord(
  value: VoteValue,
  pairPreference?: PairPreference
): KinkVote {
  return pairPreference ? { value, pairPreference } : value;
}

export function sameVoteRecord(
  a: KinkVote | undefined,
  b: KinkVote | undefined
): boolean {
  const left = normalizeVoteRecord(a);
  const right = normalizeVoteRecord(b);
  return (
    left?.value === right?.value &&
    left?.pairPreference === right?.pairPreference
  );
}

export function preferencesCompatible(
  mine?: PairPreference,
  theirs?: PairPreference
): boolean {
  const myPreference = mine ?? DEFAULT_PAIR_PREFERENCE;
  const theirPreference = theirs ?? DEFAULT_PAIR_PREFERENCE;

  if (myPreference === 'both' || theirPreference === 'both') {
    return true;
  }

  return myPreference !== theirPreference;
}
