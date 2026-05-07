import Course from "../models/course.model.js";
import CourseRating from "../models/courseRating.model.js";
import User from "../models/user.model.js";
import Enrollment from "../models/enrollment.model.js";
import Task from "../models/task.model.js";
import Submission from "../models/submission.model.js";
import Lecture from "../models/lecture.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import { uploadImage } from "../lib/cloudinaryupload.js";
import { upsertCourseCategory } from "../lib/courseCategoryHelpers.js";
import {
  attachPricingToCourseDoc,
  parsePromotionInput,
  validateCheckoutPrice,
} from "../lib/coursePricing.js";

// Authorization helper: only admin or the teacher that owns the course can proceed.
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolves which user will own a newly created course.
 * - Teacher: always their own id; if `body.teacher` is sent it must match their name (no creating for others).
 * - Admin: must send an active teacher’s display name in `body.teacher`.
 */
async function resolveTeacherIdForNewCourse(req) {
  if (!req.user) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const role = req.user.role;
  if (role !== "teacher" && role !== "admin") {
    return {
      ok: false,
      status: 403,
      message: "Only teachers and admins can create courses",
    };
  }

  const teacherNameFromBody =
    typeof req.body.teacher === "string" ? req.body.teacher.trim() : "";

  if (role === "teacher") {
    if (teacherNameFromBody) {
      const selfName = String(req.user.name || "").trim();
      const pattern = new RegExp(`^${escapeRegExp(teacherNameFromBody)}$`, "i");
      if (!pattern.test(selfName)) {
        return {
          ok: false,
          status: 403,
          message: "You can only create courses for yourself",
        };
      }
    }
    return { ok: true, teacherId: req.user._id };
  }

  if (!teacherNameFromBody) {
    return {
      ok: false,
      status: 400,
      message: "Teacher is required when an admin creates a course",
    };
  }

  const teacherDoc = await User.findOne({
    role: "teacher",
    isDeleted: { $ne: true },
    status: "active",
    name: new RegExp(`^${escapeRegExp(teacherNameFromBody)}$`, "i"),
  });

  if (!teacherDoc) {
    return {
      ok: false,
      status: 400,
      message:
        "Teacher not found or inactive. Use the name of an active teacher account.",
    };
  }

  return { ok: true, teacherId: teacherDoc._id };
}

const MAX_CATALOG_LINES = 10;
const MAX_CATALOG_LINE_LEN = 500;

function parseCatalogStringArray(raw) {
  if (raw == null || raw === "") return [];
  let parsed;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((s) => typeof s === "string")
    .map((s) => s.trim().slice(0, MAX_CATALOG_LINE_LEN))
    .filter(Boolean)
    .slice(0, MAX_CATALOG_LINES);
}

function parseCatalogBoolean(raw, fallback = true) {
  if (raw === true || raw === false) return raw;
  if (typeof raw === "string") {
    const l = raw.toLowerCase();
    if (l === "true" || l === "1") return true;
    if (l === "false" || l === "0") return false;
  }
  return fallback;
}

const requireCourseTeacherOrAdmin = async (req, courseId, res) => {
  const course = await Course.findById(courseId).select("teacher");

  if (!course) {
    res.status(404).json({ message: "Course not found" });
    return null;
  }

  if (req.user?.role === "admin") return course;

  if (
    req.user?.role === "teacher" &&
    course.teacher.toString() === req.user._id.toString()
  ) {
    return course;
  }

  res.status(403).json({ message: "Access denied" });
  return null;
};

const validateCourseReadyForReview = async (course) => {
  const problems = [];
  if (!course.title?.trim()) problems.push("Title is required");
  if (!course.description?.trim() || course.description.trim().length < 20) {
    problems.push("Description must be at least 20 characters");
  }
  if (!course.category?.trim()) problems.push("Category is required");
  if (!Number.isFinite(Number(course.price)) || Number(course.price) <= 0) {
    problems.push("Price must be greater than zero");
  }

  const lectureCount = await Lecture.countDocuments({ course: course._id });
  if (lectureCount < 1) {
    problems.push("At least one lecture is required");
  }

  return problems;
};

async function attachRatingSummariesToCourseDocs(courses) {
  if (!Array.isArray(courses) || courses.length === 0) {
    return courses;
  }
  const ids = courses.map((c) => c._id).filter(Boolean);
  if (ids.length === 0) return courses;

  const agg = await CourseRating.aggregate([
    { $match: { course: { $in: ids } } },
    {
      $group: {
        _id: "$course",
        average: { $avg: "$value" },
        count: { $sum: 1 },
      },
    },
  ]);

  const byCourse = new Map();
  for (const row of agg) {
    const id = row._id?.toString?.() ?? String(row._id);
    byCourse.set(id, {
      averageRating: Math.round(row.average * 10) / 10,
      totalRatings: row.count,
    });
  }

  return courses.map((c) => {
    const id = c._id?.toString?.() ?? String(c._id);
    const s = byCourse.get(id);
    if (!s) {
      return { ...c, averageRating: null, totalRatings: 0 };
    }
    return { ...c, ...s };
  });
}

export const getcourses = async (req, res) => {
  try {
    const courses = await Course.find({
      isDeleted: { $ne: true },
      isPublished: true,
      status: "published",
    })
      .populate("teacher", "name")
      .lean();

    const withRatings = await attachRatingSummariesToCourseDocs(courses);
    res.status(200).json(withRatings.map((c) => attachPricingToCourseDoc(c)));
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllCoursesForAdmin = async (req, res) => {
  try {
    const courses = await Course.find({ isDeleted: { $ne: true } })
      .populate("teacher", "name")
      .lean();
    return res.status(200).json(courses.map((c) => attachPricingToCourseDoc(c)));
  } catch (error) {
    console.error("getAllCoursesForAdmin:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const course = await Course.findById(courseId).populate("teacher", "name");
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.isDeleted && req.user.role !== "admin") {
      return res.status(404).json({ message: "Course not found" });
    }

    // Students shouldn't see hidden/private course management details here
    if (req.user.role === "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Teacher can only access their own course, admin can access all
    if (
      req.user.role === "teacher" &&
      course.teacher?._id?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ course: attachPricingToCourseDoc(course) });
  } catch (error) {
    console.error("Error fetching course by id:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.isDeleted) {
      return res.status(400).json({ message: "Cannot edit a deleted course" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwnerTeacher =
      req.user.role === "teacher" &&
      course.teacher.toString() === req.user._id.toString();

    if (!isAdmin && !isOwnerTeacher) {
      return res.status(403).json({ message: "Access denied" });
    }

    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body.description === "string" ? req.body.description.trim() : "";
    const category =
      typeof req.body.category === "string" ? req.body.category.trim() : "";

    if (!title || !description || !category) {
      return res.status(400).json({
        message: "Title, description, and category are required",
      });
    }

    course.title = title;
    course.description = description;
    course.category = category;
    if (req.file) {
      course.image = await uploadImage(req.file.path);
    }

    if (isAdmin && req.body.price !== undefined) {
      const price = Number(req.body.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: "Price must be a valid number" });
      }
      course.price = price;
    }

    const promotionPatch =
      isAdmin &&
      (req.body.promotionEnabled !== undefined ||
        req.body.promotionType !== undefined ||
        req.body.promotionValue !== undefined ||
        req.body.promotionStartsAt !== undefined ||
        req.body.promotionEndsAt !== undefined);

    if (promotionPatch) {
      const parsed = parsePromotionInput(req.body);
      if (parsed.error) {
        return res.status(400).json({ message: parsed.error });
      }
      course.promotion = parsed.promotion;
    }

    if (isAdmin) {
      const revalidate = req.body.price !== undefined || promotionPatch;
      if (revalidate) {
        const chk = validateCheckoutPrice(Number(course.price), course.promotion);
        if (!chk.ok) {
          return res.status(400).json({ message: chk.message });
        }
      }
    }

    if (req.body.learningOutcomes !== undefined) {
      course.learningOutcomes = parseCatalogStringArray(req.body.learningOutcomes);
    }
    if (req.body.requirements !== undefined) {
      course.requirements = parseCatalogStringArray(req.body.requirements);
    }
    if (req.body.includesExtras !== undefined) {
      course.includesExtras = parseCatalogStringArray(req.body.includesExtras);
    }
    if (req.body.courseLanguage !== undefined) {
      const lang =
        typeof req.body.courseLanguage === "string"
          ? req.body.courseLanguage.trim().slice(0, 80)
          : "";
      course.courseLanguage = lang || "English";
    }
    if (req.body.purchaseNote !== undefined) {
      course.purchaseNote =
        typeof req.body.purchaseNote === "string"
          ? req.body.purchaseNote.trim().slice(0, 280)
          : "";
    }
    if (req.body.showCertificateInCatalog !== undefined) {
      course.showCertificateInCatalog = parseCatalogBoolean(
        req.body.showCertificateInCatalog,
        true,
      );
    }
    if (req.body.showLifetimeAccessInCatalog !== undefined) {
      course.showLifetimeAccessInCatalog = parseCatalogBoolean(
        req.body.showLifetimeAccessInCatalog,
        true,
      );
    }

    if (isAdmin && req.body.commentsDisabled !== undefined) {
      course.commentsDisabled = parseCatalogBoolean(
        req.body.commentsDisabled,
        false,
      );
    }
    if (isAdmin && req.body.ratingsDisabled !== undefined) {
      course.ratingsDisabled = parseCatalogBoolean(
        req.body.ratingsDisabled,
        false,
      );
    }

    await course.save();
    await upsertCourseCategory(course.teacher, course.category);
    await course.populate("teacher", "name");

    return res.status(200).json({
      message: "Course updated successfully",
      course: attachPricingToCourseDoc(course),
    });
  } catch (error) {
    console.error("updateCourseDetails:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const setCoursePublished = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { isPublished } = req.body;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied - Admins only" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.isDeleted) {
      return res.status(400).json({ message: "Cannot publish a deleted course" });
    }

    course.isPublished = Boolean(isPublished);
    course.status = course.isPublished ? "published" : "archived";
    await course.save();

    return res.status(200).json({ courseId, isPublished: course.isPublished });
  } catch (error) {
    console.error("Error setting publish status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const submitCourseForReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can submit for review" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (course.isDeleted) {
      return res.status(400).json({ message: "Cannot review deleted course" });
    }

    const problems = await validateCourseReadyForReview(course);
    if (problems.length > 0) {
      return res.status(400).json({
        message: "Course is not ready for review",
        checklist: problems,
      });
    }

    course.status = "pending_review";
    course.isPublished = false;
    course.reviewNote = "";
    await course.save();

    return res.status(200).json({
      message: "Course submitted for admin review",
      status: course.status,
    });
  } catch (error) {
    console.error("submitCourseForReview:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const reviewCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { action, reviewNote } = req.body;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied - Admins only" });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid review action" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.isDeleted) {
      return res.status(400).json({ message: "Cannot review deleted course" });
    }

    if (action === "approve") {
      course.status = "published";
      course.isPublished = true;
      course.reviewNote = "";
    } else {
      course.status = "changes_requested";
      course.isPublished = false;
      course.reviewNote = String(reviewNote || "").trim();
    }

    await course.save();
    return res.status(200).json({
      message:
        action === "approve" ? "Course approved and published" : "Changes requested",
      status: course.status,
      isPublished: course.isPublished,
      reviewNote: course.reviewNote,
    });
  } catch (error) {
    console.error("reviewCourse:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const softDeleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied - Admins only" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.isDeleted = true;
    course.isPublished = false;
    await course.save();

    return res.status(200).json({ message: "Course deleted (soft)", courseId });
  } catch (error) {
    console.error("Error soft deleting course:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const createcourse = async (req, res) => {
  const { title, description, category } = req.body;

  try {
    if (!title || !description || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const resolved = await resolveTeacherIdForNewCourse(req);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ message: resolved.message });
    }
    const { teacherId } = resolved;

    // Check if course already exists
    const existingCourse = await Course.findOne({ title, description });
    if (existingCourse) {
      return res.status(400).json({ message: "Course already exists" });
    }

    const image = req.file ? await uploadImage(req.file.path) : "";
    const newCourse = new Course({
      title,
      teacher: teacherId,
      description,
      category,
      image,
      price: 200,
      isPublished: false,
      status: "draft",
    });

    await newCourse.save();
    await upsertCourseCategory(teacherId, category);

    res.status(201).json({
      _id: newCourse._id,
      title: newCourse.title,
      description: newCourse.description,
    });
  } catch (error) {
    console.error("Error in creating course", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const deletecourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if requester is either the teacher of the course or an admin
    if (
      course.teacher.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this course" });
    }

    // Optional: delete all related lectures/tasks if needed
    await Lecture.deleteMany({ course: courseId });
    await Task.deleteMany({ course: courseId });

    // Delete the course
    await course.deleteOne();

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getstudentcourses = async (req, res) => {
  try {
    // 1. Take ID from req.user (provided by your protect/auth middleware)
    const studentId = req.user._id;

    // 2. Find enrollments where THIS user is the student
    const enrollments = await Enrollment.find({
      student: studentId,
      status: "active", // Only show active enrollments
    })
      .populate({
        path: "course",
        populate: { path: "teacher", select: "name email" },
      })
      .populate("student", "name email");

    // 3. Extract courses and filter out any "null" courses (in case a course was deleted)
    const enrolledCourses = enrollments
      .filter((enrollment) => enrollment.course !== null)
      .map((enrollment) => enrollment.course);

    return res.status(200).json({
      success: true,
      count: enrolledCourses.length,
      courses: enrolledCourses,
    });
  } catch (err) {
    console.error("Error fetching student courses:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch courses.",
    });
  }
};

export const getStudentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    // Students should never be able to view other students in a course.
    if (req.user.role === "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const course = await requireCourseTeacherOrAdmin(req, courseId, res);
    if (!course) return;

    const enrollments = await Enrollment.find({
      course: courseId,
      status: "active",
    }).populate("student", "name email status");

    // Orphaned enrollments (deleted user) leave `student` null after populate
    const students = enrollments.map((e) => e.student).filter(Boolean);

    res.json({ courseId, students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTeacherEnrollments = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (req.user.role === "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Teacher can only view their own enrollments.
    if (req.user.role === "teacher" && req.user._id.toString() !== teacherId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const teacherCourseIds = await Course.find({ teacher: teacherId }).select(
      "_id",
    );
    const courseIds = teacherCourseIds.map((c) => c._id);

    if (courseIds.length === 0) {
      return res.json({ enrollments: [] });
    }

    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      status: "active",
    })
      .populate({ path: "course", select: "title" })
      .populate("student", "name email")
      .sort({ enrolledAt: -1 });

    res.json({ enrollments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStudentSubmissionsByCourse = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    if (!req.user || req.user.role === "student")
      return res.status(401).json({ message: "Unauthorized" });

    // Teachers can only see submissions for courses they own.
    if (req.user.role === "teacher") {
      const course = await requireCourseTeacherOrAdmin(req, courseId, res);
      if (!course) return;
    }

    // 1️⃣ Get all tasks of the course
    const course = await Course.findById(courseId).populate("tasks");
    if (!course) return res.status(404).json({ message: "Course not found" });

    const taskIds = course.tasks.map((task) => task._id);

    // 2️⃣ Get all submissions by this student for these tasks
    const submissions = await Submission.find({
      taskId: { $in: taskIds },
      studentId,
    })
      .populate("taskId", "title type dueDate examDetails") // populate task info
      .sort({ submittedAt: -1 });

    res.json({ studentId, courseId, submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// this is for students with roles of student or teacher

export const getCourseProgress = async (req, res) => {
  try {
    console.log("🔥 getCourseProgress HIT");
    const { courseId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const queryStudentId = req.query.studentId;

    const course = await Course.findById(courseId).select("teacher");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwnerTeacher =
      course.teacher.toString() === req.user._id.toString();

    const studentId = queryStudentId || req.user._id;

    // 🔥 Check if requester is enrolled in the course
    const isRequesterEnrolled = await Enrollment.exists({
      student: req.user._id,
      course: courseId,
      status: "active",
    });

    // 🔒 Access control
    // if (!isAdmin && !isOwnerTeacher && !isRequesterEnrolled) {
    //  console.log("from get course progress")
    //  return res.status(403).json({ message: "Access denied" });
    // }

    // 🔒 If requesting another student's progress, only admin or owner teacher allowed
    //  if (
    //   studentId.toString() !== req.user._id.toString() &&
    //   !isAdmin &&
    //   !isOwnerTeacher
    //  ) {
    //  return res.status(403).json({ message: "Access denied" });
    // }

    console.log("studentId:", studentId);
    console.log("courseId:", courseId);

    const progress = await CourseCompletion.findOne({
      student: studentId,
      course: courseId,
    });

    console.log("progress found:", progress);

    if (!progress) {
      return res.status(200).json({
        progress: 0,
        completedLectures: [],
        completedTasks: [],
        isCompleted: false,
        certificateApproved: false,
      });
    }

    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching progress",
      error: error.message,
    });
  }
};

// this is for teachers to see the progress of all students
export const getBulkCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get course
    const course = await Course.findById(courseId).select("teacher");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwnerTeacher =
      course.teacher.toString() === req.user._id.toString();

    // 🔥 ONLY admin or course owner can access
    if (!isAdmin && !isOwnerTeacher) {
      console.log("from get bulk course progress");
      return res.status(403).json({ message: "Access denied" });
    }

    const allProgressRecords = await CourseCompletion.find({
      course: courseId,
    }).select("student progress isCompleted");

    res.status(200).json(allProgressRecords);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching bulk progress", error: error.message });
  }
};

export const toggleCertificatePermission = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const course = await requireCourseTeacherOrAdmin(req, courseId, res);
    if (!course) return;

    const progress = await CourseCompletion.findOne({
      course: courseId,
      student: studentId,
    });

    if (!progress)
      return res.status(404).json({ message: "Progress not found" });

    // Toggle the value (true becomes false, false becomes true)
    progress.certificateApproved = !progress.certificateApproved;
    await progress.save();

    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

export const getcoursesbyteacher = async (req, res) => {
  try {
    const { teacherId } = req.query;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required" });
    }

    if (req.user.role === "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "teacher" && req.user._id.toString() !== teacherId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const courses = await Course.find({ teacher: teacherId })
      .populate("teacher", "name")
      .lean();

    res.status(200).json(courses.map((c) => attachPricingToCourseDoc(c)));
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
