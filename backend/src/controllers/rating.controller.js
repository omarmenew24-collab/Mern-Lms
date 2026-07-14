import mongoose from "mongoose";
import Course from "../models/course.model.js";
import CourseRating from "../models/courseRating.model.js";
import Enrollment from "../models/enrollment.model.js";
import SiteSettings from "../models/siteSettings.model.js";
import { attachPricingToCourseDoc } from "../lib/coursePricing.js";

export const getRatingSummary = async (req, res) => {
  try {
    const { courseId } = req.params;
    const [course, site] = await Promise.all([
      Course.findById(courseId).select("_id ratingsDisabled").lean(),
      SiteSettings.findById("global")
        .select("ratingsGloballyDisabled")
        .lean(),
    ]);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const agg = await CourseRating.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: null,
          average: { $avg: "$value" },
          count: { $sum: 1 },
        },
      },
    ]);

    const row = agg[0];
    return res.status(200).json({
      average: row ? Math.round(row.average * 10) / 10 : 0,
      count: row ? row.count : 0,
      policy: {
        ratingsGloballyDisabled: Boolean(site?.ratingsGloballyDisabled),
        courseRatingsDisabled: Boolean(course?.ratingsDisabled),
      },
    });
  } catch (error) {
    console.error("getRatingSummary:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getMyRating = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId)
      .select("_id ratingsDisabled isDeleted")
      .lean();

    if (!course || course.isDeleted) {
      return res.status(404).json({ message: "Course not found" });
    }

    const enrollment = await Enrollment.findOne({
      course: courseId,
      student: req.user._id,
      status: "active",
    })
      .select("_id")
      .lean();

    if (!enrollment) {
      return res.status(200).json({ value: null });
    }

    const doc = await CourseRating.findOne({
      course: courseId,
      user: req.user._id,
    }).lean();

    return res.status(200).json({ value: doc?.value ?? null });
  } catch (error) {
    console.error("getMyRating:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const upsertRating = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { value } = req.body;

    const rating = Number(value);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const [course, site] = await Promise.all([
      Course.findById(courseId).select("teacher isDeleted ratingsDisabled"),
      SiteSettings.findById("global")
        .select("ratingsGloballyDisabled")
        .lean(),
    ]);
    if (!course || course.isDeleted) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (site?.ratingsGloballyDisabled || course.ratingsDisabled) {
      return res.status(403).json({
        message: "Ratings are disabled for this course",
        policy: {
          ratingsGloballyDisabled: Boolean(site?.ratingsGloballyDisabled),
          courseRatingsDisabled: Boolean(course?.ratingsDisabled),
        },
      });
    }

    if (course.teacher.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot rate your own course" });
    }

    const enrollment = await Enrollment.findOne({
      course: courseId,
      student: req.user._id,
      status: "active",
    })
      .select("_id")
      .lean();

    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "Only enrolled students can rate this course" });
    }

    const doc = await CourseRating.findOneAndUpdate(
      { course: courseId, user: req.user._id },
      { $set: { value: rating } },
      { upsert: true, new: true },
    );

    const agg = await CourseRating.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: null,
          average: { $avg: "$value" },
          count: { $sum: 1 },
        },
      },
    ]);
    const summary = agg[0];

    return res.status(200).json({
      value: doc.value,
      summary: {
        average: summary ? Math.round(summary.average * 10) / 10 : 0,
        count: summary ? summary.count : 0,
      },
    });
  } catch (error) {
    console.error("upsertRating:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getPublicCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findOne({
      _id: courseId,
      isDeleted: { $ne: true },
      isPublished: true,
      status: "published",
    })
      .populate("teacher", "name email picture createdAt publicAbout publicProjectLinks")
      .populate({
        path: "lectures",
        select: "title description level duration order isFreePreview videoUrl vimeoVideoId",
        options: { sort: { "level.number": 1, order: 1 } },
      });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const teacherCourseCount = await Course.countDocuments({
      teacher: course.teacher._id,
      isPublished: true,
      isDeleted: { $ne: true },
    });

    const totalStudents = course.students?.length || 0;

    const totalDuration = (course.lectures || []).reduce(
      (sum, l) => sum + (l.duration || 0),
      0,
    );

    const coursePlain = attachPricingToCourseDoc(course);
    coursePlain.lectures = (coursePlain.lectures || []).map((l) => {
      const out = { ...l };
      if (!out.isFreePreview) {
        delete out.videoUrl;
        delete out.vimeoVideoId;
      }
      return out;
    });

    const freePreviewCount = (coursePlain.lectures || []).filter((l) => l.isFreePreview).length;

    const hasTrailer = Boolean(
      (typeof course.trailerVideoUrl === "string" && course.trailerVideoUrl.trim()) ||
        (typeof course.trailerVimeoVideoId === "string" && course.trailerVimeoVideoId.trim()),
    );

    return res.status(200).json({
      course: coursePlain,
      meta: {
        totalStudents,
        totalLectures: course.lectures?.length || 0,
        totalTasks: course.tasks?.length || 0,
        totalDuration,
        teacherCourseCount,
        freePreviewCount,
        hasTrailer,
      },
    });
  } catch (error) {
    console.error("getPublicCourse:", error);
    return res.status(500).json({ message: error.message });
  }
};
