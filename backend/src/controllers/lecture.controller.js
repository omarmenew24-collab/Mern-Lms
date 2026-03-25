import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import Enrollment from "../models/enrollment.model.js";
import Task from "../models/task.model.js";
import Submission from "../models/submission.model.js";
import Lecture from "../models/lecture.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import { updateUnifiedProgress } from "../lib/utils.js";

// Authorization helper
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

const activeOrLegacyEnrollmentFilter = {
  $or: [{ status: "active" }, { status: { $exists: false } }],
};

// ======================
// CREATE LECTURE
// ======================
export const createLecture = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only teachers can create lectures" });
    }

    const course = await requireCourseTeacherOrAdmin(
      req,
      courseId,
      res
    );
    if (!course) return;

    const { title, description, videoUrl, level, duration, order } =
      req.body;

    if (!title || !videoUrl || !level?.number || !level?.title) {
      return res
        .status(400)
        .json({ message: "Missing required lecture fields" });
    }

    const lecture = await Lecture.create({
      course: course._id,
      title,
      description,
      videoUrl,
      level,
      duration,
      order,
      createdBy: req.user._id,
    });

    course.lectures.push(lecture._id);
    await course.save();

    // 🔥 FIX: Update progress for ALL students
    const enrollments = await Enrollment.find({
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    }).select("student");

    await Promise.all(
      enrollments.map((e) =>
        updateUnifiedProgress(e.student, courseId)
      )
    );

    res
      .status(201)
      .json({ message: "Lecture added successfully", lecture });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ======================
// GET LECTURES
// ======================
export const getLecturesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const course = await Course.findById(courseId).select("teacher");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isAdmin = req.user.role === "admin";

    const isOwnerTeacher =
      course.teacher.toString() === req.user._id.toString();

    const isEnrolled = await Enrollment.exists({
      student: req.user._id,
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    });

    if (!isAdmin && !isOwnerTeacher && !isEnrolled) {
      return res.status(403).json({ message: "Access denied" });
    }

    const populatedCourse = await Course.findById(courseId).populate({
      path: "lectures",
      model: "Lecture",
      populate: { path: "createdBy", select: "name email" },
    });

    res.status(200).json({ lectures: populatedCourse.lectures });
  } catch (error) {
    console.error("Error fetching lectures:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ======================
// MARK LECTURE COMPLETE
// ======================
export const markLectureAsComplete = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const studentId = req.user._id;

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    });

    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course" });
    }

    const lecture = await Lecture.findOne({
      _id: lectureId,
      course: courseId,
    });

    if (!lecture) {
      return res
        .status(400)
        .json({ message: "Lecture does not belong to this course" });
    }

    await CourseCompletion.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $addToSet: { completedLectures: lectureId } },
      { upsert: true }
    );

    const updatedRecord = await updateUnifiedProgress(
      studentId,
      courseId
    );

    res.status(200).json({
      message: "Lecture marked as complete",
      completedLectures: updatedRecord.completedLectures,
      progress: updatedRecord.progress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================
// DELETE LECTURE
// ======================
export const deleteLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only teachers can delete lectures" });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    if (lecture.course.toString() !== courseId) {
      return res
        .status(400)
        .json({ message: "Lecture does not belong to this course" });
    }

    const course = await requireCourseTeacherOrAdmin(
      req,
      courseId,
      res
    );
    if (!course) return;

    await Lecture.findByIdAndDelete(lectureId);

    const courseUpdate = await Course.updateOne(
      { _id: courseId },
      { $pull: { lectures: lectureId } }
    );

    if (courseUpdate.modifiedCount === 0) {
      return res
        .status(400)
        .json({ message: "Lecture does not belong to this course" });
    }

    // 🔥 FIX: Update progress for ALL students after deletion
    const enrollments = await Enrollment.find({
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    }).select("student");

    await Promise.all(
      enrollments.map((e) =>
        updateUnifiedProgress(e.student, courseId)
      )
    );

    res
      .status(200)
      .json({ message: "Lecture deleted successfully" });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    res.status(500).json({ message: "Server error" });
  }
};