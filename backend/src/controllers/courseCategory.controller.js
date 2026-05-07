import mongoose from "mongoose";
import CourseCategory from "../models/courseCategory.model.js";
import Course from "../models/course.model.js";
import { upsertCourseCategory } from "../lib/courseCategoryHelpers.js";
import { getPlatformCategoryNamesForApi } from "../lib/platformCourseCategories.js";

function resolveOwnerId(req) {
  const { role, _id } = req.user;
  if (role === "admin") {
    const tid = req.query.teacherId || req.body?.teacherId;
    if (!tid || !mongoose.Types.ObjectId.isValid(tid)) {
      return { ok: false, status: 400, message: "teacherId is required for admins" };
    }
    return { ok: true, ownerId: tid };
  }
  return { ok: true, ownerId: _id };
}

/** GET /course-categories?teacherId= — merged saved labels + categories used on courses */
export const listCourseCategories = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const resolved = resolveOwnerId(req);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ message: resolved.message });
    }
    const ownerId = resolved.ownerId;

    const [saved, fromCourses, platformList] = await Promise.all([
      CourseCategory.find({ owner: ownerId }).sort({ name: 1 }).lean(),
      Course.distinct("category", {
        teacher: ownerId,
        isDeleted: { $ne: true },
      }),
      getPlatformCategoryNamesForApi(),
    ]);

    const merged = new Map();
    for (const p of platformList) {
      const n = String(p || "").trim();
      if (!n) continue;
      const nl = n.toLowerCase();
      if (!merged.has(nl)) {
        merged.set(nl, { _id: null, name: n, isPlatform: true });
      }
    }
    for (const row of saved) {
      const nl = row.nameLower;
      const existing = merged.get(nl);
      if (existing) {
        merged.set(nl, {
          ...existing,
          _id: row._id,
          name: row.name,
          isPlatform: Boolean(existing.isPlatform),
        });
      } else {
        merged.set(nl, { _id: row._id, name: row.name });
      }
    }
    for (const cat of fromCourses) {
      const n = String(cat || "").trim();
      if (!n) continue;
      const nl = n.toLowerCase();
      if (!merged.has(nl)) merged.set(nl, { name: n });
    }

    const categories = [...merged.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

    return res.status(200).json({ categories });
  } catch (e) {
    console.error("listCourseCategories:", e.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/** POST /course-categories { name, teacherId? } — save a label for picker (optional; saving a course also upserts) */
export const createCourseCategory = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length > 80) {
      return res.status(400).json({ message: "Name is required (max 80 characters)" });
    }

    let ownerId;
    if (req.user.role === "admin") {
      const tid = req.body?.teacherId;
      if (!tid || !mongoose.Types.ObjectId.isValid(tid)) {
        return res.status(400).json({ message: "teacherId is required for admins" });
      }
      ownerId = tid;
    } else {
      if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers and admins can manage categories" });
      }
      ownerId = req.user._id;
    }

    await upsertCourseCategory(ownerId, name);
    const doc = await CourseCategory.findOne({
      owner: ownerId,
      nameLower: name.toLowerCase(),
    }).lean();

    return res.status(201).json({ category: { _id: doc?._id, name: doc?.name || name } });
  } catch (e) {
    console.error("createCourseCategory:", e.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * DELETE /course-categories/:id — removes only the saved picker label (CourseCategory doc).
 * Does not modify or delete any courses; courses keep their category string.
 */
export const deleteCourseCategory = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const cat = await CourseCategory.findById(id);
    if (!cat) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (req.user.role === "teacher") {
      if (cat.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await CourseCategory.deleteOne({ _id: id });

    return res.status(200).json({
      message:
        "Saved label removed. Courses that use this category name are unchanged.",
    });
  } catch (e) {
    console.error("deleteCourseCategory:", e.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
