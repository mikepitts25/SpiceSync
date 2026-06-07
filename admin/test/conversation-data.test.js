const test = require("node:test");
const assert = require("node:assert/strict");

const { loadConversationStarters } = require("../lib/data-manager");

test("admin loads love languages conversation starters", () => {
  const starters = loadConversationStarters();
  const loveLanguages = starters.filter(
    (starter) => starter._source === "loveLanguages",
  );

  assert.ok(loveLanguages.length > 0);
  assert.ok(loveLanguages.every((starter) => starter._arrayName === "loveLanguagesStarters"));
});
