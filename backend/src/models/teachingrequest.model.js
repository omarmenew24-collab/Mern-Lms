import mongoose from "mongoose";
// this should unclue email
const teacherRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  bio: { type: String, required: true },
  profilePicture: String,
  paymentMethod: { type: String, required: true },
  portfolioLink: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin who reviewed
});

const TeacherRequest =  mongoose.model("TeacherRequest", teacherRequestSchema);

export default TeacherRequest;

