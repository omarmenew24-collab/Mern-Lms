import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Task from "../models/task.model.js";
import Submission from "../models/submission.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";

const TASK_TYPES = ["assignment", "exam", "resource"];

function normalizeType(type) {
  return TASK_TYPES.includes(type) ? type : "assignment";
}

/**
 * Staff-facing task analytics for the instructor tasks workspace.
 * Turned in = unique submissions (assignments) or marked complete (exams/resources).
 * Finish = share of active enrollments who turned the task in.
 */
export async function buildCourseTaskAnalytics(courseId) {
  const cid = String(courseId);

  const course = await Course.findById(cid).select("tasks").lean();
  const taskIds = (course?.tasks || []).map((id) => String(id));

  if (!taskIds.length) {
    return { enrolledStudents: 0, tasks: {}, types: {} };
  }

  const [enrolledStudents, tasks, completions, submissions] = await Promise.all([
    Enrollment.countDocuments({ course: cid, status: "active" }),
    Task.find({ _id: { $in: taskIds } }).select("_id type title").lean(),
    CourseCompletion.find({ course: cid }).select("student completedTasks").lean(),
    Submission.find({ taskId: { $in: taskIds } }).select("taskId studentId grade").lean(),
  ]);

  const submissionsByTask = {};
  for (const submission of submissions) {
    const taskId = String(submission.taskId);
    if (!submissionsByTask[taskId]) submissionsByTask[taskId] = [];
    submissionsByTask[taskId].push(submission);
  }

  const taskStats = {};
  const typeFinishRates = {
    assignment: [],
    exam: [],
    resource: [],
  };

  for (const task of tasks) {
    const taskId = String(task._id);
    const type = normalizeType(task.type);
    const taskSubmissions = submissionsByTask[taskId] || [];
    const submitterIds = new Set(taskSubmissions.map((s) => String(s.studentId)));

    let turnedInCount = 0;
    for (const completion of completions) {
      const studentId = String(completion.student);
      const markedComplete = (completion.completedTasks || []).some(
        (id) => String(id) === taskId,
      );
      const hasSubmission = type === "assignment" && submitterIds.has(studentId);
      if (markedComplete || hasSubmission) turnedInCount += 1;
    }

    const graded = taskSubmissions.filter((s) => s.grade != null);
    const avgGrade =
      graded.length > 0
        ? Math.round(graded.reduce((sum, s) => sum + Number(s.grade), 0) / graded.length)
        : null;
    const ungradedCount = taskSubmissions.filter((s) => s.grade == null).length;

    const finishRate =
      enrolledStudents > 0
        ? Math.round((turnedInCount / enrolledStudents) * 100)
        : 0;

    const turnedInDisplay =
      type === "assignment" ? submitterIds.size : turnedInCount;

    taskStats[taskId] = {
      taskId,
      type,
      turnedInCount: turnedInDisplay,
      submittedCount: submitterIds.size,
      completedCount: turnedInCount,
      finishRate,
      dropOffRate: Math.max(0, 100 - finishRate),
      avgGrade,
      ungradedCount,
    };

    typeFinishRates[type].push(finishRate);
  }

  const types = {};
  for (const type of TASK_TYPES) {
    const rates = typeFinishRates[type];
    types[type] = {
      type,
      completionPercent: rates.length
        ? Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length)
        : 0,
      taskCount: rates.length,
    };
  }

  return {
    enrolledStudents,
    tasks: taskStats,
    types,
  };
}
