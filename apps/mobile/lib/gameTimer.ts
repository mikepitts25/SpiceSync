const MAX_GAME_CARD_TIMER_SECONDS = 60;

const clampGameCardTimerSeconds = (seconds: number) =>
  Math.min(seconds, MAX_GAME_CARD_TIMER_SECONDS);

export const parseGameCardTimerSeconds = (timeStr: string): number => {
  const normalizedTime = timeStr.trim().toLowerCase();

  if (!normalizedTime || normalizedTime === 'n/a') {
    return 0;
  }

  if (normalizedTime.includes('min')) {
    const mins = parseInt(normalizedTime, 10);
    return isNaN(mins) ? 0 : clampGameCardTimerSeconds(mins * 60);
  }

  if (normalizedTime.includes('sec')) {
    const secs = parseInt(normalizedTime, 10);
    return isNaN(secs) ? 0 : clampGameCardTimerSeconds(secs);
  }

  if (normalizedTime.includes('ongoing')) {
    return 0;
  }

  return 0;
};

export const formatGameCardTimerSeconds = (seconds: number): string => {
  const clampedSeconds = clampGameCardTimerSeconds(Math.max(seconds, 0));
  const mins = Math.floor(clampedSeconds / 60);
  const secs = clampedSeconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatGameCardTimerEstimate = (seconds: number): string => {
  const clampedSeconds = clampGameCardTimerSeconds(Math.max(seconds, 0));

  if (clampedSeconds === 60) {
    return '1 min';
  }

  if (clampedSeconds > 0) {
    return `${clampedSeconds} sec`;
  }

  return 'N/A';
};
