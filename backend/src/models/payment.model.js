import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
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
    /** Amount in major currency units (e.g. dollars), matching how you display course.price */
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["succeeded", "refunded", "partially_refunded", "failed"],
      default: "succeeded",
      index: true,
    },
    /** Stripe PaymentIntent id, or synthetic `manual_<orderId>` for bank/manual settlements. */
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "manual", "free"],
      default: "stripe",
      index: true,
    },
    manualOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManualPaymentOrder",
      default: null,
    },
    stripeChargeId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      required: true,
      index: true,
    },
    /** If captured at checkout (optional). */
    clientIp: {
      type: String,
      default: null,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
      index: true,
    },
    couponCodeSnapshot: { type: String, default: "" },
    couponDiscountAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
