import { blockedTerms } from './blockedTerms';
export function validateCustom(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  for (const rule of blockedTerms) {
    if (typeof rule === 'string') {
      if (text.includes(rule.toLowerCase()))
        return { ok: false, reason: 'Contains blocked term.' };
    } else {
      if (rule.test(text))
        return { ok: false, reason: 'Contains blocked term.' };
    }
  }
  if (title.length < 3 || title.length > 60)
    return { ok: false, reason: 'Title length out of range.' };
  if (description.length < 10 || description.length > 240)
    return { ok: false, reason: 'Description length out of range.' };
  if (/<\/?[a-z][\s\S]*>/i.test(description))
    return { ok: false, reason: 'No HTML allowed.' };
  return { ok: true };
}
