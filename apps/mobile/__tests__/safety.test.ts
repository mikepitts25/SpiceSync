import { validateCustom } from '../lib/safety/safetyFilter';

test('blocks minors term', () => {
  const res = validateCustom('Test', 'Includes the word minor here');
  expect(res.ok).toBe(false);
});

test('allows neutral idea', () => {
  const res = validateCustom(
    'Warm cocoa',
    'Sharing a warm cocoa drink together while talking.'
  );
  expect(res.ok).toBe(true);
});
