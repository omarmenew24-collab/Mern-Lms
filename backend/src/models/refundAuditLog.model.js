import mongoose from "mongoose";

const refundAuditLogSchema = new mongoose.Schema(
  {
    refundRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RefundRequest",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      maxlength: 80,
      index: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    details: { type: String, default: "", maxlength: 8000 },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

refundAuditLogSchema.index({ refundRequest: 1, createdAt: -1 });

export default mongoose.model("RefundAuditLog", refundAuditLogSchema);
