const test = require("node:test");
const assert = require("node:assert/strict");

const { loadKinks } = require("../lib/data-manager");
const { analyzeKinks } = require("../lib/kink-qa");

test("shipped kink content has no safety QA issues", () => {
  const qa = analyzeKinks(loadKinks());

  assert.equal(qa.groups.safety, 0);
});
