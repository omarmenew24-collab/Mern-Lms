import mongoose from "mongoose";

const courseCompletionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // --- PROGRESS TRACKING ---

    // Links to your Lecture model
    completedLectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],

    /** Student self-mark "I've reviewed this" — does NOT affect progress % */
    acknowledgedLectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],

    // Links to your Task model
    completedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],

    // Links to your Submission model
    // (This proves they actually uploaded something)
    submissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
      },
    ],

    // Calculated percentage (0 to 100)
    progress: {
      type: Number,
      default: 0,
    },

    // --- STATUS ---
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },

    // --- CERTIFICATION ---
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateUrl: {
      type: String,
    },
    /** Opaque public verification code (unique). Set when PDF is first issued. */
    certificateCode: {
      type: String,
      maxlength: 64,
      default: null,
      sparse: true,
      unique: true,
    },
    certificateIssuedAt: {
      type: Date,
      default: null,
    },
    certificateRevoked: {
      type: Boolean,
      default: false,
    },
    certificateRevokedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The teacher who validates the final grade
    },
    // Add this field
    certificateApproved: {
      type: Boolean,
      default: false,
    },

    /** Student opened course workspace — counted with a minimum gap (see controller). */
    firstWorkspaceVisitAt: { type: Date, default: null },
    lastWorkspaceVisitAt: { type: Date, default: null },
    workspaceVisitCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Unique index remains crucial: One completion record per student per course
courseCompletionSchema.index({ student: 1, course: 1 }, { unique: true });

const CourseCompletion = mongoose.model(
  "CourseCompletion",
  courseCompletionSchema
);
export default CourseCompletion;
