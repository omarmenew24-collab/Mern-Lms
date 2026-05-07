import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js"
import Task from "../models/task.model.js";
import Submission from "../models/submission.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import { updateUnifiedProgress } from "../lib/utils.js";
import {
  notifySafe,
  onTaskCreatedForCourse,
  onAssignmentGraded,
} from "../services/notification.service.js";

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

const requireStudentEnrolled = async (req, courseId, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    ...activeOrLegacyEnrollmentFilter,
  });

  if (!enrollment) {
    res.status(403).json({ message: "You are not enrolled in this course" });
    return null;
  }

  return enrollment;
};

// ======================
// CREATE TASK
// ======================
export const createtask = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, type, dueDate, examDetails, resourceUrl, resourceFileName, referenceLink } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (!(req.user.role === "admin" || course.teacher.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Only the course teacher can create tasks" });
    }

    const task = await Task.create({
      title,
      description,
      type,
      dueDate: type === "assignment" ? dueDate : undefined,
      examDetails: type === "exam" ? examDetails : undefined,
      resourceUrl: type === "resource" ? (resourceUrl || "") : undefined,
      resourceFileName: type === "resource" ? (resourceFileName || "") : undefined,
      referenceLink:
        referenceLink?.url?.trim()
          ? { url: referenceLink.url.trim(), label: (referenceLink.label || "").trim() }
          : undefined,
      createdBy: req.user._id,
    });

    course.tasks.push(task._id);
    await course.save();

    // 🔥 ADDED
    const enrollments = await Enrollment.find({
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    }).select("student");

    await Promise.all(
      enrollments.map((e) =>
        updateUnifiedProgress(e.student, courseId)
      )
    );

    res.status(201).json({ message: "Task created successfully", task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================
// GET TASKS
// ======================
export const gettasks = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const course = await Course.findById(courseId).select("teacher tasks");
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

    const populatedCourse = await Course.findById(courseId).populate("tasks");

    res.status(200).json({
      message: "Tasks fetched successfully",
      tasks: populatedCourse.tasks,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================
// DELETE TASK
// ======================
export const deletetask = async (req, res) => {
  try {
    const { courseId, taskId } = req.params;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (req.user.role === "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const taskIndex = course.tasks.findIndex(task => task._id.toString() === taskId);
    if (taskIndex === -1) return res.status(404).json({ message: "Task not found" });

    if (
      req.user.role !== "admin" &&
      course.teacher.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ message: "Only the teacher can delete tasks" });

    course.tasks.splice(taskIndex, 1);
    await course.save();

    // 🔥 ADDED
    const enrollments = await Enrollment.find({
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    }).select("student");

    await Promise.all(
      enrollments.map((e) =>
        updateUnifiedProgress(e.student, courseId)
      )
    );

    return res.status(200).json({ message: "Task deleted successfully", tasks: course.tasks });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Server error while deleting task" });
  }
};

// ======================
// UPDATE TASK
// ======================
export const updatetask = async (req, res) => {
  try {
    const { courseId, taskId } = req.params;
    const { title, description, type, dueDate, examDetails, resourceUrl, resourceFileName, referenceLink } = req.body;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const course = await Course.findById(courseId);
    if (!course || (req.user.role !== "admin" && course.teacher.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (type) task.type = type;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (examDetails) task.examDetails = examDetails;
    if (resourceUrl !== undefined) task.resourceUrl = resourceUrl || "";
    if (resourceFileName !== undefined) task.resourceFileName = resourceFileName || "";
    if (referenceLink !== undefined) {
      task.referenceLink = referenceLink?.url?.trim()
        ? { url: referenceLink.url.trim(), label: (referenceLink.label || "").trim() }
        : { url: "", label: "" };
    }

    await task.save();

    // 🔥 ADDED
    const enrollments = await Enrollment.find({
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    }).select("student");

    await Promise.all(
      enrollments.map((e) =>
        updateUnifiedProgress(e.student, courseId)
      )
    );

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ======================
// GRADE SUBMISSION
// ======================
export const gradesubmission = async (req, res) => {
  try {
    const { taskId, studentId } = req.params;
    const { grade } = req.body;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const course = await Course.findOne({ tasks: taskId }).select("teacher _id");
    if (!course) return res.status(404).json({ message: "Course not found for task" });

    if (req.user.role === "teacher" && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const studentEnrollment = await Enrollment.findOne({
      student: studentId,
      course: course._id,
      ...activeOrLegacyEnrollmentFilter,
    });

    if (!studentEnrollment) {
      return res.status(403).json({ message: "Student is not enrolled in this course" });
    }

    const submission = await Submission.findOne({
      taskId,
      studentId
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    submission.grade = grade;
    await submission.save();

    const taskDoc = await Task.findById(taskId).select("title");
    notifySafe(() =>
      onAssignmentGraded({
        courseId: course._id,
        taskTitle: taskDoc?.title || "Assignment",
        studentId,
        grade: String(grade),
        teacherName: req.user?.name || "",
      }),
    );

    res.status(200).json({
      message: "Task graded successfully",
      submission
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================
// SUBMISSIONS
// ======================
export const submissions = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const course = await Course.findOne({ tasks: taskId }).select("teacher _id");
    if (!course) return res.status(404).json({ message: "Course not found for task" });

    if (req.user.role === "student") {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: course._id,
        ...activeOrLegacyEnrollmentFilter,
      });

      if (!enrollment) {
        return res.status(403).json({ message: "You are not enrolled in this course" });
      }

      const studentSubmissions = await Submission.find({
        taskId,
        studentId: req.user._id,
      })
        .populate("studentId", "name email")
        .populate("taskId", "title dueDate");

      return res.status(200).json(studentSubmissions);
    }

    if (req.user.role === "teacher") {
      if (course.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const studentSubmissions = await Submission.find({ taskId })
      .populate("studentId", "name email")
      .populate("taskId", "title dueDate");

    if (!studentSubmissions || studentSubmissions.length === 0) {
      return res.status(404).json({ message: "No submissions found for this task" });
    }

    res.status(200).json(studentSubmissions);

  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ======================
// MARK TASK COMPLETE
// ======================
export const markTaskAsComplete = async (req, res) => {
  try {
    const { courseId, taskId } = req.params;
    const studentId = req.user._id;

    if (!req.user) {
      return res.status(403).json({ message: "Only students can complete tasks" });
    }

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    });

    if (!enrollment) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    const ownsTask = await Course.findOne({ _id: courseId, tasks: taskId }).select("_id");
    if (!ownsTask) {
      return res.status(400).json({ message: "Task does not belong to this course" });
    }

    await CourseCompletion.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $addToSet: { completedTasks: taskId } },
      { upsert: true }
    );

    const updatedRecord = await updateUnifiedProgress(studentId, courseId);

    res.status(200).json({
      message: "Task marked as complete",
      completedTasks: updatedRecord.completedTasks,
      progress: updatedRecord.progress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};