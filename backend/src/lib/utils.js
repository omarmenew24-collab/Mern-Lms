import jwt from "jsonwebtoken";
import Course from "../models/course.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: true, // true in prod
  path: "/",
};
export const generateAccessToken = (user) => {
  return jwt.sign(
    { _id: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { _id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};



/**
 * Unified function to calculate and update progress
 * Works for Lectures, Tasks, and future Exams
 */
export const updateUnifiedProgress = async (studentId, courseId) => {
  // 1️⃣ Fetch course and student's progress record
  const [course, completion] = await Promise.all([
    Course.findById(courseId).populate("lectures tasks"),
    CourseCompletion.findOne({ student: studentId, course: courseId }),
  ]);

  if (!course) throw new Error("Course not found");

  // 2️⃣ Create progress record if missing
  let progressDoc = completion;
  if (!progressDoc) {
    progressDoc = await CourseCompletion.create({
      student: studentId,
      course: courseId,
      completedLectures: [],
      completedTasks: [],
      progress: 0,
      isCompleted: false,
    });
  }

  // 3️⃣ Convert course items to IDs for easy comparison
  const validTaskIds = course.tasks.map(t => t._id.toString());
  const validLectureIds = course.lectures.map(l => l._id.toString());

  // 4️⃣ Keep only tasks/lectures that still exist in the course
  progressDoc.completedTasks = progressDoc.completedTasks.filter(t =>
    validTaskIds.includes(t.toString())
  );
  progressDoc.completedLectures = progressDoc.completedLectures.filter(l =>
    validLectureIds.includes(l.toString())
  );

  // 5️⃣ Count total and completed items
  const totalItems = validTaskIds.length + validLectureIds.length;
  const completedItems = progressDoc.completedTasks.length + progressDoc.completedLectures.length;

  // 6️⃣ Calculate progress percentage
  progressDoc.progress = totalItems === 0
    ? 0
    : Math.min(Math.round((completedItems / totalItems) * 100), 100);

  // 7️⃣ Update completion status
  if (progressDoc.progress === 100) {
    if (!progressDoc.isCompleted) {
      progressDoc.isCompleted = true;
      progressDoc.completedAt = new Date();
    }
  } else {
    progressDoc.isCompleted = false;
    progressDoc.completedAt = null;
  }

  // 8️⃣ Save and return
  return await progressDoc.save();
};