const test = require("node:test");
const assert = require("node:assert/strict");

const {
  collapseLegacyPairedKinks,
  enableRoleModeForKinks,
  simplifyKinkDescription,
} = require("../lib/kink-role-mode");

function kink(patch = {}) {
  return {
    id: "0001",
    slug: "sensual-massage",
    title: "Sensual Massage",
    description:
      "Use a paddle for negotiated impact play, starting light and checking comfort after each change.",
    tags: ["impact", "give", "giving", "boundaries"],
    category: "paired_play",
    intensityScale: 2,
    tier: "naughty",
    ...patch,
  };
}

test("collapseLegacyPairedKinks turns give and receive source rows into one role selector topic", () => {
  const result = collapseLegacyPairedKinks([
    kink({
      id: "0100",
      slug: "spanking-give",
      title: "Spanking (Giving)",
      pairMode: true,
      pairKey: "spanking",
      pairRole: "give",
      tags: ["impact", "give", "giving"],
    }),
    kink({
      id: "0101",
      slug: "spanking-receive",
      title: "Spanking (Receiving)",
      pairMode: true,
      pairKey: "spanking",
      pairRole: "receive",
      tags: ["impact", "receive", "receiving"],
    }),
  ]);

  assert.equal(result.length, 1);
  assert.deepEqual(result[0], {
    id: "0100",
    slug: "spanking",
    title: "Spanking",
    description: "Use a paddle for impact play.",
    tags: ["impact"],
    category: "paired_play",
    intensityScale: 2,
    tier: "naughty",
    pairMode: true,
  });
});

test("enableRoleModeForKinks can turn the selector on for every topic", () => {
  const result = enableRoleModeForKinks([
    kink({ id: "0001", pairMode: false }),
    kink({ id: "0002", pairMode: undefined }),
  ]);

  assert.deepEqual(
    result.map((item) => item.pairMode),
    [true, true]
  );
});

test("simplifyKinkDescription removes repetitive safety padding", () => {
  assert.equal(
    simplifyKinkDescription(
      "Give pegging play with clear preparation, lube, pacing, and ongoing comfort checks.",
      "Pegging"
    ),
    "Give pegging play."
  );

  assert.equal(
    simplifyKinkDescription(
      "Receive light crop taps, using your safeword and feedback to keep the sensation in your comfort zone.",
      "Riding Crop"
    ),
    "Receive light crop taps."
  );
});
