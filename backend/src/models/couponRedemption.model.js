import mongoose from "mongoose";

/**
 * One row per successful checkout (Stripe PI id or manual order id) — idempotent for webhooks.
 */
const couponRedemptionSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    /** Stripe PaymentIntent id or `manual_<ManualPaymentOrder._id>` */
    redemptionKey: { type: String, required: true, unique: true, index: true },
    /** Post-promotion price minus final charged amount (major currency units). */
    discountAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

couponRedemptionSchema.index({ coupon: 1, student: 1 });

export default mongoose.model("CouponRedemption", couponRedemptionSchema);
