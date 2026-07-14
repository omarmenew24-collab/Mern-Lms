import Enrollment from "../models/enrollment.model.js";
import Lecture from "../models/lecture.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";

function sortLectures(lectures) {
  return [...lectures].sort((a, b) => {
    const la = a.level?.number ?? 0;
    const lb = b.level?.number ?? 0;
    if (la !== lb) return la - lb;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

/**
 * Staff-facing curriculum analytics derived from enrollments and completion records.
 * Views = learners who completed or acknowledged a lecture.
 * Avg watch = estimated from lecture duration × finish rate (until player telemetry exists).
 */
export async function buildCourseCurriculumAnalytics(courseId) {
  const cid = String(courseId);

  const [enrolledStudents, lecturesRaw, completions] = await Promise.all([
    Enrollment.countDocuments({ course: cid, status: "active" }),
    Lecture.find({ course: cid }).select("_id level duration order").lean(),
    CourseCompletion.find({ course: cid })
      .select("completedLectures acknowledgedLectures")
      .lean(),
  ]);

  const lectures = sortLectures(lecturesRaw);
  const lectureStats = {};
  const levelFinishRates = {};

  for (const lecture of lectures) {
    const lectureId = String(lecture._id);
    const levelNumber = lecture.level?.number ?? 1;
    let completedCount = 0;
    let views = 0;

    for (const completion of completions) {
      const completedIds = new Set(
        (completion.completedLectures || []).map((id) => String(id)),
      );
      const acknowledgedIds = new Set(
        (completion.acknowledgedLectures || []).map((id) => String(id)),
      );

      if (completedIds.has(lectureId)) {
        completedCount += 1;
        views += 1;
      } else if (acknowledgedIds.has(lectureId)) {
        views += 1;
      }
    }

    const finishRate =
      enrolledStudents > 0
        ? Math.round((completedCount / enrolledStudents) * 100)
        : 0;
    const durationSeconds = Math.max(0, Number(lecture.duration) || 0);
    const avgWatchSeconds =
      durationSeconds > 0 ? Math.round(durationSeconds * (finishRate / 100)) : 0;

    lectureStats[lectureId] = {
      lectureId,
      levelNumber,
      views,
      completedCount,
      finishRate,
      dropOffRate: Math.max(0, 100 - finishRate),
      avgWatchSeconds,
    };

    if (!levelFinishRates[levelNumber]) levelFinishRates[levelNumber] = [];
    levelFinishRates[levelNumber].push(finishRate);
  }

  const levels = {};
  for (const [levelNumber, finishRates] of Object.entries(levelFinishRates)) {
    const completionPercent = finishRates.length
      ? Math.round(
          finishRates.reduce((sum, rate) => sum + rate, 0) / finishRates.length,
        )
      : 0;
    levels[levelNumber] = {
      levelNumber: Number(levelNumber),
      completionPercent,
      lectureCount: finishRates.length,
    };
  }

  return {
    enrolledStudents,
    lectures: lectureStats,
    levels,
  };
}
