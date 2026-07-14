import mongoose from "mongoose";
import Coupon from "../models/coupon.model.js";
import CouponRedemption from "../models/couponRedemption.model.js";

/**
 * Record a successful coupon use (idempotent on `redemptionKey` for Stripe webhook retries).
 */
export async function recordSuccessfulCouponRedemption({
  redemptionKey,
  studentId,
  courseId,
  couponId,
  discountAmount = 0,
}) {
  if (!couponId || !redemptionKey) return;

  let cid;
  try {
    cid = new mongoose.Types.ObjectId(couponId);
  } catch {
    return;
  }

  try {
    await CouponRedemption.create({
      coupon: cid,
      student: new mongoose.Types.ObjectId(String(studentId)),
      course: new mongoose.Types.ObjectId(String(courseId)),
      redemptionKey: String(redemptionKey),
      discountAmount: Math.max(0, Number(discountAmount) || 0),
    });
    await Coupon.updateOne({ _id: cid }, { $inc: { redeemedCount: 1 } });
  } catch (e) {
    if (e?.code === 11000) return;
    console.error("recordSuccessfulCouponRedemption:", e?.message);
  }
}
