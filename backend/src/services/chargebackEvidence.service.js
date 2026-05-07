import Payment from "../models/payment.model.js";
import UserSession from "../models/userSession.model.js";
import Enrollment from "../models/enrollment.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import RefundRequest from "../models/refundRequest.model.js";
import Course from "../models/course.model.js";
import Submission from "../models/submission.model.js";
import SiteSettings from "../models/siteSettings.model.js";

const MAX_SESSION_EVENTS = 40;
const MAX_SUBMISSION_SAMPLES = 20;
const DESC_EXCERPT = 700;

function truncate(str, max) {
  if (!str || typeof str !== "string") return "";
  const t = str.trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function buildPolicySummary(settings) {
  if (!settings) {
    return "Platform policy snapshot unavailable.";
  }
  const on = settings.refundsEnabled ? "On" : "Off";
  const days = settings.refundWindowDays ?? 14;
  const maxPct = settings.maxCompletionPercentForRefund ?? 20;
  const cap = settings.refundPercent ?? 100;
  return (
    `Student refunds: ${on}. Eligibility window: ${days} days from purchase; typically requires course progress below ${maxPct}% ` +
    `(admin-configured). Single refund capped at ${cap}% of purchase price where applicable.`
  );
}

/**
 * Build a deterministic evidence object for a payment (chargeback / dispute).
 */
export async function buildEvidenceSnapshot(paymentId) {
  const payment = await Payment.findById(paymentId)
    .populate("student", "name email")
    .populate("course", "title")
    .lean();

  if (!payment) {
    throw new Error("Payment not found");
  }

  const studentId = payment.student?._id || payment.student;
  const courseId = payment.course?._id || payment.course;
  const student = payment.student;

  const courseFull = await Course.findById(courseId)
    .populate("teacher", "name email")
    .select("title description category price lectures tasks")
    .lean();

  const taskIds = (courseFull?.tasks || []).map((t) =>
    typeof t === "object" && t?._id ? t._id : t,
  ).filter(Boolean);

  const paidAt = payment.paidAt ? new Date(payment.paidAt) : null;

  const [enrollment, completion, sessions, refundRows, settings, submissionsAll] = await Promise.all([
    Enrollment.findOne({ student: studentId, course: courseId }).lean(),
    CourseCompletion.findOne({ student: studentId, course: courseId }).lean(),
    UserSession.find({ user: studentId })
      .sort({ createdAt: -1 })
      .limit(MAX_SESSION_EVENTS)
      .select("createdAt")
      .lean(),
    RefundRequest.find({ payment: paymentId }).sort({ createdAt: 1 }).lean(),
    SiteSettings.findById("global").lean(),
    taskIds.length
      ? Submission.find({ studentId, taskId: { $in: taskIds } })
          .populate("taskId", "title")
          .sort({ submittedAt: 1 })
          .limit(80)
          .lean()
      : Promise.resolve([]),
  ]);

  const submissionsAfterPurchase = paidAt
    ? (submissionsAll || []).filter((s) => {
        const t = s.submittedAt || s.createdAt;
        return t && new Date(t) >= paidAt;
      })
    : submissionsAll || [];

  const sessionTimestamps = (sessions || []).map((s) =>
    s.createdAt ? new Date(s.createdAt).toISOString() : null,
  ).filter(Boolean);

  const paymentStatus = payment.status || "succeeded";
  const hasRefundRequest = refundRows.length > 0;
  const refundCompleted = refundRows.some((r) => r.status === "completed");
  const paymentShowsRefund = ["refunded", "partially_refunded"].includes(paymentStatus);
  const refundProcessed = refundCompleted || paymentShowsRefund;

  let refundSummary = "No refund on file for this purchase.";
  if (hasRefundRequest) {
    const parts = refundRows.map(
      (r) =>
        `${r.status} (${r.refundAmount} ${r.currency || ""}) at ${r.createdAt ? new Date(r.createdAt).toISOString() : "—"}`,
    );
    refundSummary = parts.join("; ");
  } else if (paymentShowsRefund) {
    refundSummary = `Payment status in ledger: ${paymentStatus}.`;
  }

  const lectTotal = Array.isArray(courseFull?.lectures) ? courseFull.lectures.length : 0;
  const taskTotal = Array.isArray(courseFull?.tasks) ? courseFull.tasks.length : taskIds.length;

  const lecturesDone = Array.isArray(completion?.completedLectures) ? completion.completedLectures.length : 0;
  const tasksDone = Array.isArray(completion?.completedTasks) ? completion.completedTasks.length : 0;

  const completionPercent =
    typeof completion?.progress === "number" && Number.isFinite(completion.progress)
      ? Math.round(completion.progress)
      : null;

  const lastSubmissionAt =
    submissionsAll.length > 0
      ? submissionsAll[submissionsAll.length - 1]?.submittedAt ||
        submissionsAll[submissionsAll.length - 1]?.createdAt
      : null;

  const firstSubmissionAt =
    submissionsAll.length > 0
      ? submissionsAll[0]?.submittedAt || submissionsAll[0]?.createdAt
      : null;

  const lastActivityAt = (() => {
    const dates = [
      completion?.updatedAt,
      lastSubmissionAt,
      enrollment?.enrolledAt,
    ].filter(Boolean);
    if (dates.length === 0) return null;
    const ms = dates.map((d) => new Date(d).getTime());
    return new Date(Math.max(...ms)).toISOString();
  })();

  const submissionSamples = (submissionsAll || []).slice(0, MAX_SUBMISSION_SAMPLES).map((s) => ({
    at: s.submittedAt ? new Date(s.submittedAt).toISOString() : s.createdAt ? new Date(s.createdAt).toISOString() : null,
    taskTitle: (s.taskId && s.taskId.title) || "Course task",
  }));

  const courseTitle = courseFull?.title || payment.course?.title || "—";
  const instructorName = courseFull?.teacher?.name || "—";
  const instructorEmail = courseFull?.teacher?.email || "";

  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    payment: {
      transactionId: payment.stripePaymentIntentId || String(payment._id),
      providerReference: payment.stripeChargeId || payment.stripePaymentIntentId || String(payment._id),
      provider: "stripe",
      paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
      amount: Number(payment.amount),
      currency: (payment.currency || "usd").toLowerCase(),
      paymentStatus,
    },
    identity: {
      userId: String(studentId),
      userName: student?.name || "—",
      email: student?.email || "—",
      ipAtPurchase: payment.clientIp || null,
    },
    policy: {
      refundsEnabled: Boolean(settings?.refundsEnabled),
      refundWindowDays: settings?.refundWindowDays ?? 14,
      maxCompletionPercentForRefund: settings?.maxCompletionPercentForRefund ?? 20,
      refundPercentCap: settings?.refundPercent ?? 100,
      summaryLine: buildPolicySummary(settings || {}),
      moneyBackGuaranteeLinkUrl: (settings?.moneyBackGuaranteeLinkUrl || "").trim() || null,
    },
    product: {
      courseTitle,
      category: courseFull?.category || "—",
      descriptionExcerpt: truncate(courseFull?.description || "", DESC_EXCERPT),
      listPrice: courseFull != null ? Number(courseFull.price) : null,
      instructorName,
      instructorEmail: instructorEmail || null,
      lectureCountPublished: lectTotal,
      taskCountPublished: taskTotal,
    },
    access: {
      enrollmentDate: enrollment?.enrolledAt ? new Date(enrollment.enrolledAt).toISOString() : null,
      sessionTimestamps,
    },
    usage: {
      courseTitle,
      completionPercent,
      lastActivityAt,
      lecturesCompletedCount: lecturesDone,
      lecturesTotalCount: lectTotal,
      tasksMarkedCompleteCount: tasksDone,
      assignmentSubmissionsTotal: submissionsAll.length,
      assignmentSubmissionsAfterPurchase: submissionsAfterPurchase.length,
    },
    engagement: {
      firstSubmissionAt: firstSubmissionAt ? new Date(firstSubmissionAt).toISOString() : null,
      lastSubmissionAt: lastSubmissionAt ? new Date(lastSubmissionAt).toISOString() : null,
      submissionSamples,
    },
    refunds: {
      refundRequested: hasRefundRequest,
      refundProcessed,
      summary: refundSummary,
      entries: refundRows.map((r) => ({
        status: r.status,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        refundAmount: r.refundAmount,
        currency: r.currency,
      })),
    },
  };
}

/**
 * Merge snapshot + chargeback record into a simple ordered timeline for UI / PDF.
 */
export function buildTimeline(chargeback, snapshot) {
  if (!snapshot) return [];
  const ev = [];
  if (snapshot.payment?.paidAt) {
    ev.push({ key: "pay", label: "Payment succeeded", at: snapshot.payment.paidAt });
  }
  if (snapshot.access?.enrollmentDate) {
    ev.push({
      key: "enr",
      label: "Course access (enrollment)",
      at: snapshot.access.enrollmentDate,
    });
  }
  if (snapshot.engagement?.firstSubmissionAt) {
    ev.push({
      key: "sub-first",
      label: "First coursework / assignment submission",
      at: snapshot.engagement.firstSubmissionAt,
    });
  }
  if (snapshot.usage?.lastActivityAt) {
    ev.push({
      key: "act",
      label: "Last recorded course activity",
      at: snapshot.usage.lastActivityAt,
    });
  }
  (snapshot.refunds?.entries || []).forEach((r, i) => {
    if (r.createdAt) {
      ev.push({
        key: `ref-${i}`,
        label: `Refund record: ${r.status}`,
        at: r.createdAt,
      });
    }
  });
  if (chargeback?.dateOpened) {
    ev.push({
      key: "cb",
      label: "Chargeback opened (this case)",
      at: new Date(chargeback.dateOpened).toISOString(),
    });
  }
  ev.sort((a, b) => new Date(a.at) - new Date(b.at));
  if (snapshot.generatedAt) {
    ev.push({
      key: "cap",
      label: "Evidence snapshot captured",
      at: snapshot.generatedAt,
    });
  }
  return ev;
}
