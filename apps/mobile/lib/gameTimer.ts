export const parseGameCardTimerSeconds = (timeStr: string): number => {
  const normalizedTime = timeStr.trim().toLowerCase();

  if (!normalizedTime || normalizedTime === 'n/a') {
    return 0;
  }

  if (normalizedTime.includes('min')) {
    const mins = parseInt(normalizedTime, 10);
    return isNaN(mins) ? 0 : mins * 60;
  }

  if (normalizedTime.includes('sec')) {
    const secs = parseInt(normalizedTime, 10);
    return isNaN(secs) ? 0 : secs;
  }

  if (normalizedTime.includes('ongoing')) {
    return 300;
  }

  return 0;
};
