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
  contentType: {
    type: String,
    enum: ["video", "file", "link", "text"],
    default: "video",
  },
  videoUrl: {
    type: String,
    default: "",
  },
  vimeoVideoId: {
    type: String,
    default: "",
  },
  fileUrl: { type: String, default: "" },
  fileName: { type: String, default: "" },
  linkUrl: { type: String, default: "" },
  linkLabel: { type: String, default: "" },
  textContent: { type: String, default: "" },
  attachments: [
    {
      url: { type: String, required: true },
      fileName: { type: String, default: "" },
      addedAt: { type: Date, default: Date.now },
    },
  ],
  level: {
    number: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
    },
  },
  duration: Number,
  order: {
    type: Number,
    default: 0,
  },
  isFreePreview: {
    type: Boolean,
    default: false,
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
