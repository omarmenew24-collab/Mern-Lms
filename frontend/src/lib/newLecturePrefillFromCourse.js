/**
 * Prefill for "new lecture" navigation so the next item lands in the same module (level) as the last lesson.
 */
export function getNewLecturePrefillFromLectures(sortedLectures) {
  const list = Array.isArray(sortedLectures) ? sortedLectures : [];
  if (list.length === 0) {
    return {
      prefillLevel: 1,
      prefillLevelTitle: "Module 1",
      prefillOrder: 0,
    };
  }
  const last = list[list.length - 1];
  const levelNum = Number(last?.level?.number);
  const levelTitle = typeof last?.level?.title === "string" && last.level.title.trim()
    ? last.level.title.trim()
    : `Module ${Number.isFinite(levelNum) && levelNum > 0 ? levelNum : 1}`;
  const lastOrder = Number(last?.order);
  const prefillOrder = Number.isFinite(lastOrder) ? lastOrder + 1 : list.length;
  return {
    prefillLevel: Number.isFinite(levelNum) && levelNum > 0 ? levelNum : 1,
    prefillLevelTitle: levelTitle,
    prefillOrder,
  };
}
