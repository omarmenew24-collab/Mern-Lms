import Notification from "../models/notification.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import Enrollment from "../models/enrollment.model.js";
import { sendMail, isMailConfigured } from "../lib/sendMail.js";

const activeEnrollments = {
  $or: [{ status: "active" }, { status: { $exists: false } }],
};

/**
 * In-app + optional email. Email is off by default; set sendEmail: true only for
 * high-signal events (e.g. enrollment, submission, grade). Trivial in-app events stay silent in the inbox.
 * Email failures are logged, never thrown.
 */
export async function createInAppNotification({
  userId,
  title,
  message,
  type = "info",
  courseId = null,
  actionType = "",
  taskId = null,
  relatedUserId = null,
  sendEmail = false,
}) {
  const doc = await Notification.create({
    user: userId,
    title,
    message,
    type,
    course: courseId || null,
    actionType,
    task: taskId || null,
    relatedUser: relatedUserId || null,
  });

  if (sendEmail) {
    void maybeSendEmailForNotification(String(userId), title, message, type).catch(
      (e) => console.error("maybeSendEmailForNotification:", e.message),
    );
  }

  return doc;
}

async function maybeSendEmailForNotification(userId, title, text, type) {
  if (!isMailConfigured()) return;

  const u = await User.findById(userId).select("email name notificationEmailEnabled notificationLevel");
  if (!u?.email || u.notificationEmailEnabled === false) return;
  if (u.notificationLevel === "important" && type === "info") return;

  const subject = `[LMS] ${title}`;
  const body = text + "\n\n— CourseAcademy (notification)";
  try {
    await sendMail({ to: u.email, subject, text: body });
  } catch (e) {
    console.error("Send notification email failed:", e.message);
  }
}

export async function createInAppForMany(
  userIds,
  { title, message, type, courseId, actionType, taskId, sendEmail = false } = {},
) {
  const unique = [...new Set((userIds || []).map((id) => String(id)))];
  for (const uid of unique) {
    await createInAppNotification({
      userId: uid,
      title,
      message,
      type,
      courseId,
      actionType,
      taskId,
      sendEmail,
    });
  }
}

// ——— Event-style triggers (call from controllers after success) ———

export async function onCourseEnrolledFromPayment({ studentId, courseId }) {
  const course = await Course.findById(courseId).select("title teacher");
  if (!course) return;

  const courseTitle = course.title || "Course";
  const sid = String(studentId);

  await createInAppNotification({
    userId: sid,
    title: "Enrollment confirmed",
    message: `You’re now enrolled in “${courseTitle}”. Open the course to start learning.`,
    type: "success",
    courseId,
    actionType: "course.enrolled",
    sendEmail: true,
  });

  const teacherId = course.teacher?.toString?.() || String(course.teacher);
  if (teacherId && teacherId !== sid) {
    await createInAppNotification({
      userId: teacherId,
      title: "New enrollment",
      message: `A student just enrolled in “${courseTitle}”.`,
      type: "info",
      courseId,
      actionType: "course.new_enrollment_instructor",
      sendEmail: true,
    });
  }

  const admins = await User.find({ role: "admin", isDeleted: { $ne: true } }).select("_id");
  for (const a of admins) {
    const aid = a._id.toString();
    if (aid === sid) continue;
    if (aid === teacherId) continue;
    await createInAppNotification({
      userId: a._id,
      title: "New course enrollment",
      message: `A student enrolled in “${courseTitle}”.`,
      type: "info",
      courseId,
      actionType: "course.enrolled_admin",
      sendEmail: false,
    });
  }
}

export async function onLecturePublished({ course, lectureDoc }) {
  if (!course?._id || !lectureDoc) return;
  const title = course.title || "Your course";
  const lectureTitle = lectureDoc.title || "New lesson";

  const rows = await Enrollment.find({
    course: course._id,
    ...activeEnrollments,
  }).select("student");

  const students = rows.map((r) => r.student.toString());
  for (const sid of students) {
    await createInAppNotification({
      userId: sid,
      title: "New lesson published",
      message: `A new lesson “${lectureTitle}” is available in “${title}”.`,
      type: "info",
      courseId: course._id,
      actionType: "lecture.published",
      sendEmail: false,
    });
  }
}

export async function onTaskCreatedForCourse({ course, task, courseId }) {
  if (!task || !courseId) return;
  if (task.type && task.type !== "assignment" && task.type !== "exam") {
    // still notify for exams if needed
  }

  const courseTitle = course?.title || "A course";
  const rows = await Enrollment.find({ course: courseId, ...activeEnrollments }).select("student");
  const line =
    task.type === "assignment" && task.dueDate
      ? `New assignment “${task.title}” in “${courseTitle}”. Due: ${new Date(task.dueDate).toLocaleString()}.`
      : `New work “${task.title}” was added to “${courseTitle}”.`;

  for (const e of rows) {
    await createInAppNotification({
      userId: e.student,
      title: "New course activity",
      message: line,
      type: "warning",
      courseId,
      actionType: "task.created",
      taskId: task._id,
      sendEmail: false,
    });
  }
}

export async function onAssignmentSubmitted({ course, task, studentId, teacherId }) {
  if (!task || !teacherId) return;
  const cTitle = course?.title || "Course";
  if (String(studentId) === String(teacherId)) return;
  const taskTitle = task.title || "Assignment";

  await createInAppNotification({
    userId: teacherId,
    title: "New submission",
    message: `A student submitted work for “${taskTitle}” in “${cTitle}”.`,
    type: "info",
    courseId: course._id,
    actionType: "assignment.submitted",
    taskId: task._id,
    relatedUserId: studentId,
    sendEmail: true,
  });
}

export async function onAssignmentGraded({ courseId, taskTitle, studentId, grade, teacherName }) {
  const msg = `Your work for “${taskTitle}” was graded. Grade: ${grade}.${
    teacherName ? ` Instructor: ${teacherName}.` : ""
  }`;
  await createInAppNotification({
    userId: studentId,
    title: "Assignment graded",
    message: msg,
    type: "success",
    courseId,
    actionType: "assignment.graded",
    sendEmail: true,
  });
}

/** Notify the course instructor when someone else comments (typically a student). */
export async function onCourseCommentForInstructor({ course, commenterId, commenterName }) {
  const tid = course.teacher?.toString?.() || String(course.teacher);
  if (String(commenterId) === tid) return;

  await createInAppNotification({
    userId: tid,
    title: "New comment on your course",
    message: `${commenterName || "Someone"} left a comment on “${course.title}”.`,
    type: "info",
    courseId: course._id,
    actionType: "course.comment",
    relatedUserId: commenterId,
  });
}

export async function onRefundRequestSubmitted({ studentId, courseId, courseTitle, needsReview }) {
  const title = courseTitle || "your course";
  await createInAppNotification({
    userId: String(studentId),
    title: "Refund request received",
    message: needsReview
      ? `We received your refund request for “${title}”. An administrator will review it.`
      : `Your refund for “${title}” is being processed.`,
    type: "info",
    courseId,
    actionType: "refund.submitted",
    sendEmail: true,
  });

  const admins = await User.find({ role: "admin", isDeleted: { $ne: true } }).select("_id");
  for (const a of admins) {
    await createInAppNotification({
      userId: a._id,
      title: "New refund request",
      message: `A student requested a refund for “${title}”.${needsReview ? " Review in Admin → Refunds." : ""}`,
      type: "warning",
      courseId,
      actionType: "refund.submitted_admin",
      sendEmail: false,
    });
  }
}

export async function onRefundCompleted({ studentId, courseId, isPartial, refundPercent }) {
  const course = await Course.findById(courseId).select("title");
  const courseTitle = course?.title || "the course";
  const partial = Boolean(isPartial);
  const pct = typeof refundPercent === "number" ? refundPercent : 100;
  const accessLine = partial
    ? `A partial refund (${pct}% of the purchase) was sent. Your course access remains active.`
    : "Your course access has been removed.";
  await createInAppNotification({
    userId: String(studentId),
    title: partial ? "Partial refund sent" : "Refund completed",
    message: `Your payment for “${courseTitle}” was refunded. ${accessLine}`,
    type: "success",
    courseId,
    actionType: "refund.completed",
    sendEmail: true,
  });
  const admins = await User.find({ role: "admin", isDeleted: { $ne: true } }).select("_id");
  for (const a of admins) {
    await createInAppNotification({
      userId: a._id,
      title: "Refund processed",
      message: `A ${partial ? `partial (${pct}%)` : "full"} refund was completed for “${courseTitle}”.`,
      type: "info",
      courseId,
      actionType: "refund.completed_admin",
      sendEmail: false,
    });
  }
}

export async function onRefundRejected({ studentId, courseId, courseTitle }) {
  const t = courseTitle || "the course";
  await createInAppNotification({
    userId: String(studentId),
    title: "Refund request not approved",
    message: `Your refund request for “${t}” was not approved. See the refund page for details or contact support.`,
    type: "warning",
    courseId,
    actionType: "refund.rejected",
    sendEmail: true,
  });
}

/** Student: manual bank/wallet payment proof was rejected; they may submit again. */
export async function onManualPaymentRejected({ studentId, courseId, orderNumber, reason }) {
  const course = await Course.findById(courseId).select("title");
  const title = course?.title || "your course";
  const note = reason ? ` Details: ${String(reason).slice(0, 500)}` : "";
  await createInAppNotification({
    userId: String(studentId),
    title: "Manual payment not verified",
    message: `We could not verify your payment for order ${orderNumber} — “${title}”. Open Manual payments in your account to upload new proof.${note}`,
    type: "warning",
    courseId,
    actionType: "payment.manual_rejected",
    sendEmail: true,
  });
}

export async function onRefundFailed({ studentId, courseId, message }) {
  const course = await Course.findById(courseId).select("title");
  const courseTitle = course?.title || "the course";
  await createInAppNotification({
    userId: String(studentId),
    title: "Refund could not be completed",
    message: `We could not process your refund for “${courseTitle}”. ${message ? `Details: ${String(message).slice(0, 200)}` : "Please contact support."}`,
    type: "error",
    courseId,
    actionType: "refund.failed",
    sendEmail: true,
  });
  const admins = await User.find({ role: "admin", isDeleted: { $ne: true } }).select("_id");
  for (const a of admins) {
    await createInAppNotification({
      userId: a._id,
      title: "Refund processing failed",
      message: `Automated refund failed for “${courseTitle}”. Check Admin → Refunds.`,
      type: "error",
      courseId,
      actionType: "refund.failed_admin",
      sendEmail: false,
    });
  }
}

/**
 * Best-effort: do not let notification failures break HTTP handlers.
 */
export function notifySafe(fn) {
  Promise.resolve()
    .then(() => fn())
    .catch((e) => console.error("Notification trigger failed:", e?.message || e));
}
