import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import Task from "../models/task.model.js";
import Submission from "../models/submission.model.js";
import { attachPricingToCourseDoc } from "../lib/coursePricing.js";

const DUE_SOON_MS = 7 * 24 * 60 * 60 * 1000;

function isTaskComplete(taskId, taskType, completedTaskIds, submittedTaskIds) {
  const id = String(taskId);
  if (completedTaskIds.has(id)) return true;
  if (taskType === "assignment" && submittedTaskIds.has(id)) return true;
  return false;
}

export async function buildStudentDashboard(studentId) {
  const sid = String(studentId);
  const now = Date.now();
  const dueCutoff = now + DUE_SOON_MS;

  const enrollments = await Enrollment.find({
    student: sid,
    status: "active",
  })
    .populate({
      path: "course",
      populate: { path: "teacher", select: "name" },
    })
    .lean();

  const coursesRaw = enrollments
    .map((e) => e.course)
    .filter((c) => c && c.isDeleted !== true);

  if (!coursesRaw.length) {
    return {
      summary: {
        enrolledCount: 0,
        inProgressCount: 0,
        completedCount: 0,
        avgProgress: 0,
        dueSoonCount: 0,
        certificateCount: 0,
      },
      courses: [],
      dueSoon: [],
      continueCourses: [],
      completedCourses: [],
    };
  }

  const courseIds = coursesRaw.map((c) => c._id);
  const allTaskIds = [
    ...new Set(
      coursesRaw.flatMap((c) => (c.tasks || []).map((id) => String(id))),
    ),
  ];

  const [completions, tasks, submissions] = await Promise.all([
    CourseCompletion.find({ student: sid, course: { $in: courseIds } })
      .select(
        "course progress isCompleted completedAt certificateApproved lastWorkspaceVisitAt completedTasks",
      )
      .lean(),
    allTaskIds.length
      ? Task.find({ _id: { $in: allTaskIds } })
          .select("_id title type dueDate examDetails.startTime")
          .lean()
      : [],
    allTaskIds.length
      ? Submission.find({ studentId: sid, taskId: { $in: allTaskIds } })
          .select("taskId")
          .lean()
      : [],
  ]);

  const completionByCourse = new Map(
    completions.map((c) => [String(c.course), c]),
  );
  const tasksByCourse = new Map();
  for (const course of coursesRaw) {
    const ids = new Set((course.tasks || []).map((id) => String(id)));
    tasksByCourse.set(
      String(course._id),
      tasks.filter((t) => ids.has(String(t._id))),
    );
  }

  const submittedTaskIds = new Set(submissions.map((s) => String(s.taskId)));

  let inProgressCount = 0;
  let completedCount = 0;
  let progressSum = 0;
  let certificateCount = 0;
  const dueSoon = [];
  const courses = [];

  for (const course of coursesRaw) {
    const courseId = String(course._id);
    const completion = completionByCourse.get(courseId);
    const progress = Math.max(0, Math.min(100, Math.round(Number(completion?.progress) || 0)));
    const isCompleted = Boolean(completion?.isCompleted || progress >= 100);
    const hasCertificate = Boolean(completion?.certificateApproved);

    progressSum += progress;
    if (isCompleted) completedCount += 1;
    else if (progress > 0) inProgressCount += 1;
    if (hasCertificate) certificateCount += 1;

    const completedTaskIds = new Set(
      (completion?.completedTasks || []).map((id) => String(id)),
    );
    const courseTasks = tasksByCourse.get(courseId) || [];

    let pendingTasks = 0;
    let nextDueAt = null;
    let nextDueTitle = null;

    for (const task of courseTasks) {
      const taskId = String(task._id);
      const done = isTaskComplete(
        taskId,
        task.type,
        completedTaskIds,
        submittedTaskIds,
      );
      if (done) continue;

      pendingTasks += 1;

      const dueAt = task.dueDate
        ? new Date(task.dueDate)
        : task.type === "exam" && task.examDetails?.startTime
          ? new Date(task.examDetails.startTime)
          : null;

      if (dueAt && !Number.isNaN(dueAt.getTime())) {
        const dueMs = dueAt.getTime();
        if (dueMs <= dueCutoff) {
          dueSoon.push({
            id: `${courseId}:${taskId}`,
            courseId,
            courseTitle: course.title,
            taskId,
            taskTitle: task.title,
            taskType: task.type,
            dueAt: dueAt.toISOString(),
            overdue: dueMs < now,
          });
        }
        if (!nextDueAt || dueMs < nextDueAt.getTime()) {
          nextDueAt = dueAt;
          nextDueTitle = task.title;
        }
      }
    }

    courses.push(
      attachPricingToCourseDoc({
        _id: course._id,
        title: course.title,
        description: course.description,
        category: course.category,
        image: course.image,
        teacherName: course.teacher?.name || "Instructor",
        progress,
        isCompleted,
        hasCertificate,
        pendingTasks,
        nextDueAt: nextDueAt?.toISOString() ?? null,
        nextDueTitle,
        lastVisitedAt: completion?.lastWorkspaceVisitAt ?? null,
        enrolledAt: enrollments.find((e) => String(e.course?._id) === courseId)?.enrolledAt,
      }),
    );
  }

  dueSoon.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

  const continueCourses = courses
    .filter((c) => !c.isCompleted)
    .sort((a, b) => {
      const aVisit = a.lastVisitedAt ? new Date(a.lastVisitedAt).getTime() : 0;
      const bVisit = b.lastVisitedAt ? new Date(b.lastVisitedAt).getTime() : 0;
      if (bVisit !== aVisit) return bVisit - aVisit;
      return (b.progress ?? 0) - (a.progress ?? 0);
    })
    .slice(0, 6)
    .map((c) => ({
      _id: c._id,
      title: c.title,
      progress: c.progress,
      pendingTasks: c.pendingTasks,
      lastVisitedAt: c.lastVisitedAt,
    }));

  const completedCourses = courses
    .filter((c) => c.isCompleted)
    .slice(0, 6)
    .map((c) => ({
      _id: c._id,
      title: c.title,
      hasCertificate: c.hasCertificate,
      progress: c.progress,
    }));

  return {
    summary: {
      enrolledCount: courses.length,
      inProgressCount,
      completedCount,
      avgProgress: courses.length
        ? Math.round(progressSum / courses.length)
        : 0,
      dueSoonCount: dueSoon.length,
      certificateCount,
    },
    courses,
    dueSoon: dueSoon.slice(0, 8),
    continueCourses,
    completedCourses,
  };
}
