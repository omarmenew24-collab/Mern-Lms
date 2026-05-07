import CourseCategory from "../models/courseCategory.model.js";

/**
 * Remember a category label for this teacher (e.g. after save course).
 */
export async function upsertCourseCategory(ownerId, rawName) {
  const name = String(rawName || "").trim();
  if (!name || name.length > 80) return;
  const nameLower = name.toLowerCase();
  await CourseCategory.findOneAndUpdate(
    { owner: ownerId, nameLower },
    { $set: { name, nameLower, owner: ownerId } },
    { upsert: true },
  );
}
