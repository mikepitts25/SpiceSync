const assert = require('assert');

const {
  getPairFilterLabel,
  isPairedKink,
  matchesPairFilter,
} = require('../public/kinkFilters');

const pairedGive = {
  slug: 'spanking-give',
  pairKey: 'spanking',
  pairRole: 'give',
};
const pairedReceive = {
  slug: 'spanking-receive',
  pairKey: 'spanking',
  pairRole: 'receive',
};
const unpaired = {
  slug: 'strap-on-discussion',
};

assert.strictEqual(isPairedKink(pairedGive), true);
assert.strictEqual(isPairedKink(pairedReceive), true);
assert.strictEqual(isPairedKink(unpaired), false);

assert.strictEqual(matchesPairFilter(pairedGive, ''), true);
assert.strictEqual(matchesPairFilter(unpaired, ''), true);
assert.strictEqual(matchesPairFilter(pairedGive, 'paired'), true);
assert.strictEqual(matchesPairFilter(pairedReceive, 'paired'), true);
assert.strictEqual(matchesPairFilter(unpaired, 'paired'), false);
assert.strictEqual(matchesPairFilter(unpaired, 'unpaired'), true);
assert.strictEqual(matchesPairFilter(pairedGive, 'unpaired'), false);
assert.strictEqual(matchesPairFilter(pairedGive, 'give'), true);
assert.strictEqual(matchesPairFilter(pairedReceive, 'give'), false);
assert.strictEqual(matchesPairFilter(pairedReceive, 'receive'), true);
assert.strictEqual(matchesPairFilter(pairedGive, 'receive'), false);

assert.strictEqual(getPairFilterLabel(pairedGive), 'spanking: give');
assert.strictEqual(getPairFilterLabel(pairedReceive), 'spanking: receive');
assert.strictEqual(getPairFilterLabel(unpaired), '');
