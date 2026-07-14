// models/enrollment.model.js
import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  enrolledAt: { type: Date, default: Date.now },
  /** Set when enrolling via checkout (Stripe/manual); optional for bulk/admin enrollments. */
  refundPolicyAcceptedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ["active", "cancelled", "refunded"],
    default: "active",
  },
});

export default mongoose.model("Enrollment", enrollmentSchema);
