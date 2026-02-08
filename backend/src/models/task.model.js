import mongoose from "mongoose";
 export const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ["assignment", "exam"], required: true },
  dueDate: Date, // applies to both
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },


  // Exam-specific
  examDetails: {
    startTime: Date,
    endTime: Date,
    questions: [
      {
        questionText: String,
        options: [String], // for MCQs
        correctAnswer: String
      }
    ]
  }
});

const Task = mongoose.model("Task", taskSchema);

export default Task;