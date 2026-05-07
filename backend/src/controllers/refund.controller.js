import Course from "../models/course.model.js";
import RefundRequest from "../models/refundRequest.model.js";
import {
  computeRefundEligibility,
  computeRefundAmountMajor,
  getRefundPolicyDoc,
  getPublicRefundPolicyPayload,
  logRefundAction,
  runRefundExecution,
} from "../services/refund.service.js";
import Payment from "../models/payment.model.js";
import { notifySafe, onRefundRequestSubmitted, onRefundRejected } from "../services/notification.service.js";

export const getPublicRefundPolicy = async (req, res) => {
  try {
    const policy = await getRefundPolicyDoc();
    return res.status(200).json(getPublicRefundPolicyPayload(policy));
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

export const getRefundEligibility = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;
    const data = await computeRefundEligibility(studentId, courseId);
    const course = await Course.findById(courseId).select("title").lean();

    return res.status(200).json({
      eligible: data.eligible,
      reasonCodes: data.reasonCodes,
      progress: data.progress,
      daysRemaining: data.daysRemaining,
      windowEnd: data.windowEnd ? data.windowEnd.toISOString() : null,
      policy: getPublicRefundPolicyPayload(data.policy),
      courseTitle: course?.title || "",
      existingRequest: data.existingRequest
        ? {
            _id: data.existingRequest._id,
            status: data.existingRequest.status,
            createdAt: data.existingRequest.createdAt,
            reason: data.existingRequest.reason,
            failureMessage: data.existingRequest.failureMessage,
            refundPercent: data.existingRequest.refundPercent,
            refundAmount: data.existingRequest.refundAmount,
          }
        : null,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

export const listMyRefundRequests = async (req, res) => {
  try {
    const studentId = req.user._id;
    const rows = await RefundRequest.find({ student: studentId })
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      requests: rows.map((r) => ({
        _id: r._id,
        status: r.status,
        course: r.course,
        refundAmount: r.refundAmount,
        currency: r.currency,
        reason: r.reason,
        failureMessage: r.failureMessage,
        refundPercent: r.refundPercent,
        refundAmount: r.refundAmount,
        createdAt: r.createdAt,
        decidedAt: r.decidedAt,
      })),
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

export const createRefundRequest = async (req, res) => {
  try {
    const { courseId, reason, refundPercent: bodyRefundPct } = req.body || {};
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const policy = await getRefundPolicyDoc();
    if (!policy.refundsEnabled) {
      return res.status(400).json({ message: "Refunds are not enabled" });
    }

    if (policy.refundReasonRequired) {
      const r = typeof reason === "string" ? reason.trim() : "";
      if (!r) {
        return res.status(400).json({ message: "A reason is required" });
      }
    }

    const el = await computeRefundEligibility(req.user._id, courseId);
    if (!el.payment) {
      return res.status(400).json({ message: "No eligible payment for this course" });
    }
    if (el.existingRequest) {
      return res.status(400).json({
        message: "A refund request already exists for this purchase",
        existingRequestId: el.existingRequest._id,
      });
    }
    if (!el.eligible) {
      return res.status(400).json({
        message: "Not eligible for a refund",
        reasonCodes: el.reasonCodes,
      });
    }

    let refundPercent = policy.refundPercent;
    if (bodyRefundPct != null && bodyRefundPct !== "") {
      const n = Number(bodyRefundPct);
      if (!Number.isFinite(n) || n < 1 || n > policy.refundPercent) {
        return res.status(400).json({
          message: `refundPercent must be between 1 and ${policy.refundPercent} (policy cap)`,
        });
      }
      refundPercent = Math.round(n);
    }
    const refundAmount = computeRefundAmountMajor(el.payment.amount, refundPercent);
    const progressAtRequest = el.progress;
    const reasonText =
      typeof reason === "string" ? reason.trim().slice(0, 4000) : "";

    const doc = await RefundRequest.create({
      student: req.user._id,
      course: courseId,
      payment: el.payment._id,
      status: policy.refundAutoApprove ? "approved" : "pending",
      refundAmount,
      refundPercent,
      currency: el.payment.currency || "usd",
      progressAtRequest,
      reason: reasonText,
    });

    await logRefundAction(doc._id, {
      action: "request_created",
      actor: req.user._id,
      details: policy.refundAutoApprove
        ? "Request created; automatic approval (gateway run next)."
        : "Pending admin review.",
    });

    const course = await Course.findById(courseId).select("title").lean();
    const courseTitle = course?.title || "Course";

    await notifySafe(() =>
      onRefundRequestSubmitted({
        studentId: req.user._id,
        courseId,
        courseTitle,
        needsReview: !policy.refundAutoApprove,
      }),
    );

    if (policy.refundAutoApprove) {
      const result = await runRefundExecution(doc._id, null);
      if (!result.ok && !result.skipped) {
        const fresh = await RefundRequest.findById(doc._id).lean();
        return res.status(201).json({
          message: "Refund request created; processing failed",
          request: fresh,
          processError: result.error,
        });
      }
    }

    const out = await RefundRequest.findById(doc._id).lean();
    return res.status(201).json({ message: "Refund request submitted", request: out });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ message: "A refund request already exists for this purchase" });
    }
    console.error("createRefundRequest:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const listAdminRefundRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status && String(status) !== "all") {
      q.status = String(status);
    }
    const rows = await RefundRequest.find(q)
      .populate("student", "name email")
      .populate("course", "title")
      .populate("payment", "amount stripePaymentIntentId paidAt status")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      requests: rows.map((r) => ({
        ...r,
        id: r._id,
      })),
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

export const getAdminRefundRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const RefundAuditLog = (await import("../models/refundAuditLog.model.js")).default;
    const r = await RefundRequest.findById(id)
      .populate("student", "name email")
      .populate("course", "title")
      .populate("payment")
      .populate("decidedBy", "name email")
      .lean();
    if (!r) {
      return res.status(404).json({ message: "Refund request not found" });
    }
    const logs = await RefundAuditLog.find({ refundRequest: id })
      .populate("actor", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ request: r, auditLogs: logs });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

export const updateAdminRefundRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, internalNotes, rejectionNote, refundPercent: bodyRefundPercent } = req.body || {};
    const reqDoc = await RefundRequest.findById(id);
    if (!reqDoc) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    if (internalNotes !== undefined && internalNotes !== null) {
      const t = String(internalNotes).slice(0, 8000);
      reqDoc.internalNotes = t;
      await reqDoc.save();
      await logRefundAction(id, {
        action: "internal_notes_updated",
        actor: req.user._id,
        details: "Internal notes updated.",
      });
    }

    if (action === "add_note") {
      const out = await RefundRequest.findById(id).lean();
      return res.status(200).json({ request: out });
    }

    if (action === "reject") {
      if (reqDoc.status !== "pending") {
        return res.status(400).json({ message: "Can only reject a pending request" });
      }
      reqDoc.status = "rejected";
      reqDoc.decidedBy = req.user._id;
      reqDoc.decidedAt = new Date();
      if (rejectionNote) {
        reqDoc.internalNotes = [reqDoc.internalNotes, `Rejection: ${rejectionNote}`].filter(Boolean).join("\n");
      }
      await reqDoc.save();
      await logRefundAction(id, {
        action: "request_rejected",
        actor: req.user._id,
        details: rejectionNote || "Rejected by admin",
      });
      const course = await Course.findById(reqDoc.course).select("title").lean();
      await notifySafe(() =>
        onRefundRejected({
          studentId: String(reqDoc.student),
          courseId: String(reqDoc.course),
          courseTitle: course?.title,
        }),
      );
      return res.status(200).json({ request: await RefundRequest.findById(id).lean() });
    }

    if (action === "approve" || action === "retry" || action === "process") {
      if (reqDoc.status === "completed") {
        return res.status(400).json({ message: "Already completed" });
      }
      if (reqDoc.status === "rejected") {
        return res.status(400).json({ message: "Request was rejected" });
      }
      if (bodyRefundPercent != null && bodyRefundPercent !== "") {
        const policy = await getRefundPolicyDoc();
        const n = Number(bodyRefundPercent);
        if (!Number.isFinite(n) || n < 1 || n > policy.refundPercent) {
          return res.status(400).json({ message: `refundPercent must be 1–${policy.refundPercent}` });
        }
        const pay = await Payment.findById(reqDoc.payment);
        if (!pay) {
          return res.status(400).json({ message: "Payment not found" });
        }
        const rounded = Math.round(n);
        reqDoc.refundPercent = rounded;
        reqDoc.refundAmount = computeRefundAmountMajor(pay.amount, rounded);
        await reqDoc.save();
      }
      if (action === "approve" && reqDoc.status !== "pending") {
        return res.status(400).json({ message: "Can only approve pending requests" });
      }
      if (action === "retry" && reqDoc.status !== "failed") {
        return res.status(400).json({ message: "Retry is only for failed processing" });
      }
      if (action === "process" && !["pending", "failed", "processing", "approved"].includes(reqDoc.status)) {
        return res.status(400).json({ message: "Cannot process this request" });
      }

      const shouldMarkApproved =
        (action === "approve" || (action === "process" && reqDoc.status === "pending")) &&
        reqDoc.status === "pending";
      if (shouldMarkApproved) {
        reqDoc.status = "approved";
        reqDoc.decidedBy = req.user._id;
        reqDoc.decidedAt = new Date();
        await reqDoc.save();
        await logRefundAction(id, {
          action: "request_approved",
          actor: req.user._id,
          details: "Approved for gateway refund",
        });
      }

      const result = await runRefundExecution(id, req.user._id);
      const fresh = await RefundRequest.findById(id)
        .populate("student", "name email")
        .populate("course", "title")
        .lean();
      if (!result.ok) {
        return res.status(200).json({
          request: fresh,
          processWarning: result.error,
          processOk: false,
        });
      }
      return res.status(200).json({ request: fresh, processOk: true });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (e) {
    console.error("updateAdminRefundRequest:", e);
    return res.status(500).json({ message: e.message });
  }
};
