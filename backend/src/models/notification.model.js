import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    type: {
      type: String,
      enum: ["info", "success", "warning", "important"],
      default: "info",
    },
    isRead: { type: Boolean, default: false, index: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    /** e.g. course.enrolled, announcement, lecture.published */
    actionType: { type: String, default: "" },
    /** Set for admin/instructor manual announcements */
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    /** optional linked entities for the client */
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
