import mongoose from "mongoose";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Payment from "../models/payment.model.js";
import Enrollment from "../models/enrollment.model.js";
import RefundRequest from "../models/refundRequest.model.js";
import ManualPaymentOrder from "../models/manualPaymentOrder.model.js";
import { attachPricingToCourseDoc } from "../lib/coursePricing.js";
import { sendCsv } from "../lib/csv.js";

function iso(d) {
  if (!d) return "";
  try {
    return new Date(d).toISOString();
  } catch {
    return "";
  }
}

/** Directory snapshot: accounts and lifecycle — ops & compliance. */
export const exportUsersCsv = async (req, res) => {
  try {
    const users = await User.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    })
      .select("name email role status isDeleted emailVerified lastLogin createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "user_id",
      "name",
      "email",
      "role",
      "account_status",
      "email_verified",
      "archived",
      "last_login",
      "created_at",
    ];
    const rows = users.map((u) => [
      String(u._id),
      u.name,
      u.email,
      u.role,
      u.status || "active",
      u.emailVerified !== false ? "yes" : "no",
      u.isDeleted ? "yes" : "no",
      iso(u.lastLogin),
      iso(u.createdAt),
    ]);

    return sendCsv(res, "users", headers, rows);
  } catch (e) {
    console.error("exportUsersCsv:", e);
    return res.status(500).json({ message: e.message || "Export failed" });
  }
};

/** Catalog snapshot: visibility, pricing, ownership — planning & audits. */
export const exportCoursesCsv = async (req, res) => {
  try {
    const courses = await Course.find({ isDeleted: { $ne: true } })
      .populate("teacher", "name email")
      .sort({ updatedAt: -1 })
      .lean();

    const headers = [
      "course_id",
      "title",
      "category",
      "status",
      "is_published",
      "list_price",
      "effective_price",
      "promotion_active",
      "instructor_name",
      "instructor_email",
      "updated_at",
    ];
    const rows = courses.map((c) => {
      const p = attachPricingToCourseDoc(c);
      return [
        String(c._id),
        c.title || "",
        c.category || "",
        c.status || "",
        c.isPublished ? "yes" : "no",
        typeof p.listPrice === "number" && !Number.isNaN(p.listPrice) ? p.listPrice : "",
        typeof p.effectivePrice === "number" && !Number.isNaN(p.effectivePrice)
          ? p.effectivePrice
          : "",
        p.promotionActive ? "yes" : "no",
        c.teacher?.name || "",
        c.teacher?.email || "",
        iso(c.updatedAt),
      ];
    });

    return sendCsv(res, "courses", headers, rows);
  } catch (e) {
    console.error("exportCoursesCsv:", e);
    return res.status(500).json({ message: e.message || "Export failed" });
  }
};

/** Successful settlements — ties to finance dashboard & bookkeeping. Optional ?courseId= for one course. */
export const exportPaymentsCsv = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5000, 50_000);
    const { courseId } = req.query;

    const q = { status: "succeeded" };
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "Invalid courseId" });
      }
      q.course = courseId;
    }

    const rows = await Payment.find(q)
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ paidAt: -1 })
      .limit(limit)
      .lean();

    const headers = [
      "payment_id",
      "provider",
      "payment_reference",
      "course_id",
      "course_title",
      "student_id",
      "student_name",
      "student_email",
      "amount",
      "currency",
      "paid_at",
    ];
    const data = rows.map((p) => [
      String(p._id),
      p.provider === "manual" ? "manual" : "stripe",
      p.stripePaymentIntentId || "",
      String(p.course?._id || p.course || ""),
      p.course?.title || "",
      String(p.student?._id || p.student || ""),
      p.student?.name || "",
      p.student?.email || "",
      Number(p.amount),
      p.currency || "usd",
      iso(p.paidAt),
    ]);

    const baseName = courseId ? `payments-course-${courseId}` : "payments";
    return sendCsv(res, baseName, headers, data);
  } catch (e) {
    console.error("exportPaymentsCsv:", e);
    return res.status(500).json({ message: e.message || "Export failed" });
  }
};

/** Who has access to what — support & roster; optional filter by course. */
export const exportEnrollmentsCsv = async (req, res) => {
  try {
    const { courseId } = req.query;
    const q = {};
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "Invalid courseId" });
      }
      q.course = courseId;
    }

    const rows = await Enrollment.find(q)
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ enrolledAt: -1 })
      .limit(50_000)
      .lean();

    const headers = [
      "enrollment_id",
      "course_id",
      "course_title",
      "student_id",
      "student_name",
      "student_email",
      "enrollment_status",
      "enrolled_at",
    ];
    const data = rows.map((e) => [
      String(e._id),
      String(e.course?._id || e.course || ""),
      e.course?.title || "",
      String(e.student?._id || e.student || ""),
      e.student?.name || "",
      e.student?.email || "",
      e.status || "active",
      iso(e.enrolledAt),
    ]);

    const baseName = courseId ? `enrollments-course-${courseId}` : "enrollments";
    return sendCsv(res, baseName, headers, data);
  } catch (e) {
    console.error("exportEnrollmentsCsv:", e);
    return res.status(500).json({ message: e.message || "Export failed" });
  }
};

/** Refund pipeline — matches Admin → Refunds workflow. */
export const exportRefundsCsv = async (req, res) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status && String(status) !== "all") {
      q.status = String(status);
    }

    const rows = await RefundRequest.find(q)
      .populate("student", "name email")
      .populate("course", "title")
      .populate("payment", "amount stripePaymentIntentId paidAt currency status provider")
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const headers = [
      "refund_request_id",
      "status",
      "student_email",
      "course_title",
      "refund_amount",
      "refund_percent",
      "currency",
      "payment_reference",
      "payment_provider",
      "stripe_refund_id",
      "failure_message",
      "reason_excerpt",
      "created_at",
      "decided_at",
    ];
    const data = rows.map((r) => [
      String(r._id),
      r.status,
      r.student?.email || "",
      r.course?.title || "",
      Number(r.refundAmount),
      Number(r.refundPercent),
      r.currency || "usd",
      r.payment?.stripePaymentIntentId || "",
      r.payment?.provider === "manual" ? "manual" : "stripe",
      r.stripeRefundId || "",
      (r.failureMessage || "").slice(0, 500),
      (r.reason || "").slice(0, 300),
      iso(r.createdAt),
      iso(r.decidedAt),
    ]);

    return sendCsv(res, "refund-requests", headers, data);
  } catch (e) {
    console.error("exportRefundsCsv:", e);
    return res.status(500).json({ message: e.message || "Export failed" });
  }
};

/** Offline payment verification queue — matches Manual payments admin. */
export const exportManualPaymentsCsv = async (req, res) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status && String(status) !== "all") {
      q.status = String(status);
    }

    const rows = await ManualPaymentOrder.find(q)
      .populate("student", "name email")
      .populate("course", "title")
      .populate("paymentMethod", "name accountNumber accountHolder")
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean();

    const headers = [
      "order_id",
      "order_number",
      "status",
      "student_email",
      "course_title",
      "amount",
      "currency",
      "method_name",
      "pay_to_account",
      "transaction_ref",
      "sender_name",
      "payment_date",
      "submitted_at",
      "approved_at",
      "rejection_note_excerpt",
    ];
    const data = rows.map((o) => [
      String(o._id),
      o.orderNumber,
      o.status,
      o.student?.email || "",
      o.course?.title || "",
      Number(o.amount),
      o.currency || "usd",
      o.paymentMethod?.name || "",
      o.paymentMethod?.accountNumber || "",
      o.transactionRef || "",
      o.senderName || "",
      iso(o.paymentDate),
      iso(o.submittedAt),
      iso(o.approvedAt),
      (o.rejectionReason || "").slice(0, 200),
    ]);

    return sendCsv(res, "manual-payment-orders", headers, data);
  } catch (e) {
    console.error("exportManualPaymentsCsv:", e);
    return res.status(500).json({ message: e.message || "Export failed" });
  }
};

