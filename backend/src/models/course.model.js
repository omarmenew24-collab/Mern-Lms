import mongoose from "mongoose";
import Task from "./task.model.js";
import { taskSchema } from "./task.model.js";
import Lecture from "./lecture.model.js"


const announcementSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  type: { type: String, enum: ["announcement", "message"], default: "announcement" }
});


const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    /** List / base price. Optional `promotion` applies a discount at checkout. */
    price: {
      type: Number,
      required: true,
      min: 0, // prevent negative prices
    },
    promotion: {
      enabled: { type: Boolean, default: false },
      discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
      value: { type: Number, default: 0, min: 0 },
      startsAt: { type: Date, default: null },
      endsAt: { type: Date, default: null },
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    announcements: [announcementSchema],

    // ✅ Now references Lecture documents instead of embedding schema
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "pending_review",
        "changes_requested",
        "published",
        "archived",
      ],
      default: "draft",
      index: true,
    },

    reviewNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    /** Public catalog page (optional overrides; empty arrays → client uses defaults) */
    learningOutcomes: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    /** Extra bullet lines in “This course includes” after dynamic stats */
    includesExtras: {
      type: [String],
      default: [],
    },
    courseLanguage: {
      type: String,
      default: "English",
      trim: true,
      maxlength: 80,
    },
    /** Sidebar fine print under CTA; empty → client default copy */
    purchaseNote: {
      type: String,
      default: "",
      maxlength: 280,
      trim: true,
    },
    showCertificateInCatalog: {
      type: Boolean,
      default: true,
    },
    showLifetimeAccessInCatalog: {
      type: Boolean,
      default: true,
    },
    /** Admin (and instructor override path) — when true, only admin + this course teacher can comment. */
    commentsDisabled: { type: Boolean, default: false, index: true },
    /** Admin: when true, learners cannot submit/update ratings on this course. */
    ratingsDisabled: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);


const Course = mongoose.model("Course", courseSchema);

export default Course;
