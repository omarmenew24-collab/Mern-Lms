import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task", // reference to the Task model
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // reference to the Student model
      required: true,
    },
    fileUrl: {
      type: String,
      required: true, // Cloudinary or storage URL
    },
    /** Original filename (+ extension) from the learner's upload; used for instructor downloads. */
    originalFileName: { type: String, default: "", trim: true, maxlength: 200 },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
      default: null, // null if not graded yet
    },
    feedback: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Optional: compound index to quickly find submissions by task and student
submissionSchema.index({ taskId: 1, studentId: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
