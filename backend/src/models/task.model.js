import mongoose from "mongoose";

export const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ["assignment", "exam", "resource"], required: true },
  dueDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Exam-specific
  examDetails: {
    startTime: Date,
    endTime: Date,
    questions: [
      {
        questionText: String,
        options: [String],
        correctAnswer: String,
      },
    ],
  },

  // Resource-specific (downloadable file/book)
  resourceUrl: { type: String, default: "" },
  resourceFileName: { type: String, default: "" },

  // Optional reference link — works on any task type.
  // Teachers use this to attach a Zoom meeting, Google Form, brief PDF, etc.
  referenceLink: {
    url: { type: String, default: "" },
    label: { type: String, default: "" },
  },
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
