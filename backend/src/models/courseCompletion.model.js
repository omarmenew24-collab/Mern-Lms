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
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The teacher who validates the final grade
    },
    // Add this field
    certificateApproved: {
      type: Boolean,
      default: false,
    },
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
