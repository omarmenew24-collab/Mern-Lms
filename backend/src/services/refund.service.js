import Stripe from "stripe";
import SiteSettings from "../models/siteSettings.model.js";
import Payment from "../models/payment.model.js";
import Enrollment from "../models/enrollment.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import RefundRequest from "../models/refundRequest.model.js";
import RefundAuditLog from "../models/refundAuditLog.model.js";
import {
  notifySafe,
  onRefundCompleted,
  onRefundRejected,
  onRefundFailed,
} from "./notification.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function getRefundPolicyDoc() {
  const doc = await SiteSettings.findById("global").lean();
  const rp = Number(doc?.refundPercent);
  const maxRefundPercent = !Number.isFinite(rp) ? 100 : Math.min(100, Math.max(1, Math.round(rp)));
  return {
    refundsEnabled: Boolean(doc?.refundsEnabled),
    refundWindowDays: Math.min(365, Math.max(1, Number(doc?.refundWindowDays) || 14)),
    maxCompletionPercentForRefund: Math.min(
      100,
      Math.max(0, Number(doc?.maxCompletionPercentForRefund) ?? 20),
    ),
    refundPercent: maxRefundPercent,
    refundAutoApprove: Boolean(doc?.refundAutoApprove),
    refundReasonRequired: doc?.refundReasonRequired !== false,
  };
}

/** @param {number} amountMajor e.g. dollars @param {number} percent 1–100 */
export function computeRefundAmountMajor(amountMajor, percent) {
  const a = Number(amountMajor) || 0;
  const p = Math.min(100, Math.max(1, Math.round(Number(percent) || 1)));
  return Math.round(a * 100 * (p / 100)) / 100;
}

export function getPublicRefundPolicyPayload(policy) {
  return {
    refundsEnabled: policy.refundsEnabled,
    refundWindowDays: policy.refundWindowDays,
    maxCompletionPercentForRefund: policy.maxCompletionPercentForRefund,
    refundPercent: policy.refundPercent,
    refundReasonRequired: policy.refundReasonRequired,
  };
}

async function getProgressPercent(studentId, courseId) {
  const c = await CourseCompletion.findOne({ student: studentId, course: courseId })
    .select("progress")
    .lean();
  if (!c) return 0;
  return Math.min(100, Math.max(0, Number(c.progress) || 0));
}

/**
 * @returns {Promise<{
 *   policy: Awaited<ReturnType<typeof getRefundPolicyDoc>>,
 *   payment: object | null,
 *   enrollment: object | null,
 *   progress: number,
 *   existingRequest: object | null,
 *   daysRemaining: number | null,
 *   windowEnd: Date | null,
 *   eligible: boolean,
 *   reasonCodes: string[],
 * }>}
 */
export async function computeRefundEligibility(studentId, courseId) {
  const policy = await getRefundPolicyDoc();
  const reasonCodes = [];
  if (!policy.refundsEnabled) {
    reasonCodes.push("refunds_disabled");
  }

  const payment = await Payment.findOne({
    student: studentId,
    course: courseId,
    status: "succeeded",
  })
    .sort({ paidAt: -1 })
    .lean();

  if (!payment) {
    reasonCodes.push("no_succeeded_payment");
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  }).lean();

  if (!enrollment) {
    reasonCodes.push("not_enrolled");
  } else if (enrollment.status === "refunded") {
    reasonCodes.push("already_refunded");
  } else {
    const st = enrollment.status;
    const isActive = !st || st === "active" || st === "cancelled";
    if (st && !isActive) {
      reasonCodes.push("enrollment_inactive");
    }
  }

  const progress = await getProgressPercent(studentId, courseId);
  if (progress > policy.maxCompletionPercentForRefund) {
    reasonCodes.push("progress_too_high");
  }

  let daysRemaining = null;
  let windowEnd = null;
  if (payment?.paidAt) {
    const paid = new Date(payment.paidAt);
    windowEnd = new Date(paid.getTime() + policy.refundWindowDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    if (now > windowEnd) {
      reasonCodes.push("outside_window");
      daysRemaining = 0;
    } else {
      daysRemaining = Math.max(
        0,
        Math.ceil((windowEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
      );
    }
  } else {
    reasonCodes.push("no_payment_date");
  }

  const existingRequest = payment
    ? await RefundRequest.findOne({ payment: payment._id }).lean()
    : null;
  if (existingRequest) {
    reasonCodes.push("request_exists");
  }

  const blockers = new Set([
    "refunds_disabled",
    "no_succeeded_payment",
    "not_enrolled",
    "already_refunded",
    "enrollment_inactive",
    "progress_too_high",
    "outside_window",
    "no_payment_date",
    "request_exists",
  ]);
  const eligible = reasonCodes.filter((r) => blockers.has(r)).length === 0;

  return {
    policy,
    payment,
    enrollment,
    progress,
    existingRequest,
    daysRemaining: payment && windowEnd && daysRemaining != null ? daysRemaining : null,
    windowEnd: windowEnd || null,
    eligible,
    reasonCodes: [...new Set(reasonCodes)],
  };
}

export async function logRefundAction(refundRequestId, { action, actor, details, meta }) {
  await RefundAuditLog.create({
    refundRequest: refundRequestId,
    action,
    actor: actor || null,
    details: details || "",
    meta: meta || null,
  });
}

/**
 * Re-validates at processing (ignores duplicate request — that only applies to new submissions).
 */
export async function validateEligibilityForExecution(studentId, courseId, paymentId) {
  const policy = await getRefundPolicyDoc();
  const reasonCodes = [];
  if (!policy.refundsEnabled) reasonCodes.push("refunds_disabled");

  const payment = await Payment.findById(paymentId).lean();
  if (!payment) {
    return { ok: false, reasonCodes: ["no_payment"] };
  }
  if (String(payment.student) !== String(studentId) || String(payment.course) !== String(courseId)) {
    return { ok: false, reasonCodes: ["payment_mismatch"] };
  }
  if (payment.status === "refunded") {
    return { ok: false, reasonCodes: ["already_refunded"] };
  }
  if (payment.status !== "succeeded") {
    reasonCodes.push("payment_not_succeeded");
  }

  if (payment.paidAt) {
    const paid = new Date(payment.paidAt);
    const end = new Date(paid.getTime() + policy.refundWindowDays * 24 * 60 * 60 * 1000);
    if (new Date() > end) reasonCodes.push("outside_window");
  } else {
    reasonCodes.push("no_payment_date");
  }

  const enrollment = await Enrollment.findOne({ student: studentId, course: courseId }).lean();
  if (!enrollment) {
    reasonCodes.push("not_enrolled");
  } else if (enrollment.status === "refunded") {
    reasonCodes.push("already_refunded");
  } else {
    const st = enrollment.status;
    const isOk = !st || st === "active" || st === "cancelled";
    if (st && !isOk) reasonCodes.push("enrollment_inactive");
  }

  const progress = await getProgressPercent(studentId, courseId);
  if (progress > policy.maxCompletionPercentForRefund) {
    reasonCodes.push("progress_too_high");
  }

  const blockers = new Set([
    "refunds_disabled",
    "no_payment",
    "payment_mismatch",
    "payment_not_succeeded",
    "no_payment_date",
    "not_enrolled",
    "already_refunded",
    "enrollment_inactive",
    "progress_too_high",
    "outside_window",
  ]);
  const hard = reasonCodes.filter((r) => blockers.has(r));
  return { ok: hard.length === 0, reasonCodes: hard };
}

/**
 * @param {object} payment — Payment document (amount in major currency units, e.g. USD).
 * @param {object} refundRequest — RefundRequest with `refundPercent` 1–100.
 */
export async function executeGatewayRefund(payment, refundRequest) {
  const idempotencyKey = `refund_req_${String(refundRequest._id).slice(0, 24)}`;
  const major = Number(payment.amount) || 0;
  const pct = Math.min(100, Math.max(1, Math.round(Number(refundRequest.refundPercent) || 100)));
  const amountCents = Math.round(major * 100 * (pct / 100));
  const payload = {
    payment_intent: payment.stripePaymentIntentId,
    reason: "requested_by_customer",
  };
  if (pct < 100) {
    if (amountCents < 1) {
      throw new Error("Refund amount is too small (minimum 1 cent)");
    }
    payload.amount = amountCents;
  }
  // pct === 100: omit `amount` so Stripe refunds the full available balance (handles small rounding)
  return stripe.refunds.create(payload, { idempotencyKey });
}

/**
 * After Stripe success: mark payment, enrollment, request; audit; notify.
 */
export async function finalizeSuccessfulRefund(
  requestDoc,
  paymentDoc,
  stripeRefund,
) {
  const { student, course, _id: requestId } = requestDoc;

  await Payment.updateOne(
    { _id: paymentDoc._id },
    { $set: { status: "refunded" } },
  );

  await Enrollment.updateOne(
    { student, course, status: { $ne: "refunded" } },
    { $set: { status: "refunded" } },
  );

  await RefundRequest.updateOne(
    { _id: requestId },
    {
      $set: {
        status: "completed",
        stripeRefundId: stripeRefund?.id || null,
        decidedAt: new Date(),
        failureMessage: "",
      },
    },
  );

  await logRefundAction(requestId, {
    action: "refund_completed",
    actor: null,
    details: "Stripe refund succeeded; enrollment set to refunded.",
    meta: { stripeRefundId: stripeRefund?.id },
  });

  await notifySafe(() => onRefundCompleted({ studentId: String(student), courseId: String(course) }));
}

export async function runRefundExecution(refundRequestId, actorUserId) {
  const reqDoc = await RefundRequest.findById(refundRequestId)
    .populate("payment")
    .populate("student", "name email");
  if (!reqDoc) {
    return { ok: false, error: "Refund request not found" };
  }

  const st = reqDoc.status;
  if (st === "completed") {
    return { ok: true, skipped: true, message: "Already completed" };
  }
  if (st === "rejected") {
    return { ok: false, error: "Request was rejected" };
  }
  if (st === "processing") {
    return { ok: false, error: "Refund is already being processed" };
  }
  if (!["pending", "approved", "failed"].includes(st)) {
    return { ok: false, error: "Invalid status for processing" };
  }

  const payment = await Payment.findById(reqDoc.payment?._id || reqDoc.payment);
  if (!payment) {
    return { ok: false, error: "Payment not found" };
  }

  const studentId = String(reqDoc.student?._id || reqDoc.student);
  const courseId = String(reqDoc.course);

  const validation = await validateEligibilityForExecution(
    studentId,
    courseId,
    payment._id,
  );
  if (!validation.ok) {
    const msg = (validation.reasonCodes || []).join(", ");
    await RefundRequest.updateOne(
      { _id: reqDoc._id },
      { $set: { status: "failed", failureMessage: `No longer eligible: ${msg}`.slice(0, 2000) } },
    );
    await logRefundAction(reqDoc._id, {
      action: "refund_failed",
      actor: actorUserId || null,
      details: `Eligibility check failed: ${msg}`,
    });
    await notifySafe(() => onRefundFailed({ studentId, courseId, message: msg }));
    return { ok: false, error: "Eligibility no longer met", reasonCodes: validation.reasonCodes };
  }

  await RefundRequest.updateOne({ _id: reqDoc._id }, { $set: { status: "processing" } });
  await logRefundAction(reqDoc._id, {
    action: "refund_processing",
    actor: actorUserId || null,
    details: "Refund execution started (Stripe).",
  });

  try {
    const stripeRef = await executeGatewayRefund(payment, reqDoc);
    await finalizeSuccessfulRefund(reqDoc, payment, stripeRef);
    return { ok: true };
  } catch (err) {
    const em = err?.message || String(err);
    await RefundRequest.updateOne(
      { _id: reqDoc._id },
      { $set: { status: "failed", failureMessage: em.slice(0, 2000) } },
    );
    await logRefundAction(reqDoc._id, {
      action: "refund_failed",
      actor: actorUserId || null,
      details: em.slice(0, 2000),
    });
    await notifySafe(() =>
      onRefundFailed({ studentId, courseId, message: em }),
    );
    return { ok: false, error: em };
  }
}

export { getProgressPercent };
