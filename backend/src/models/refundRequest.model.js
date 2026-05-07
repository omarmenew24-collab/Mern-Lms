import mongoose from "mongoose";

const REFUND_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "processing",
  "completed",
  "failed",
];

const refundRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    /** One document per card purchase — duplicate prevention */
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: REFUND_STATUSES,
      default: "pending",
      index: true,
    },
    /** Money amount in major units for this request (full or partial). */
    refundAmount: { type: Number, required: true, min: 0 },
    refundPercent: { type: Number, required: true, default: 100, min: 1, max: 100 },
    currency: { type: String, default: "usd", lowercase: true },
    progressAtRequest: { type: Number, min: 0, max: 100, default: 0 },
    reason: { type: String, default: "", maxlength: 4000 },
    internalNotes: { type: String, default: "", maxlength: 8000 },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    decidedAt: { type: Date, default: null },
    /** Stripe Refund id */
    stripeRefundId: { type: String, default: null, index: true },
    failureMessage: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true },
);

refundRequestSchema.index({ course: 1, status: 1 });
refundRequestSchema.index({ student: 1, createdAt: -1 });

export const REFUND_STATUS_LIST = REFUND_STATUSES;
export default mongoose.model("RefundRequest", refundRequestSchema);
