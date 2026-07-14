/**
 * Human phrase for total estimated watch time (seconds → "approximately … remaining").
 */
export function formatApproximateWatchTimeRemaining(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "";
  const totalMins = Math.max(1, Math.round(totalSeconds / 60));
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) {
    return `approximately ${m} ${m === 1 ? "minute" : "minutes"} remaining`;
  }
  const hourPart = `${h} ${h === 1 ? "hour" : "hours"}`;
  if (m === 0) return `approximately ${hourPart} remaining`;
  const minPart = `${m} ${m === 1 ? "minute" : "minutes"}`;
  return `approximately ${hourPart} ${minPart} remaining`;
}

/**
 * Average lesson length (seconds) from lectures that have a positive duration, then × remaining lesson count.
 * Returns null if there is nothing left to watch or no duration data to average.
 */
export function getApproximateLectureTimeRemainingPhrase(lectures, totalLectureCount, completedLectureCount) {
  const total = Math.max(0, Math.floor(Number(totalLectureCount) || 0));
  const done = Math.max(0, Math.floor(Number(completedLectureCount) || 0));
  const remaining = Math.max(0, total - done);
  if (remaining <= 0) return null;

  const list = Array.isArray(lectures) ? lectures : [];
  const durations = list
    .map((l) => Number(l?.duration))
    .filter((d) => Number.isFinite(d) && d > 0);
  if (durations.length === 0) return null;

  const avgSeconds = durations.reduce((a, b) => a + b, 0) / durations.length;
  const estimatedSeconds = avgSeconds * remaining;
  return formatApproximateWatchTimeRemaining(estimatedSeconds) || null;
}
