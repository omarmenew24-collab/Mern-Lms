import mongoose from "mongoose";

const auditEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    details: { type: String, default: "" },
  },
  { _id: false },
);

const submissionSnapshotSchema = new mongoose.Schema(
  {
    transactionRef: { type: String, default: "" },
    transactionRefNormalized: { type: String, default: "" },
    senderName: { type: String, default: "" },
    paymentDate: { type: Date, default: null },
    receiptUrl: { type: String, default: "" },
    receiptMimeType: { type: String, default: "" },
    submittedAt: { type: Date, default: null },
    outcome: {
      type: String,
      enum: ["superseded", "approved", "rejected"],
      default: "superseded",
    },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const manualPaymentOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
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
    paymentMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManualPaymentMethod",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "usd", lowercase: true },

    status: {
      type: String,
      enum: ["awaiting_proof", "awaiting_verification", "approved", "rejected"],
      default: "awaiting_proof",
      index: true,
    },

    transactionRef: { type: String, default: "" },
    transactionRefNormalized: { type: String, default: "", index: true },
    senderName: { type: String, default: "" },
    paymentDate: { type: Date, default: null },
    receiptUrl: { type: String, default: "" },
    receiptMimeType: { type: String, default: "" },
    submittedAt: { type: Date, default: null },

    rejectionReason: { type: String, default: "" },
    rejectedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    submissionHistory: { type: [submissionSnapshotSchema], default: [] },
    auditLog: { type: [auditEntrySchema], default: [] },
  },
  { timestamps: true },
);

manualPaymentOrderSchema.index({ student: 1, updatedAt: -1 });
manualPaymentOrderSchema.index({ status: 1, submittedAt: -1 });

export default mongoose.model("ManualPaymentOrder", manualPaymentOrderSchema);
