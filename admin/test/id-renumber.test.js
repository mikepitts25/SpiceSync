const test = require("node:test");
const assert = require("node:assert/strict");

const { renumberContentIds } = require("../lib/id-renumber");

test("renumberContentIds compacts game card numeric suffixes within each prefix", () => {
  const cards = renumberContentIds("gamecards", [
    { id: "f-t1", type: "truth" },
    { id: "f-t3", type: "truth" },
    { id: "f-d2", type: "dare" },
    { id: "f-d5", type: "dare" },
    { id: "p-admin-truth-004", type: "truth" },
  ]);

  assert.deepEqual(
    cards.map((card) => card.id),
    ["f-t1", "f-t2", "f-d1", "f-d2", "p-admin-truth-001"],
  );
});

test("renumberContentIds compacts kink ids as four-digit sequential ids", () => {
  const kinks = renumberContentIds("kinks", [
    { id: "0001", slug: "a" },
    { id: "0052", slug: "b" },
    { id: "0104", slug: "c" },
  ]);

  assert.deepEqual(
    kinks.map((kink) => kink.id),
    ["0001", "0002", "0003"],
  );
});

test("renumberContentIds compacts conversation ids within each prefix", () => {
  const starters = renumberContentIds("conversation-starters", [
    { id: "conv-date-001" },
    { id: "conv-date-004" },
    { id: "conv-spicy-009" },
  ]);

  assert.deepEqual(
    starters.map((starter) => starter.id),
    ["conv-date-001", "conv-date-002", "conv-spicy-001"],
  );
});
