import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Task from "../models/task.model.js";
import Submission from "../models/submission.model.js";
import Lecture from "../models/lecture.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";

// Authorization helper: only admin or the teacher that owns the course can proceed.
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

export const createcourse = async (req, res) => {
  const { title, description, category } = req.body;

  try {
    if (!title || !description || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.user || req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can create courses" });
    }

    // Check if course already exists
    const existingCourse = await Course.findOne({ title, description });
    if (existingCourse) {
      return res.status(400).json({ message: "Course already exists" });
    }

    // Create the course with teacher's ObjectId
    const newCourse = new Course({
      title,
      teacher: req.user._id, // from auth, not request body
      description,
      category,
      price: 200,
    });

    await newCourse.save();

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
    }).populate("student", "name email");

    const students = enrollments.map((e) => e.student);

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

    const courses = await Course.find({ teacher: teacherId }).populate(
      "teacher",
      "name",
    );

    res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
