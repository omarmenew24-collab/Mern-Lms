import mongoose from "mongoose";

export const CHARGEBACK_STATUSES = ["open", "submitted", "won", "lost"];

const chargebackSchema = new mongoose.Schema(
  {
    /** Purchase / order — one chargeback record per payment */
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true,
      index: true,
    },
    user: {
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
    /** Display order id (Stripe PaymentIntent id) */
    orderLabel: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "usd", lowercase: true },
    dateOpened: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: CHARGEBACK_STATUSES,
      default: "open",
      index: true,
    },
    provider: { type: String, default: "stripe" },
    /** Stripe dispute id (dp_…), when known */
    stripeDisputeId: { type: String, default: null, sparse: true, unique: true },
    /** Immutable snapshot for dispute evidence (refreshed on demand / webhook) */
    evidenceSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    evidenceCapturedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Chargeback", chargebackSchema);
