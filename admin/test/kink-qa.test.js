const test = require("node:test");
const assert = require("node:assert/strict");

const { analyzeKinks } = require("../lib/kink-qa");

function baseKink(patch = {}) {
  return {
    id: "0001",
    slug: "sensual-massage",
    title: "Sensual Massage",
    titleEs: "Masaje Sensual",
    description: "Take turns giving each other a massage.",
    descriptionEs: "Túrnense para darse un masaje.",
    tags: ["touch", "communication"],
    category: "sensory",
    intensityScale: 1,
    tier: "soft",
    ...patch,
  };
}

test("analyzeKinks reports duplicate ids and slugs", () => {
  const qa = analyzeKinks([
    baseKink({ id: "0001", slug: "same-slug" }),
    baseKink({ id: "0001", slug: "same-slug", title: "Other" }),
  ]);

  assert.equal(qa.groups.duplicate, 2);
  assert.equal(qa.totalIssues, 2);
  assert.deepEqual(qa.issues.map((issue) => issue.title).sort(), [
    "Duplicate ID",
    "Duplicate Slug",
  ]);
});

test("analyzeKinks reports missing required and translation fields", () => {
  const qa = analyzeKinks([
    baseKink({
      id: "0002",
      slug: "",
      titleEs: "",
      descriptionEs: "",
    }),
  ]);

  assert.equal(qa.groups.required, 1);
  assert.equal(qa.groups.translation, 1);
});

test("analyzeKinks reports incomplete and duplicate pair roles", () => {
  const qa = analyzeKinks([
    baseKink({
      id: "0100",
      slug: "test-give",
      pairMode: true,
      pairKey: "test",
      pairRole: "give",
    }),
    baseKink({
      id: "0101",
      slug: "test-give-2",
      pairMode: true,
      pairKey: "test",
      pairRole: "give",
    }),
    baseKink({
      id: "0102",
      slug: "orphan-role",
      pairRole: "receive",
    }),
    baseKink({
      id: "0103",
      slug: "missing-role",
      pairMode: true,
      pairKey: "missing-role",
      pairRole: "",
    }),
  ]);

  assert.equal(qa.groups.pair, 6);
  assert.ok(qa.issues.some((issue) => issue.title === "Duplicate pair role"));
  assert.ok(qa.issues.some((issue) => issue.title === "Incomplete pair"));
  assert.ok(
    qa.issues.some((issue) => issue.title === "Pair role without pair key"),
  );
  assert.ok(
    qa.issues.some((issue) => issue.title === "Pair mode without pair role"),
  );
});

test("analyzeKinks reports high-intensity cards without safety tags", () => {
  const qa = analyzeKinks([
    baseKink({
      id: "0200",
      slug: "advanced-impact",
      tags: ["impact"],
      intensityScale: 3,
      tier: "xxx",
    }),
    baseKink({
      id: "0201",
      slug: "advanced-impact-safe",
      tags: ["impact", "boundaries"],
      intensityScale: 3,
      tier: "xxx",
    }),
  ]);

  assert.equal(qa.groups.safety, 1);
  assert.equal(qa.issues[0].type, "safety");
});
