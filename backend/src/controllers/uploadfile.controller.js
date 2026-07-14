import Submission from "../models/submission.model.js";
import Task from "../models/task.model.js";
import Course from "../models/course.model.js";
import { uploadFile } from "../lib/cloudinaryupload.js";
import { buildSubmissionOriginalFileName } from "../lib/submissionFilename.js";
import { updateUnifiedProgress } from "../lib/utils.js";
import Enrollment from "../models/enrollment.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import { notifySafe, onAssignmentSubmitted } from "../services/notification.service.js";

const activeEnrollmentFilter = {
  $or: [{ status: "active" }, { status: { $exists: false } }],
};

const validateStudentTaskAccess = async ({ studentId, courseId, taskId }) => {
  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    ...activeEnrollmentFilter,
  }).populate("course");

  if (!enrollment || !enrollment.course) {
    return {
      error: {
        status: 403,
        message: "You are not enrolled in this course or course not found",
      },
    };
  }

  const taskBelongsToCourse = enrollment.course.tasks.some(
    (id) => id.toString() === taskId,
  );

  if (!taskBelongsToCourse) {
    return {
      error: {
        status: 400,
        message: "Task does not belong to this course",
      },
    };
  }

  const task = await Task.findById(taskId);

  return { enrollment, task };
};

export const uploadfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "Only students can upload files" });
    }

    const studentId = req.user._id;
    const { taskId, courseId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const { error, task } = await validateStudentTaskAccess({
      studentId,
      courseId,
      taskId,
    });

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (task?.dueDate && new Date() > new Date(task.dueDate)) {
      return res.status(403).json({
        message: "The deadline for this task has passed. You can no longer submit or update.",
      });
    }

    const fileUrl = await uploadFile(req.file.path);
    const originalFileName = buildSubmissionOriginalFileName(
      req.file.originalname,
      req.file.mimetype,
    );

    const submission = await Submission.findOneAndUpdate(
      { taskId, studentId },
      { fileUrl, originalFileName, submittedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await CourseCompletion.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $addToSet: { completedTasks: taskId } },
      { upsert: true, new: true },
    );

    await updateUnifiedProgress(studentId, courseId);

    const courseRow = await Course.findById(courseId).select("title teacher");
    if (courseRow) {
      notifySafe(() =>
        onAssignmentSubmitted({
          course: courseRow,
          task: task,
          studentId,
          teacherId: courseRow.teacher,
        }),
      );
    }

    res.status(201).json({
      message: "File uploaded and task marked complete!",
      url: fileUrl,
      submission,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

export const getMySubmission = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { taskId } = req.params;
    const studentId = req.user._id;

    const submission = await Submission.findOne({ taskId, studentId });
    const task = await Task.findById(taskId).select("title dueDate type");
    const isLocked = !!(task?.dueDate && new Date() > new Date(task.dueDate));

    res.status(200).json({
      submission: submission || null,
      task: task || null,
      isLocked,
    });
  } catch (error) {
    console.error("getMySubmission error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Enrolled learner: lightweight grade snapshot for all submissions in a course.
 * Used by workspace task list to show inline grades.
 */
export const getMySubmissionsSummaryForCourse = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    const studentId = req.user._id;

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      ...activeEnrollmentFilter,
    });
    if (!enrollment) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    const course = await Course.findById(courseId).select("tasks");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const taskIds = (course.tasks || []).map((id) => id);
    if (taskIds.length === 0) {
      return res.status(200).json({ grades: [] });
    }

    const submissions = await Submission.find({
      studentId,
      taskId: { $in: taskIds },
    }).select("taskId grade submittedAt");

    return res.status(200).json({
      grades: submissions.map((s) => ({
        taskId: String(s.taskId),
        grade: s.grade,
        submittedAt: s.submittedAt,
      })),
    });
  } catch (error) {
    console.error("getMySubmissionsSummaryForCourse error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteMySubmission = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId, taskId } = req.params;
    const studentId = req.user._id;

    const { error, task } = await validateStudentTaskAccess({
      studentId,
      courseId,
      taskId,
    });

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (task?.dueDate && new Date() > new Date(task.dueDate)) {
      return res.status(403).json({
        message: "The deadline for this task has passed. You can no longer delete this submission.",
      });
    }

    const submission = await Submission.findOne({ taskId, studentId });
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    await Submission.deleteOne({ _id: submission._id });

    await CourseCompletion.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $pull: { completedTasks: taskId } },
    );

    await updateUnifiedProgress(studentId, courseId);

    return res.status(200).json({ message: "Submission deleted successfully" });
  } catch (error) {
    console.error("deleteMySubmission error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
