(function attachKinkFilterUtils(root, factory) {
  const utils = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = utils;
    return;
  }

  root.kinkFilterUtils = utils;
})(typeof window !== 'undefined' ? window : globalThis, function createUtils() {
  function isPairedKink(kink) {
    return Boolean(
      kink &&
        kink.pairKey &&
        (kink.pairRole === 'give' || kink.pairRole === 'receive')
    );
  }

  function matchesPairFilter(kink, filter) {
    if (!filter) return true;
    if (filter === 'paired') return isPairedKink(kink);
    if (filter === 'unpaired') return !isPairedKink(kink);
    return isPairedKink(kink) && kink.pairRole === filter;
  }

  function getPairFilterLabel(kink) {
    if (!isPairedKink(kink)) return '';
    return `${kink.pairKey}: ${kink.pairRole}`;
  }

  return {
    getPairFilterLabel,
    isPairedKink,
    matchesPairFilter,
  };
});
