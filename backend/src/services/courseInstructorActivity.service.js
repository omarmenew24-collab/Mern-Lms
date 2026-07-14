import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import RefundRequest from "../models/refundRequest.model.js";
import Submission from "../models/submission.model.js";
import CourseComment from "../models/courseComment.model.js";
import Task from "../models/task.model.js";

const LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;
const MEETING_WINDOW_MS = 60 * 60 * 1000;
const MEETING_URGENT_MS = 30 * 60 * 1000;

function isZoomUrl(url) {
  if (!url || typeof url !== "string") return false;
  return /zoom\.(us|gov|com)/i.test(url);
}

function meetingStartTime(task) {
  const examStart = task.examDetails?.startTime;
  if (examStart) return new Date(examStart);
  if (isZoomUrl(task.referenceLink?.url) && task.dueDate) {
    return new Date(task.dueDate);
  }
  return null;
}

function buildAction(path, label, external = false) {
  return { path, label, external };
}

/**
 * Staff-facing activity feed for the instructor course workspace.
 * Returns normalized, actionable events sorted newest first.
 */
export async function buildCourseInstructorActivity(courseId) {
  const cid = String(courseId);
  const since = new Date(Date.now() - LOOKBACK_MS);
  const now = Date.now();
  const meetingCutoff = now + MEETING_WINDOW_MS;

  const course = await Course.findById(cid).select("tasks teacher").lean();
  if (!course) return { events: [], attentionCount: 0 };

  const taskIds = (course.tasks || []).map((id) => String(id));
  const teacherId = String(course.teacher);

  const [
    enrollments,
    refundRequests,
    submissions,
    rootComments,
    replyComments,
    tasks,
  ] = await Promise.all([
    Enrollment.find({
      course: cid,
      enrolledAt: { $gte: since },
    })
      .sort({ enrolledAt: -1 })
      .limit(40)
      .populate("student", "name email")
      .lean(),
    RefundRequest.find({
      course: cid,
      $or: [{ createdAt: { $gte: since } }, { status: "pending" }],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("student", "name email")
      .lean(),
    taskIds.length
      ? Submission.find({
          taskId: { $in: taskIds },
          submittedAt: { $gte: since },
        })
          .sort({ submittedAt: -1 })
          .limit(50)
          .populate("studentId", "name email")
          .lean()
      : [],
    CourseComment.find({
      course: cid,
      parentComment: null,
      isDeleted: false,
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(40)
      .populate("user", "name")
      .lean(),
    CourseComment.find({
      course: cid,
      parentComment: { $ne: null },
      isDeleted: false,
      createdAt: { $gte: since },
    })
      .select("parentComment user")
      .lean(),
    taskIds.length
      ? Task.find({ _id: { $in: taskIds } })
          .select("title type dueDate examDetails referenceLink")
          .lean()
      : [],
  ]);

  const taskById = new Map(tasks.map((t) => [String(t._id), t]));

  const teacherRepliedParentIds = new Set();
  for (const reply of replyComments) {
    if (String(reply.user) === teacherId) {
      teacherRepliedParentIds.add(String(reply.parentComment));
    }
  }

  const events = [];

  for (const enrollment of enrollments) {
    const student = enrollment.student;
    const studentId = student?._id ? String(student._id) : String(enrollment.student);
    const studentName = student?.name || "A student";

    if (enrollment.status !== "active") continue;

    events.push({
      id: `enrollment:${enrollment._id}`,
      type: "enrollment",
      priority: "normal",
      title: "New enrollment",
      message: `${studentName} joined your course.`,
      occurredAt: enrollment.enrolledAt,
      action: buildAction(
        `/courses/${cid}/students/${studentId}`,
        "View student",
      ),
      meta: { studentId },
    });
  }

  for (const refund of refundRequests) {
    const student = refund.student;
    const studentId = student?._id ? String(student._id) : String(refund.student);
    const studentName = student?.name || "A student";
    const pending = refund.status === "pending";
    const statusLabel =
      refund.status === "pending"
        ? "requested a refund"
        : refund.status === "approved" || refund.status === "processing"
          ? "refund approved"
          : refund.status === "completed"
            ? "refund completed"
            : refund.status === "rejected"
              ? "refund rejected"
              : `refund ${refund.status}`;

    events.push({
      id: `refund:${refund._id}`,
      type: "refund",
      priority: pending ? "high" : "normal",
      title: pending ? "Refund request" : "Refund update",
      message: `${studentName} ${statusLabel}${pending ? " — awaiting admin review." : "."}`,
      occurredAt: refund.createdAt,
      action: buildAction(
        `/courses/${cid}/students/${studentId}`,
        pending ? "Review student" : "View student",
      ),
      meta: { studentId, refundStatus: refund.status },
    });
  }

  for (const submission of submissions) {
    const task = taskById.get(String(submission.taskId));
    const student = submission.studentId;
    const studentId = student?._id ? String(student._id) : String(submission.studentId);
    const studentName = student?.name || "A student";
    const taskTitle = task?.title || "Assignment";
    const ungraded = submission.grade == null;

    events.push({
      id: `submission:${submission._id}`,
      type: "submission",
      priority: ungraded ? "high" : "normal",
      title: ungraded ? "Submission needs grading" : "Task submitted",
      message: ungraded
        ? `${studentName} submitted “${taskTitle}”.`
        : `${studentName} submitted “${taskTitle}” (${submission.grade}/100).`,
      occurredAt: submission.submittedAt || submission.createdAt,
      action: buildAction(
        `/courses/${cid}/tasks/${submission.taskId}/submissions`,
        ungraded ? "Grade submission" : "View submissions",
      ),
      meta: {
        studentId,
        taskId: String(submission.taskId),
        ungraded,
      },
    });
  }

  for (const comment of rootComments) {
    const commentId = String(comment._id);
    const authorName = comment.user?.name || "A student";
    const unanswered = !teacherRepliedParentIds.has(commentId);
    const preview =
      comment.content.length > 120
        ? `${comment.content.slice(0, 117)}…`
        : comment.content;

    events.push({
      id: `question:${commentId}`,
      type: "question",
      priority: unanswered ? "high" : "normal",
      title: unanswered ? "New question" : "Q&A activity",
      message: unanswered
        ? `${authorName} asked: “${preview}”`
        : `${authorName} posted in Q&A: “${preview}”`,
      occurredAt: comment.createdAt,
      action: buildAction(`/courses/${cid}/workspace/comments`, "Open Q&A"),
      meta: { commentId, unanswered },
    });
  }

  for (const task of tasks) {
    const start = meetingStartTime(task);
    if (!start) continue;
    const startMs = start.getTime();
    if (startMs < now || startMs > meetingCutoff) continue;

    const minutesUntil = Math.max(0, Math.round((startMs - now) / 60_000));
    const urgent = startMs - now <= MEETING_URGENT_MS;
    const zoomUrl = isZoomUrl(task.referenceLink?.url)
      ? task.referenceLink.url
      : isZoomUrl(task.examDetails?.joinUrl)
        ? task.examDetails.joinUrl
        : null;

    const linkUrl = zoomUrl || task.referenceLink?.url || "";
    const hasExternalLink = Boolean(linkUrl);

    events.push({
      id: `meeting:${task._id}:${startMs}`,
      type: "meeting",
      priority: urgent ? "urgent" : "high",
      title: urgent ? "Meeting starting soon" : "Upcoming meeting",
      message: urgent
        ? `“${task.title}” starts in ${minutesUntil} min.`
        : `“${task.title}” is scheduled in ${minutesUntil} min.`,
      occurredAt: start,
      action: hasExternalLink
        ? buildAction(linkUrl, urgent ? "Join now" : "Open meeting link", true)
        : buildAction(`/courses/${cid}/workspace/tasks`, "View tasks"),
      meta: {
        taskId: String(task._id),
        minutesUntil,
        startTime: start.toISOString(),
      },
    });
  }

  events.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));

  const sliced = events.slice(0, 60);
  const newEventWindowMs = 72 * 60 * 60 * 1000;
  const newEventCutoff = Date.now() - newEventWindowMs;

  const newEventCount = sliced.filter((e) => {
    const t = new Date(e.occurredAt).getTime();
    return t >= newEventCutoff || t > Date.now();
  }).length;

  const attentionCount = sliced.filter(
    (e) =>
      e.priority === "urgent" ||
      (e.priority === "high" &&
        (e.type === "submission" ||
          e.type === "question" ||
          e.type === "refund" ||
          e.type === "meeting")),
  ).length;

  return { events: sliced, newEventCount, attentionCount };
}
