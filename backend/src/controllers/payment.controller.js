import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import {
  notifySafe,
  onCourseEnrolledFromPayment,
} from "../services/notification.service.js";

import Stripe from "stripe";
import mongoose from "mongoose";
import { computeEffectivePrice, MIN_CHECKOUT_PRICE_USD } from "../lib/coursePricing.js";
import {
  normalizeCouponCode,
  validateCouponForCheckout,
} from "../lib/couponCheckout.js";
import { recordSuccessfulCouponRedemption } from "../services/couponRedemption.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** Same rules as catalog: only published, non-deleted courses accept payment / enrollment. */
function courseIsOpenForEnrollment(course) {
  return (
    course &&
    course.isDeleted !== true &&
    course.isPublished === true &&
    course.status === "published"
  );
}

async function isStudentRole(userId) {
  const user = await User.findById(userId).select("role").lean();
  return user?.role === "student";
}

/**
 * Persist Payment + Enrollment from a succeeded Stripe PaymentIntent (idempotent).
 * Used by webhook and by POST /sync-payment-intent when webhooks don't reach localhost.
 */
export async function applySuccessfulPaymentIntent(paymentIntent) {
  const { studentId, courseId } = paymentIntent.metadata || {};
  const couponIdRaw = paymentIntent.metadata?.couponId;
  const couponCodeSnap = paymentIntent.metadata?.couponCode || "";
  const couponDiscountRaw = paymentIntent.metadata?.couponDiscountAmount;
  const couponDiscountAmount = Math.max(
    0,
    Number(couponDiscountRaw) || 0,
  );
  if (!studentId || !courseId) {
    return { ok: false, reason: "missing_metadata" };
  }
  if (!(await isStudentRole(studentId))) {
    return { ok: false, reason: "only_students_can_enroll" };
  }

  const courseForPi = await Course.findById(courseId).select(
    "isDeleted isPublished status",
  );
  if (!courseIsOpenForEnrollment(courseForPi)) {
    return { ok: false, reason: "course_not_available" };
  }

  const paidAt = new Date((paymentIntent.created || 0) * 1000);

  let couponRef = null;
  if (couponIdRaw && mongoose.isValidObjectId(couponIdRaw)) {
    couponRef = new mongoose.Types.ObjectId(couponIdRaw);
  }

  try {
    const cents = paymentIntent.amount_received ?? paymentIntent.amount ?? 0;
    const amountMajor = Math.round(Number(cents)) / 100;
    const latestCharge = paymentIntent.latest_charge;
    const chargeId =
      typeof latestCharge === "string"
        ? latestCharge
        : latestCharge?.id ?? null;

    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      {
        $set: {
          student: studentId,
          course: courseId,
          amount: amountMajor,
          currency: (paymentIntent.currency || "usd").toLowerCase(),
          status: "succeeded",
          stripeChargeId: chargeId,
          paidAt,
          coupon: couponRef,
          couponCodeSnapshot: couponCodeSnap,
          couponDiscountAmount,
        },
      },
      { upsert: true, new: true },
    );
  } catch (payErr) {
    console.error("applySuccessfulPaymentIntent payment error:", payErr.message);
    return { ok: false, reason: payErr.message };
  }

  try {
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: "active",
    });
    if (!existingEnrollment) {
      await Enrollment.create({
        student: studentId,
        course: courseId,
        status: "active",
        refundPolicyAcceptedAt: paidAt,
      });
    }
  } catch (enrErr) {
    console.error("applySuccessfulPaymentIntent enrollment error:", enrErr.message);
    return { ok: false, reason: enrErr.message };
  }

  notifySafe(() => onCourseEnrolledFromPayment({ studentId, courseId }));

  if (couponRef) {
    await recordSuccessfulCouponRedemption({
      redemptionKey: paymentIntent.id,
      studentId,
      courseId,
      couponId: couponRef,
      discountAmount: couponDiscountAmount,
    });
  }

  return { ok: true };
}

/**
 * After admin approves a manual (bank/wallet) payment: persist Payment + enrollment
 * (idempotent on synthetic `manual_<orderId>`), same high-level outcome as Stripe success.
 * @param {import("mongoose").Document | object} order - ManualPaymentOrder with student, course, amount, currency, _id
 */
export async function finalizeManualPaymentEnrollment(order) {
  const studentId = order.student?._id ?? order.student;
  const courseId = order.course?._id ?? order.course;
  const orderId = order._id;
  if (!(await isStudentRole(studentId))) {
    return { ok: false, reason: "only_students_can_enroll" };
  }

  const courseForPi = await Course.findById(courseId).select("isDeleted isPublished status");
  if (!courseIsOpenForEnrollment(courseForPi)) {
    return { ok: false, reason: "course_not_available" };
  }

  const syntheticId = `manual_${orderId}`;

  const existingPay = await Payment.findOne({ stripePaymentIntentId: syntheticId }).lean();
  if (existingPay) {
    const policyAt =
      existingPay?.paidAt != null ? new Date(existingPay.paidAt) : new Date();
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: "active",
    });
    if (!existingEnrollment) {
      await Enrollment.create({
        student: studentId,
        course: courseId,
        status: "active",
        refundPolicyAcceptedAt: policyAt,
      });
      notifySafe(() => onCourseEnrolledFromPayment({ studentId, courseId }));
    }
    return { ok: true, idempotent: true };
  }

  const paidNow = new Date();

  try {
    await Payment.create({
      student: studentId,
      course: courseId,
      amount: Number(order.amount),
      currency: (order.currency || "usd").toLowerCase(),
      status: "succeeded",
      stripePaymentIntentId: syntheticId,
      stripeChargeId: null,
      paidAt: paidNow,
      provider: "manual",
      manualOrder: orderId,
      clientIp: null,
      coupon: order.coupon && mongoose.isValidObjectId(order.coupon) ? order.coupon : null,
      couponCodeSnapshot: typeof order.couponCodeSnapshot === "string" ? order.couponCodeSnapshot : "",
      couponDiscountAmount: Math.max(0, Number(order.couponDiscountAmount) || 0),
    });
  } catch (e) {
    if (e?.code === 11000) {
      const dup = await Payment.findOne({ stripePaymentIntentId: syntheticId }).lean();
      if (dup) {
        const existingEnrollment = await Enrollment.findOne({
          student: studentId,
          course: courseId,
          status: "active",
        });
        if (!existingEnrollment) {
          const payAt = dup?.paidAt != null ? new Date(dup.paidAt) : new Date();
          await Enrollment.create({
            student: studentId,
            course: courseId,
            status: "active",
            refundPolicyAcceptedAt: payAt,
          });
          notifySafe(() => onCourseEnrolledFromPayment({ studentId, courseId }));
        }
        return { ok: true, idempotent: true };
      }
    }
    console.error("finalizeManualPaymentEnrollment payment error:", e.message);
    return { ok: false, reason: e.message };
  }

  try {
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: "active",
    });
    if (!existingEnrollment) {
      await Enrollment.create({
        student: studentId,
        course: courseId,
        status: "active",
        refundPolicyAcceptedAt: paidNow,
      });
    }
  } catch (enrErr) {
    console.error("finalizeManualPaymentEnrollment enrollment error:", enrErr.message);
    return { ok: false, reason: enrErr.message };
  }

  notifySafe(() => onCourseEnrolledFromPayment({ studentId, courseId }));

  const orderCouponId = order.coupon?._id ?? order.coupon;
  if (orderCouponId && mongoose.isValidObjectId(orderCouponId)) {
    await recordSuccessfulCouponRedemption({
      redemptionKey: syntheticId,
      studentId,
      courseId,
      couponId: orderCouponId,
      discountAmount: Math.max(0, Number(order.couponDiscountAmount) || 0),
    });
  }

  return { ok: true };
}

/**
 * Client-triggered sync when Stripe Dashboard shows "paid" but webhook did not run (common on localhost).
 */
export const syncPaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId } = req.body || {};
    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId is required" });
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== "succeeded") {
      return res.status(400).json({
        message: `PaymentIntent is ${pi.status}, not succeeded`,
      });
    }

    const sid = pi.metadata?.studentId;
    const cid = pi.metadata?.courseId;
    if (!sid || !cid) {
      return res.status(400).json({
        message: "PaymentIntent is missing studentId/courseId metadata",
      });
    }

    const isOwner = String(req.user._id) === String(sid);
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await applySuccessfulPaymentIntent(pi);
    if (!result.ok) {
      const msg =
        result.reason === "course_not_available"
          ? "This course is not available for enrollment"
          : result.reason === "only_students_can_enroll"
            ? "Only student accounts can be enrolled in courses"
          : result.reason || "Could not save payment";
      return res.status(400).json({ message: msg });
    }

    return res.status(200).json({ ok: true, message: "Payment synced" });
  } catch (error) {
    console.error("syncPaymentIntent:", error);
    return res.status(500).json({ message: error.message || "Sync failed" });
  }
};

export const paymentIntent = async (req, res) => {
  try {
    const studentId = req.user._id;
    if (req.user?.role !== "student") {
      return res.status(403).json({
        message: "Only student accounts can enroll in courses",
      });
    }

    const { courseId, couponCode } = req.body || {};

    if (!courseId || !studentId) {
      return res.status(400).json({ message: "Missing required IDs" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!courseIsOpenForEnrollment(course)) {
      return res.status(400).json({
        message: "This course is not available for enrollment",
      });
    }

    const alreadyEnrolled = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: "active",
    });
    if (alreadyEnrolled) {
      return res.status(400).json({
        message: "You are already enrolled in this course",
      });
    }

    const coursePlain = course.toObject ? course.toObject() : course;
    const { effectivePrice } = computeEffectivePrice(coursePlain);
    if (!Number.isFinite(effectivePrice) || effectivePrice === 0) {
      return res.status(400).json({
        message: "This course is free or has no charge. Use the free enrollment button instead of card payment.",
        code: "FREE_COURSE",
      });
    }
    const minCents = Math.round(MIN_CHECKOUT_PRICE_USD * 100);

    let chargeMajor = effectivePrice;
    let couponMeta = {};
    const trimmedCoupon = normalizeCouponCode(couponCode);
    if (trimmedCoupon) {
      const v = await validateCouponForCheckout({
        code: trimmedCoupon,
        courseId,
        studentId,
      });
      if (!v.ok) {
        return res.status(400).json({ message: v.message });
      }
      chargeMajor = v.finalPrice;
      couponMeta = {
        couponId: String(v.coupon._id),
        couponCode: String(v.coupon.code || trimmedCoupon),
        couponDiscountAmount: String(v.discountAmount ?? 0),
      };
    }

    const amount = Math.round(Number(chargeMajor) * 100);
    if (!Number.isFinite(amount) || amount < minCents) {
      return res.status(400).json({
        message: "This course is not available for card checkout at the current price.",
        code: "INVALID_CHECKOUT_AMOUNT",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        studentId: String(studentId),
        courseId: String(courseId),
        ...couponMeta,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amountUsd: chargeMajor,
      couponApplied: Boolean(trimmedCoupon),
    });
  } catch (error) {
    console.error("paymentIntent:", error.type, error.message);
    res.status(500).json({ message: error.message });
  }
};

/** Student self-serve: enroll when admin marked the course as free ($0, no Stripe/manual). */
export const enrollFreeCourse = async (req, res) => {
  try {
    const studentId = req.user._id;
    if (req.user?.role !== "student") {
      return res.status(403).json({
        message: "Only student accounts can enroll in courses",
      });
    }

    const { courseId } = req.body || {};
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const course = await Course.findById(courseId)
      .select("isDeleted isPublished status isFree price promotion")
      .lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (!courseIsOpenForEnrollment(course)) {
      return res.status(400).json({
        message: "This course is not available for enrollment",
      });
    }
    if (course.isFree !== true) {
      return res.status(400).json({ message: "This course is not marked as free." });
    }

    const { effectivePrice } = computeEffectivePrice(course);
    if (!Number.isFinite(effectivePrice) || effectivePrice !== 0) {
      return res.status(400).json({ message: "This course is not free right now." });
    }

    const alreadyEnrolled = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: "active",
    });
    if (alreadyEnrolled) {
      return res.status(200).json({ enrolled: true, alreadyEnrolled: true });
    }

    const syntheticId = `free_${courseId}_${studentId}`;
    const paidNow = new Date();

    try {
      await Payment.create({
        student: studentId,
        course: courseId,
        amount: 0,
        currency: "usd",
        status: "succeeded",
        stripePaymentIntentId: syntheticId,
        stripeChargeId: null,
        paidAt: paidNow,
        provider: "free",
        manualOrder: null,
        clientIp: null,
        coupon: null,
        couponCodeSnapshot: "",
        couponDiscountAmount: 0,
      });
    } catch (e) {
      if (e?.code === 11000) {
        const dup = await Payment.findOne({ stripePaymentIntentId: syntheticId }).lean();
        if (dup) {
          const existingEnrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
            status: "active",
          });
          if (!existingEnrollment) {
            const payAt = dup?.paidAt != null ? new Date(dup.paidAt) : new Date();
            await Enrollment.create({
              student: studentId,
              course: courseId,
              status: "active",
              refundPolicyAcceptedAt: payAt,
            });
            notifySafe(() => onCourseEnrolledFromPayment({ studentId, courseId }));
          }
          return res.status(200).json({ enrolled: true });
        }
      }
      console.error("enrollFreeCourse payment error:", e.message);
      return res.status(500).json({ message: e.message || "Could not record enrollment" });
    }

    try {
      await Enrollment.create({
        student: studentId,
        course: courseId,
        status: "active",
        refundPolicyAcceptedAt: paidNow,
      });
    } catch (enrErr) {
      console.error("enrollFreeCourse enrollment error:", enrErr.message);
      return res.status(500).json({ message: enrErr.message || "Could not enroll" });
    }

    notifySafe(() => onCourseEnrolledFromPayment({ studentId, courseId }));

    return res.status(200).json({ enrolled: true });
  } catch (error) {
    console.error("enrollFreeCourse:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const enrollatcourse = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (student.role !== "student") {
      return res.status(400).json({ message: "Only users with student role can be enrolled" });
    }

    const exists = await Enrollment.findOne({
      course: courseId,
      student: studentId,
      status: "active",
    });
    if (exists) return res.status(400).json({ message: "Student already enrolled" });

    const enrollment = await Enrollment.create({
      course: courseId,
      student: studentId,
      status: "active",
    });

    res.status(201).json({ message: "Enrollment successful", enrollment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Admin: enroll many students in one course.
 * Body: { studentIds: string[] }
 * Response: { enrolled, skipped }
 */
export const bulkEnrollAtCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const raw = req.body?.studentIds;

    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(400).json({ message: "studentIds must be a non-empty array" });
    }

    const studentIds = [...new Set(raw.map(String).filter(Boolean))];

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const validStudents = await User.find({
      _id: { $in: studentIds },
      role: "student",
    })
      .select("_id")
      .lean();
    const validStudentIds = validStudents.map((u) => String(u._id));

    const existingEnrollments = await Enrollment.find({
      course: courseId,
      student: { $in: validStudentIds },
    }).select("student");

    const alreadySet = new Set(existingEnrollments.map((e) => e.student.toString()));
    const toEnroll = validStudentIds.filter((id) => !alreadySet.has(id));
    const nonStudentCount = studentIds.length - validStudentIds.length;

    if (toEnroll.length > 0) {
      await Enrollment.insertMany(
        toEnroll.map((id) => ({ course: courseId, student: id, status: "active" })),
        { ordered: false },
      );
    }

    res.status(200).json({
      enrolled: toEnroll.length,
      skipped: studentIds.length - toEnroll.length,
      skippedNonStudents: nonStudentCount,
    });
  } catch (error) {
    console.error("bulkEnrollAtCourse:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const checkenrollment = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const isAdmin = req.user?.role === "admin";
    const isSelf = String(req.user?._id) === String(studentId);

    if (!isAdmin && req.user?.role !== "student") {
      return res.status(403).json({ enrolled: false, message: "Forbidden" });
    }

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ enrolled: false, message: "Forbidden" });
    }

    const targetUser = await User.findById(studentId).select("role").lean();
    if (!targetUser || targetUser.role !== "student") {
      return res.json({ enrolled: false });
    }

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: "active",
    });

    if (enrollment) {
      return res.json({ enrolled: true, status: enrollment.status });
    } else {
      return res.json({ enrolled: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ enrolled: false, message: "Server error" });
  }
};

/**
 * Admin: financial summary for one course from persisted Payment documents.
 */
export const getCoursePayments = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select("_id");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const rows = await Payment.find({
      course: courseId,
      status: "succeeded",
    })
      .populate("student", "name")
      .sort({ paidAt: -1 })
      .lean();

    const totalRevenue = rows.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const currency = rows[0]?.currency || "usd";

    const payments = rows.map((p) => ({
      paymentIntentId: p.stripePaymentIntentId,
      studentId: p.student?._id || p.student,
      studentName: p.student?.name || "Unknown student",
      date: p.paidAt ? new Date(p.paidAt).toISOString() : null,
      amount: p.amount,
      currency: p.currency || currency,
      status: p.status,
    }));

    return res.status(200).json({
      totalRevenue,
      currency,
      payments,
      source: "database",
    });
  } catch (error) {
    console.error("getCoursePayments:", error);
    return res.status(500).json({
      message: error.message || "Failed to load payments",
    });
  }
};

/**
 * Admin: recent payments across all courses (finance overview).
 */
export const getAdminFinancePayments = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    const rows = await Payment.find({ status: "succeeded" })
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ paidAt: -1 })
      .limit(limit)
      .lean();

    const payments = rows.map((p) => ({
      _id: p._id,
      paymentIntentId: p.stripePaymentIntentId,
      studentName: p.student?.name || "—",
      studentEmail: p.student?.email || "",
      courseTitle: p.course?.title || "—",
      courseId: p.course?._id || p.course,
      amount: p.amount,
      currency: p.currency,
      paidAt: p.paidAt,
    }));

    return res.status(200).json({ payments });
  } catch (error) {
    console.error("getAdminFinancePayments:", error);
    return res.status(500).json({
      message: error.message || "Failed to load finance data",
    });
  }
};