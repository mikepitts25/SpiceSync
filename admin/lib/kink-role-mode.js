const ROLE_TITLE_SUFFIX =
  /\s*\((?:giving|receiving|give|receive|dar|recibir|predator|prey)\)\s*$/i;
const ROLE_SLUG_SUFFIX =
  /-(?:give|receive|giving|receiving|dar|recibir|predator|prey)$/i;
const ROLE_ONLY_TAGS = new Set([
  "give",
  "giving",
  "receive",
  "receiving",
  "dar",
  "recibir",
]);

const SAFETY_CLAUSE =
  /,\s*(?:with|while|using|keeping|including|only|within|before|after|and|starting)\s+[^.]*\b(?:agreed|consensual|consent|safeword|safe word|check-?ins?|check in|checking|boundar(?:y|ies)|limits?|negotiat(?:ed|ion)|comfort|feedback|signals?|aftercare|safer-sex|privacy|legality|hygiene|preparation|lube|clear)\b[^.]*/gi;
const SAFETY_WITH_CLAUSE =
  /\s+with\s+[^.]*\b(?:agreed|consensual|consent|safeword|safe word|check-?ins?|check in|boundar(?:y|ies)|limits?|negotiat(?:ed|ion)|comfort|feedback|signals?|aftercare|safer-sex|privacy|legality|hygiene|preparation|lube|clear)\b[^.]*/gi;
const SAFETY_WORDS =
  /\b(?:consensual|agreed|negotiated|clear|explicit|ongoing|comfort|boundaries|limits|safewords?|check-?ins?|feedback|signals?|aftercare)\b/gi;

function stripRoleSuffix(value, pattern) {
  return String(value || "").replace(pattern, "").trim();
}

function baseTitle(title) {
  return stripRoleSuffix(title, ROLE_TITLE_SUFFIX);
}

function baseSlug(slug) {
  return stripRoleSuffix(slug, ROLE_SLUG_SUFFIX);
}

function sentenceCase(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function normalizeSentence(value) {
  const trimmed = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/,\s*\./g, ".")
    .trim();

  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function simplifyKinkDescription(description, title = "this topic") {
  const firstSentence =
    String(description || "")
      .split(/(?<=[.!?])\s+/)
      .find((sentence) => sentence.trim()) || "";

  let simplified = firstSentence
    .replace(SAFETY_WITH_CLAUSE, "")
    .replace(SAFETY_CLAUSE, "")
    .replace(SAFETY_WORDS, "")
    .replace(/\b(?:and|or)\s*\./gi, ".")
    .replace(/\s{2,}/g, " ");

  simplified = normalizeSentence(sentenceCase(simplified));

  if (simplified.length < 12 || /^(with|while|using|and|or)\b/i.test(simplified)) {
    return `Explore ${baseTitle(title).toLowerCase()} as a shared interest.`;
  }

  return simplified;
}

function mergeTags(...items) {
  const tags = new Set();
  items.forEach((item) => {
    (item.tags || []).forEach((tag) => {
      const normalized = String(tag).trim();
      if (!normalized || ROLE_ONLY_TAGS.has(normalized.toLowerCase())) return;
      tags.add(normalized);
    });
  });
  return Array.from(tags);
}

function cleanRoleMetadata(item) {
  const clean = { ...item };
  delete clean.pairKey;
  delete clean.pairRole;
  delete clean.sourceIds;
  delete clean.availablePairRoles;

  for (const key of ["titleEs", "titleEn", "descriptionEs", "descriptionEn"]) {
    if (clean[key] === "") delete clean[key];
  }

  return clean;
}

function collapseLegacyPairedKinks(kinks) {
  const byPairKey = new Map();
  const consumedIds = new Set();
  const collapsedByGiveId = new Map();

  for (const kink of kinks) {
    if (!kink.pairMode || !kink.pairKey || !kink.pairRole) continue;
    const pairItems = byPairKey.get(kink.pairKey) || [];
    pairItems.push(kink);
    byPairKey.set(kink.pairKey, pairItems);
  }

  for (const [, pairItems] of byPairKey.entries()) {
    const give = pairItems.find((item) => item.pairRole === "give");
    const receive = pairItems.find((item) => item.pairRole === "receive");
    if (!give || !receive) continue;

    consumedIds.add(give.id);
    consumedIds.add(receive.id);

    const clean = cleanRoleMetadata({
      ...give,
      slug: baseSlug(give.slug || receive.slug),
      title: baseTitle(give.title || receive.title),
      description: simplifyKinkDescription(
        give.description || receive.description,
        give.title || receive.title
      ),
      tags: mergeTags(give, receive),
      pairMode: true,
    });

    if (give.titleEs || receive.titleEs) {
      clean.titleEs = baseTitle(give.titleEs || receive.titleEs);
    }
    if (give.titleEn || receive.titleEn) {
      clean.titleEn = baseTitle(give.titleEn || receive.titleEn);
    }
    if (give.descriptionEs || receive.descriptionEs) {
      clean.descriptionEs = simplifyKinkDescription(
        give.descriptionEs || receive.descriptionEs,
        give.titleEs || receive.titleEs || give.title || receive.title
      );
    }
    if (give.descriptionEn || receive.descriptionEn) {
      clean.descriptionEn = simplifyKinkDescription(
        give.descriptionEn || receive.descriptionEn,
        give.titleEn || receive.titleEn || give.title || receive.title
      );
    }

    collapsedByGiveId.set(give.id, clean);
  }

  const result = [];
  for (const kink of kinks) {
    const collapsed = collapsedByGiveId.get(kink.id);
    if (collapsed) {
      result.push(collapsed);
      continue;
    }

    if (consumedIds.has(kink.id)) continue;

    result.push(kink);
  }

  return result;
}

function enableRoleModeForKinks(kinks, ids = null, enabled = true) {
  const idSet = Array.isArray(ids) && ids.length ? new Set(ids.map(String)) : null;
  return kinks.map((kink) => {
    if (idSet && !idSet.has(String(kink.id))) return kink;
    return {
      ...cleanRoleMetadata(kink),
      pairMode: Boolean(enabled),
    };
  });
}

function simplifyKinkDescriptions(kinks) {
  return kinks.map((kink) => ({
    ...kink,
    description: simplifyKinkDescription(kink.description, kink.title),
    descriptionEs: simplifyKinkDescription(
      kink.descriptionEs || kink.description,
      kink.titleEs || kink.title
    ),
    descriptionEn: kink.descriptionEn
      ? simplifyKinkDescription(kink.descriptionEn, kink.titleEn || kink.title)
      : kink.descriptionEn,
  }));
}

module.exports = {
  baseSlug,
  baseTitle,
  collapseLegacyPairedKinks,
  enableRoleModeForKinks,
  simplifyKinkDescription,
  simplifyKinkDescriptions,
};
