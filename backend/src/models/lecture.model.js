import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  videoUrl: {
    type: String,
    required: true, // Cloudinary / YouTube / Vimeo URL
  },
  // ✅ level as a single object with number + title
  level: {
    number: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true, // e.g. "Beginner", "Intermediate", "Advanced"
    },
  },
  duration: Number, // optional (seconds)
  order: {
    type: Number,
    default: 0, // order of lecture inside that level
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Lecture", lectureSchema);
