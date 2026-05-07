import mongoose from "mongoose";

/**
 * Each teacher (owner) maintains their own category labels for courses.
 * `nameLower` enforces uniqueness per owner case-insensitively.
 */
const courseCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    nameLower: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

courseCategorySchema.index({ owner: 1, nameLower: 1 }, { unique: true });

const CourseCategory =
  mongoose.models.CourseCategory ||
  mongoose.model("CourseCategory", courseCategorySchema);

export default CourseCategory;
