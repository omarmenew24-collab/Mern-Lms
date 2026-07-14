import Enrollment from "../models/enrollment.model.js";
import Payment from "../models/payment.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import Lecture from "../models/lecture.model.js";
import Course from "../models/course.model.js";

function sortLectures(lectures) {
  return [...lectures].sort((a, b) => {
    const la = a.level?.number ?? 0;
    const lb = b.level?.number ?? 0;
    if (la !== lb) return la - lb;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

/**
 * Builds a staff-facing learner summary for one course enrollment.
 * @returns {Promise<object|null>}
 */
export async function buildLearnerEnrollmentSnapshot(courseId, studentId) {
  const sid = String(studentId);
  const cid = String(courseId);

  const enrollment = await Enrollment.findOne({
    course: cid,
    student: sid,
    status: "active",
  }).lean();

  if (!enrollment) return null;

  const [course, earliestPayment, completion, lecturesRaw] = await Promise.all([
    Course.findById(cid).populate("teacher", "name email").lean(),
    Payment.findOne({
      student: sid,
      course: cid,
      status: { $in: ["succeeded", "partially_refunded"] },
    })
      .sort({ paidAt: 1 })
      .select("paidAt")
      .lean(),
    CourseCompletion.findOne({ student: sid, course: cid }).lean(),
    Lecture.find({ course: cid }).select("title order level").lean(),
  ]);

  if (!course) return null;

  const lectures = sortLectures(lecturesRaw);
  const totalLectures = lectures.length;
  const completedSet = new Set(
    (completion?.completedLectures || []).map((id) => String(id)),
  );

  let lastCompletedIndex = -1;
  let lastCompletedTitle = "";
  lectures.forEach((lec, idx) => {
    if (completedSet.has(String(lec._id))) {
      lastCompletedIndex = idx;
      lastCompletedTitle = lec.title || "";
    }
  });

  let lastLessonLabel;
  if (totalLectures === 0) {
    lastLessonLabel = "No lessons in this course yet";
  } else if (lastCompletedIndex >= 0) {
    lastLessonLabel = `Lesson ${lastCompletedIndex + 1} of ${totalLectures}: ${lastCompletedTitle || "Untitled"}`;
  } else {
    lastLessonLabel = "None completed yet";
  }

  const purchaseDate =
    earliestPayment?.paidAt != null ? new Date(earliestPayment.paidAt) : null;
  const enrollmentDate = enrollment.enrolledAt
    ? new Date(enrollment.enrolledAt)
    : null;

  const firstCourseAccessRaw =
    completion?.firstWorkspaceVisitAt ||
    completion?.createdAt ||
    enrollmentDate;

  return {
    studentId: sid,
    courseId: cid,
    courseTitle: course.title || "",
    coursePublicPath: `/courses/${cid}`,
    instructorName: course.teacher?.name || "—",
    instructorId: course.teacher?._id ? String(course.teacher._id) : null,

    purchaseDate: purchaseDate ? purchaseDate.toISOString() : null,
    enrollmentDate: enrollmentDate ? enrollmentDate.toISOString() : null,
    purchaseRecorded: Boolean(purchaseDate),

    firstCourseAccessAt: firstCourseAccessRaw
      ? new Date(firstCourseAccessRaw).toISOString()
      : null,

    workspaceVisitCount: completion?.workspaceVisitCount ?? 0,

    completionPercent: Math.round(
      Math.min(100, Math.max(0, Number(completion?.progress) || 0)),
    ),

    lastLessonLabel,
    totalLectures,

    refundPolicyAcceptedAt: enrollment.refundPolicyAcceptedAt
      ? new Date(enrollment.refundPolicyAcceptedAt).toISOString()
      : null,
  };
}
