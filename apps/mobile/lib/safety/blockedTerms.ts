export const blockedTerms: (string|RegExp)[] = [
  /\bminor(s)?\b/i,
  /\bunder\s*18\b/i,
  /\bnon\s*consent|coercion|blackmail\b/i,
  /\banimal|bestiality\b/i,
  // Bodily fluids/excretions we explicitly don't allow in custom content
  /\bblood|feces|scat|poop|urine|pee\b/i,
  /\bincest\b/i,
  /\brape\b/i,
  /\bself\s*harm\b/i,
  /\bdoxx(ing)?\b/i,
  /\billegal\b/i
];
