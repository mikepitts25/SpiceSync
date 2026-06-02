const SAFETY_TAGS = new Set([
  "aftercare",
  "boundaries",
  "check-in",
  "communication",
  "consent",
  "safety",
  "safeword",
]);

const REQUIRED_FIELDS = [
  "id",
  "slug",
  "title",
  "description",
  "category",
  "intensityScale",
  "tier",
];

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function normalizedTags(kink) {
  return Array.isArray(kink.tags)
    ? kink.tags.map((tag) => String(tag).toLowerCase())
    : [];
}

function createIssue(type, severity, title, message, itemIds = []) {
  return {
    type,
    severity,
    title,
    message,
    itemIds: Array.from(new Set(itemIds.filter(Boolean).map(String))),
  };
}

function addDuplicateIssues(issues, kinks, field, type, label) {
  const seen = new Map();
  for (const kink of kinks) {
    const value = hasValue(kink[field]) ? String(kink[field]).trim() : "";
    if (!value) continue;
    const current = seen.get(value) || [];
    current.push(kink.id);
    seen.set(value, current);
  }

  for (const [value, ids] of seen.entries()) {
    if (ids.length < 2) continue;
    issues.push(
      createIssue(
        type,
        "error",
        `Duplicate ${label}`,
        `${label} "${value}" is used by ${ids.join(", ")}.`,
        ids,
      ),
    );
  }
}

function addRequiredFieldIssues(issues, kinks) {
  for (const kink of kinks) {
    const missing = REQUIRED_FIELDS.filter((field) => !hasValue(kink[field]));
    if (!missing.length) continue;
    issues.push(
      createIssue(
        "required",
        "error",
        "Missing required fields",
        `${kink.id || kink.slug || "Unknown kink"} is missing ${missing.join(", ")}.`,
        [kink.id],
      ),
    );
  }
}

function addTranslationIssues(issues, kinks) {
  for (const kink of kinks) {
    const missing = [];
    if (!hasValue(kink.titleEs)) missing.push("titleEs");
    if (!hasValue(kink.descriptionEs)) missing.push("descriptionEs");
    if (!missing.length) continue;
    issues.push(
      createIssue(
        "translation",
        "warning",
        "Missing Spanish fields",
        `${kink.id || kink.slug || "Unknown kink"} is missing ${missing.join(", ")}.`,
        [kink.id],
      ),
    );
  }
}

function addPairIssues(issues, kinks) {
  const byPairKey = new Map();

  for (const kink of kinks) {
    if (kink.pairMode && !hasValue(kink.pairKey)) {
      issues.push(
        createIssue(
          "pair",
          "error",
          "Pair mode without pair key",
          `${kink.id || kink.slug || "Unknown kink"} has pairMode but no pairKey.`,
          [kink.id],
        ),
      );
    }

    if (kink.pairMode && !hasValue(kink.pairRole)) {
      issues.push(
        createIssue(
          "pair",
          "error",
          "Pair mode without pair role",
          `${kink.id || kink.slug || "Unknown kink"} has pairMode but no pairRole.`,
          [kink.id],
        ),
      );
    }

    if (hasValue(kink.pairRole) && !hasValue(kink.pairKey)) {
      issues.push(
        createIssue(
          "pair",
          "error",
          "Pair role without pair key",
          `${kink.id || kink.slug || "Unknown kink"} has pairRole but no pairKey.`,
          [kink.id],
        ),
      );
    }

    if (!hasValue(kink.pairKey)) continue;
    const items = byPairKey.get(kink.pairKey) || [];
    items.push(kink);
    byPairKey.set(kink.pairKey, items);
  }

  for (const [pairKey, pairItems] of byPairKey.entries()) {
    const pairModeItems = pairItems.filter((item) => item.pairMode);
    if (!pairModeItems.length) continue;

    const roles = pairModeItems.reduce((acc, item) => {
      const role = hasValue(item.pairRole) ? String(item.pairRole) : "";
      if (!role) return acc;
      acc[role] = acc[role] || [];
      acc[role].push(item.id);
      return acc;
    }, {});

    for (const role of ["give", "receive"]) {
      if (!roles[role]) {
        issues.push(
          createIssue(
            "pair",
            "error",
            "Incomplete pair",
            `Pair "${pairKey}" is missing a ${role} source.`,
            pairModeItems.map((item) => item.id),
          ),
        );
      } else if (roles[role].length > 1) {
        issues.push(
          createIssue(
            "pair",
            "error",
            "Duplicate pair role",
            `Pair "${pairKey}" has ${roles[role].length} ${role} sources.`,
            roles[role],
          ),
        );
      }
    }
  }
}

function addSafetyIssues(issues, kinks) {
  for (const kink of kinks) {
    const intensity = Number(kink.intensityScale || 0);
    const isHighIntensity = kink.tier === "xxx" || intensity >= 3;
    if (!isHighIntensity) continue;

    const tags = normalizedTags(kink);
    const hasSafetyTag = tags.some((tag) => SAFETY_TAGS.has(tag));
    if (hasSafetyTag) continue;

    issues.push(
      createIssue(
        "safety",
        "warning",
        "High-intensity card lacks safety tag",
        `${kink.id || kink.slug || "Unknown kink"} is high intensity but lacks safety, boundaries, consent, communication, check-in, safeword, or aftercare tags.`,
        [kink.id],
      ),
    );
  }
}

function summarizeGroups(issues) {
  const groups = {
    duplicate: 0,
    required: 0,
    translation: 0,
    pair: 0,
    safety: 0,
  };

  for (const issue of issues) {
    groups[issue.type] = (groups[issue.type] || 0) + 1;
  }

  return groups;
}

function analyzeKinks(kinks) {
  const items = Array.isArray(kinks) ? kinks : [];
  const issues = [];

  addDuplicateIssues(issues, items, "id", "duplicate", "ID");
  addDuplicateIssues(issues, items, "slug", "duplicate", "Slug");
  addRequiredFieldIssues(issues, items);
  addTranslationIssues(issues, items);
  addPairIssues(issues, items);
  addSafetyIssues(issues, items);

  return {
    totalIssues: issues.length,
    groups: summarizeGroups(issues),
    issues,
  };
}

module.exports = {
  SAFETY_TAGS,
  analyzeKinks,
};
