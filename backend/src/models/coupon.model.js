import mongoose from "mongoose";

/**
 * Checkout coupons — applied server-side after course list price + optional built-in promotion.
 * Empty `courseIds` = valid for any published course checkout.
 */
const couponSchema = new mongoose.Schema(
  {
    /** Uppercase, no surrounding spaces (normalized on save). */
    code: { type: String, required: true, unique: true, index: true, maxlength: 40 },
    description: { type: String, default: "", maxlength: 500 },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
    },
    /** Percent 0–100 or fixed USD amount off the post-promotion price. */
    value: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true, index: true },
    /** null / omit = unlimited redemptions. */
    maxRedemptions: { type: Number, default: null, min: 1 },
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },
    /** Empty = all courses; otherwise must include checkout course id. */
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    /** If true, each student can redeem this coupon at most once (any course). */
    oncePerUser: { type: Boolean, default: true },
    /** Incremented when a payment is successfully finalized (Stripe webhook or manual approve). */
    redeemedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

couponSchema.pre("save", function normalizeCode(next) {
  if (typeof this.code === "string") {
    this.code = String(this.code).trim().toUpperCase().replace(/\s+/g, "");
  }
  next();
});

export default mongoose.model("Coupon", couponSchema);
