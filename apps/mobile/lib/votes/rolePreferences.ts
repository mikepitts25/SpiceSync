export type VoteValue = 'yes' | 'maybe' | 'no';
export type PairPreference = 'give' | 'receive' | 'both';

// Optional refinement of a vote. Every readiness projects onto a legacy
// VoteValue (see READINESS_TO_VOTE) so share codes, partner sync, and older
// screens keep working with records written by newer builds.
export type Readiness = 'yes' | 'curious' | 'not_now' | 'hard_no';

export type KinkVote =
  | VoteValue
  | {
      value: VoteValue;
      pairPreference?: PairPreference;
      readiness?: Readiness;
    };

export type NormalizedKinkVote = {
  value: VoteValue;
  pairPreference?: PairPreference;
  readiness?: Readiness;
};

export const DEFAULT_PAIR_PREFERENCE: PairPreference = 'both';

export const READINESS_TO_VOTE: Record<Readiness, VoteValue> = {
  yes: 'yes',
  curious: 'maybe',
  not_now: 'no',
  hard_no: 'no',
};

const VALID_VOTES = new Set(['yes', 'maybe', 'no']);
const VALID_PAIR_PREFERENCES = new Set(['give', 'receive', 'both']);
const VALID_READINESS = new Set(['yes', 'curious', 'not_now', 'hard_no']);

export function isVoteValue(value: unknown): value is VoteValue {
  return typeof value === 'string' && VALID_VOTES.has(value);
}

export function isPairPreference(value: unknown): value is PairPreference {
  return typeof value === 'string' && VALID_PAIR_PREFERENCES.has(value);
}

export function isReadiness(value: unknown): value is Readiness {
  return typeof value === 'string' && VALID_READINESS.has(value);
}

export function readinessToVote(readiness: Readiness): VoteValue {
  return READINESS_TO_VOTE[readiness];
}

// Legacy votes without an explicit readiness map conservatively: a plain 'no'
// stays undefined (private) rather than becoming 'not_now', so nothing a
// partner declined under the old model is ever surfaced as discussable.
export function voteToReadiness(value: VoteValue): Readiness | undefined {
  if (value === 'yes') return 'yes';
  if (value === 'maybe') return 'curious';
  return undefined;
}

export function effectiveReadiness(
  vote: KinkVote | undefined
): Readiness | undefined {
  const record = normalizeVoteRecord(vote);
  if (!record) return undefined;
  return record.readiness ?? voteToReadiness(record.value);
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

  const record = vote as {
    value?: unknown;
    pairPreference?: unknown;
    readiness?: unknown;
  };
  if (!isVoteValue(record.value)) {
    return undefined;
  }

  // A readiness that disagrees with its own vote projection is corrupt data
  // (e.g. a mangled sync payload); dropping it can only under-reveal.
  const readiness =
    isReadiness(record.readiness) &&
    READINESS_TO_VOTE[record.readiness] === record.value
      ? record.readiness
      : undefined;

  return {
    value: record.value,
    pairPreference: isPairPreference(record.pairPreference)
      ? record.pairPreference
      : undefined,
    readiness,
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
  pairPreference?: PairPreference,
  readiness?: Readiness
): KinkVote {
  const safeReadiness =
    readiness && READINESS_TO_VOTE[readiness] === value ? readiness : undefined;
  return pairPreference || safeReadiness
    ? { value, pairPreference, readiness: safeReadiness }
    : value;
}

export function makeReadinessRecord(
  readiness: Readiness,
  pairPreference?: PairPreference
): KinkVote {
  return makeVoteRecord(readinessToVote(readiness), pairPreference, readiness);
}

export function sameVoteRecord(
  a: KinkVote | undefined,
  b: KinkVote | undefined
): boolean {
  const left = normalizeVoteRecord(a);
  const right = normalizeVoteRecord(b);
  return (
    left?.value === right?.value &&
    left?.pairPreference === right?.pairPreference &&
    left?.readiness === right?.readiness
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
