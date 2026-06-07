const test = require("node:test");
const assert = require("node:assert/strict");

const { loadGameCards } = require("../lib/data-manager");

test("admin loads current free game cards with editable mode metadata", () => {
  const cards = loadGameCards();
  const freeMainCards = cards.filter(
    (card) => card._source === "main" && card._arrayName === "FREE_CARDS",
  );
  const normalCards = freeMainCards.filter((card) => card._gameMode === "Normal");
  const intenseCards = freeMainCards.filter(
    (card) => card._gameMode === "Intense",
  );

  assert.equal(normalCards.length, 40);
  assert.equal(intenseCards.length, 40);
  assert.ok(cards.some((card) => card.id === "f-n-r4"));
  assert.ok(cards.some((card) => card.id === "f-i-r4"));
});
