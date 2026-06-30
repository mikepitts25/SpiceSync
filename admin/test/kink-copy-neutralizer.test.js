const test = require("node:test");
const assert = require("node:assert/strict");

const {
  hasRoleOrientedCopy,
  hasSpanishRoleOrientedCopy,
  neutralizeKinkDescription,
  neutralizeSpanishKinkDescription,
} = require("../lib/kink-copy-neutralizer");

test("neutralizeKinkDescription turns giver-focused copy into topic copy", () => {
  assert.equal(
    neutralizeKinkDescription(
      "Tease your partner lightly with touch, pauses, and playful restraint while watching their reactions.",
      "Light Teasing"
    ),
    "Light teasing with touch, pauses, and playful restraint."
  );
});

test("neutralizeKinkDescription removes reciprocal role wording", () => {
  assert.equal(
    neutralizeKinkDescription(
      "Spend time exploring each other's mouths slowly and deeply.",
      "Deep Kissing Session"
    ),
    "Slow, deep kissing."
  );

  assert.equal(
    neutralizeKinkDescription(
      "Giving or receiving oral pleasure.",
      "Oral Pleasure"
    ),
    "Oral pleasure."
  );
});

test("hasRoleOrientedCopy flags copy that conflicts with give/receive/both", () => {
  assert.equal(hasRoleOrientedCopy("Give your partner a sensual lap dance."), true);
  assert.equal(hasRoleOrientedCopy("A sensual lap dance."), false);
});

test("neutralizeSpanishKinkDescription turns role-directed copy into topic copy", () => {
  assert.equal(
    neutralizeSpanishKinkDescription(
      "Provoca suavemente a tu pareja con caricias, pausas y contención juguetona mientras observas sus reacciones.",
      "Provocación Ligera"
    ),
    "Provocación ligera con caricias, pausas y contención juguetona."
  );

  assert.equal(
    neutralizeSpanishKinkDescription("Dar o recibir placer oral.", "Placer Oral"),
    "Placer oral."
  );
});

test("hasSpanishRoleOrientedCopy flags Spanish copy that conflicts with give/receive/both", () => {
  assert.equal(
    hasSpanishRoleOrientedCopy("Da atención oral-anal a tu pareja."),
    true
  );
  assert.equal(hasSpanishRoleOrientedCopy("Atención oral-anal."), false);
});
