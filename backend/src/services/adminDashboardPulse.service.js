import Enrollment from "../models/enrollment.model.js";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import ManualPaymentOrder from "../models/manualPaymentOrder.model.js";
import RefundRequest from "../models/refundRequest.model.js";

const RECENT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_EVENTS = 6;

function pushEvent(bucket, event) {
  if (!event?.at) return;
  bucket.push(event);
}

/**
 * Lightweight “what’s new” feed for the admin dashboard.
 */
export async function buildAdminDashboardPulse() {
  const since = new Date(Date.now() - RECENT_WINDOW_MS);

  const [
    pendingManualPayments,
    pendingRefunds,
    recentEnrollments,
    recentPayments,
    recentRefunds,
    recentManualOrders,
    recentUsers,
  ] = await Promise.all([
    ManualPaymentOrder.countDocuments({ status: "awaiting_verification" }),
    RefundRequest.countDocuments({ status: "pending" }),
    Enrollment.find({ status: "active", enrolledAt: { $gte: since } })
      .sort({ enrolledAt: -1 })
      .limit(4)
      .populate("student", "name")
      .populate("course", "title")
      .lean(),
    Payment.find({ status: "succeeded", paidAt: { $gte: since } })
      .sort({ paidAt: -1 })
      .limit(3)
      .populate("student", "name")
      .populate("course", "title")
      .lean(),
    RefundRequest.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("student", "name")
      .populate("course", "title")
      .lean(),
    ManualPaymentOrder.find({
      status: "awaiting_verification",
      updatedAt: { $gte: since },
    })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate("student", "name")
      .populate("course", "title")
      .lean(),
    User.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(2)
      .select("name role createdAt")
      .lean(),
  ]);

  const events = [];

  for (const row of recentEnrollments) {
    pushEvent(events, {
      id: `enrollment-${row._id}`,
      type: "enrollment",
      at: row.enrolledAt,
      label: `${row.student?.name || "Student"} enrolled in ${row.course?.title || "a course"}`,
      courseId: row.course?._id ? String(row.course._id) : null,
    });
  }

  for (const row of recentPayments) {
    pushEvent(events, {
      id: `payment-${row._id}`,
      type: "payment",
      at: row.paidAt,
      label: `Payment · ${row.course?.title || "Course"} · $${Number(row.amount || 0).toFixed(0)}`,
      courseId: row.course?._id ? String(row.course._id) : null,
    });
  }

  for (const row of recentRefunds) {
    pushEvent(events, {
      id: `refund-${row._id}`,
      type: "refund",
      at: row.createdAt,
      label:
        row.status === "pending"
          ? `Refund request · ${row.student?.name || "Student"} · ${row.course?.title || "Course"}`
          : `Refund ${row.status} · ${row.course?.title || "Course"}`,
      courseId: row.course?._id ? String(row.course._id) : null,
    });
  }

  for (const row of recentManualOrders) {
    pushEvent(events, {
      id: `manual-${row._id}`,
      type: "manual_payment",
      at: row.updatedAt || row.createdAt,
      label: `Manual payment proof · ${row.student?.name || "Student"} · ${row.course?.title || "Course"}`,
      courseId: row.course?._id ? String(row.course._id) : null,
    });
  }

  for (const row of recentUsers) {
    pushEvent(events, {
      id: `signup-${row._id}`,
      type: "signup",
      at: row.createdAt,
      label: `New ${row.role || "user"} · ${row.name || "Account"}`,
      userId: String(row._id),
    });
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    pendingManualPayments,
    pendingRefunds,
    recentActivity: events.slice(0, MAX_EVENTS),
  };
}
