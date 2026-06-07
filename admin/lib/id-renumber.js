function splitTrailingNumber(id) {
  const match = String(id || "").match(/^(.*?)(\d+)$/);
  if (!match) return null;
  return {
    prefix: match[1],
    width: match[2].length,
  };
}

function renumberByPrefix(items, minWidth = 1) {
  const counts = new Map();

  return items.map((item) => {
    const parsed = splitTrailingNumber(item.id);
    if (!parsed) return item;

    const next = (counts.get(parsed.prefix) || 0) + 1;
    counts.set(parsed.prefix, next);

    return {
      ...item,
      id: `${parsed.prefix}${String(next).padStart(Math.max(minWidth, parsed.width), "0")}`,
    };
  });
}

function renumberSequential(items, width) {
  return items.map((item, index) => ({
    ...item,
    id: String(index + 1).padStart(width, "0"),
  }));
}

function renumberContentIds(kind, items) {
  if (!Array.isArray(items)) return [];

  if (kind === "kinks") {
    return renumberSequential(items, 4);
  }

  if (kind === "conversation-starters") {
    return renumberByPrefix(items, 3);
  }

  return renumberByPrefix(items, 1);
}

module.exports = {
  renumberContentIds,
};
