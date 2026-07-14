import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import CourseRating from "../models/courseRating.model.js";
import CourseComment from "../models/courseComment.model.js";
import { attachPricingToCourseDoc } from "../lib/coursePricing.js";

function courseStatus(course) {
  if (course.status) return course.status;
  return course.isPublished ? "published" : "draft";
}

function truncate(text, max = 80) {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export async function buildTeacherDashboard(teacherId) {
  const tid = String(teacherId);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const coursesRaw = await Course.find({ teacher: tid, isDeleted: { $ne: true } })
    .select("title description category image status isPublished updatedAt createdAt teacher")
    .sort({ updatedAt: -1 })
    .lean();

  const courseIds = coursesRaw.map((c) => c._id);
  if (!courseIds.length) {
    return {
      summary: {
        courseCount: 0,
        publishedCount: 0,
        draftCount: 0,
        totalStudents: 0,
        newStudentsThisMonth: 0,
        openQACount: 0,
        unansweredQACount: 0,
        avgRating: null,
        ratingCount: 0,
      },
      courses: [],
      unansweredQuestions: [],
      draftCourses: [],
    };
  }

  const [enrollmentAgg, newEnrollments, progressAgg, ratingAgg, rootComments, replyComments] =
    await Promise.all([
      Enrollment.aggregate([
        { $match: { course: { $in: courseIds }, status: "active" } },
        { $group: { _id: "$course", count: { $sum: 1 } } },
      ]),
      Enrollment.countDocuments({
        course: { $in: courseIds },
        status: "active",
        enrolledAt: { $gte: monthAgo },
      }),
      CourseCompletion.aggregate([
        { $match: { course: { $in: courseIds } } },
        {
          $group: {
            _id: "$course",
            avgProgress: { $avg: "$progress" },
          },
        },
      ]),
      CourseRating.aggregate([
        { $match: { course: { $in: courseIds } } },
        {
          $group: {
            _id: "$course",
            average: { $avg: "$value" },
            count: { $sum: 1 },
          },
        },
      ]),
      CourseComment.find({
        course: { $in: courseIds },
        parentComment: null,
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(80)
        .select("course user content createdAt")
        .populate("user", "name")
        .lean(),
      CourseComment.find({
        course: { $in: courseIds },
        parentComment: { $ne: null },
        isDeleted: false,
      })
        .select("parentComment user")
        .lean(),
    ]);

  const studentsByCourse = new Map(
    enrollmentAgg.map((row) => [String(row._id), row.count]),
  );
  const progressByCourse = new Map(
    progressAgg.map((row) => [String(row._id), Math.round(Number(row.avgProgress) || 0)]),
  );
  const ratingByCourse = new Map(
    ratingAgg.map((row) => [
      String(row._id),
      {
        average: Math.round(Number(row.average) * 10) / 10,
        count: row.count,
      },
    ]),
  );

  const teacherRepliedParentIds = new Set();
  for (const reply of replyComments) {
    if (String(reply.user) === tid) {
      teacherRepliedParentIds.add(String(reply.parentComment));
    }
  }

  const courseMeta = new Map(
    coursesRaw.map((c) => [
      String(c._id),
      { title: c.title, teacher: String(c.teacher) },
    ]),
  );

  const openQuestionsByCourse = new Map();
  const unansweredByCourse = new Map();
  const unansweredQuestions = [];
  let unansweredTotal = 0;

  for (const comment of rootComments) {
    const courseId = String(comment.course);
    openQuestionsByCourse.set(courseId, (openQuestionsByCourse.get(courseId) || 0) + 1);

    const commentId = String(comment._id);
    const unanswered = !teacherRepliedParentIds.has(commentId);
    if (unanswered) {
      unansweredTotal += 1;
      unansweredByCourse.set(courseId, (unansweredByCourse.get(courseId) || 0) + 1);
      if (unansweredQuestions.length < 8) {
        unansweredQuestions.push({
          id: commentId,
          courseId,
          courseTitle: courseMeta.get(courseId)?.title || "Course",
          content: truncate(comment.content, 120),
          authorName: comment.user?.name || "Student",
          createdAt: comment.createdAt,
        });
      }
    }
  }

  let publishedCount = 0;
  let draftCount = 0;
  let ratingSum = 0;
  let ratingWeight = 0;
  let totalStudents = 0;

  const courses = coursesRaw.map((course) => {
    const id = String(course._id);
    const status = courseStatus(course);
    if (status === "published") publishedCount += 1;
    else draftCount += 1;

    const studentCount = studentsByCourse.get(id) || 0;
    totalStudents += studentCount;

    const rating = ratingByCourse.get(id);
    if (rating?.count) {
      ratingSum += rating.average * rating.count;
      ratingWeight += rating.count;
    }

    return attachPricingToCourseDoc({
      ...course,
      status,
      studentCount,
      avgCompletionPercent: progressByCourse.get(id) ?? 0,
      ratingAvg: rating?.average ?? null,
      ratingCount: rating?.count ?? 0,
      openQuestions: unansweredByCourse.get(id) || 0,
    });
  });

  const draftCourses = courses
    .filter((c) => c.status !== "published")
    .slice(0, 6)
    .map((c) => ({
      _id: c._id,
      title: c.title,
      status: c.status,
      updatedAt: c.updatedAt,
    }));

  const openQACount = rootComments.length;
  const unansweredQACount = unansweredTotal;

  return {
    summary: {
      courseCount: courses.length,
      publishedCount,
      draftCount,
      totalStudents,
      newStudentsThisMonth: newEnrollments,
      openQACount,
      unansweredQACount,
      avgRating: ratingWeight > 0 ? Math.round((ratingSum / ratingWeight) * 10) / 10 : null,
      ratingCount: ratingWeight,
    },
    courses,
    unansweredQuestions,
    draftCourses,
  };
}
