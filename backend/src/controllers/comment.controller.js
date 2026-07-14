import mongoose from "mongoose";
import Course from "../models/course.model.js";
import CourseComment from "../models/courseComment.model.js";
import User from "../models/user.model.js";
import {
  notifySafe,
  onCourseCommentForInstructor,
  createInAppNotification,
} from "../services/notification.service.js";
import {
  getSiteCommentSettings,
  canBypassCommentLock,
  isCommentSectionLockedForPublic,
} from "../lib/commentPolicy.js";

export const listCourseComments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const cursor = req.query.cursor;

    const course = await Course.findById(courseId).select(
      "_id isPublished isDeleted commentsDisabled",
    );
    if (!course || course.isDeleted) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!course.isPublished && req.user?.role !== "admin") {
      return res.status(404).json({ message: "Course not found" });
    }

    const site = await getSiteCommentSettings();
    const locked = isCommentSectionLockedForPublic(site, course);
    const bypass = canBypassCommentLock(req.user, course);

    const filter = { course: courseId, isDeleted: { $ne: true } };
    if (cursor) {
      filter.createdAt = { $lt: new Date(cursor) };
    }

    const comments = await CourseComment.find(filter)
      .populate("user", "name role picture")
      .populate("parentComment", "user")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const nextCursor =
      comments.length === limit ? comments[comments.length - 1]?.createdAt : null;

    return res.status(200).json({
      comments,
      nextCursor,
      commentPolicy: {
        commentsGloballyDisabled: site.commentsGloballyDisabled,
        courseCommentsDisabled: Boolean(course.commentsDisabled),
        openForUser: !locked || bypass,
      },
    });
  } catch (error) {
    console.error("listCourseComments:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const createCourseComment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content, parentComment: parentCommentId } = req.body;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const text = String(content || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const site = await getSiteCommentSettings();
    const course = await Course.findById(courseId).select(
      "_id isPublished isDeleted title teacher commentsDisabled",
    );
    if (!course || course.isDeleted) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!course.isPublished && req.user.role !== "admin") {
      return res.status(403).json({ message: "Course is not published" });
    }

    const locked = isCommentSectionLockedForPublic(site, course);
    const bypass = canBypassCommentLock(req.user, course);
    if (locked && !bypass) {
      return res.status(403).json({
        message: "Q&A posting is limited for this course. Only staff can post right now.",
      });
    }

    let parentObjectId = null;
    if (parentCommentId) {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        return res.status(400).json({ message: "Invalid parent message" });
      }
      const parent = await CourseComment.findOne({
        _id: parentCommentId,
        course: courseId,
        isDeleted: { $ne: true },
      });
      if (!parent) {
        return res.status(400).json({ message: "Parent message not found" });
      }
      parentObjectId = parent._id;
    }

    const doc = await CourseComment.create({
      course: courseId,
      user: req.user._id,
      content: text,
      parentComment: parentObjectId,
    });

    const created = await CourseComment.findById(doc._id)
      .populate("user", "name role picture")
      .populate({ path: "parentComment", select: "user content" })
      .lean();

    const isReply = Boolean(parentObjectId);
    const notifyTeacher =
      !isReply && String(req.user._id) !== String(course.teacher);
    if (notifyTeacher) {
      const commenter = await User.findById(req.user._id).select("name");
      notifySafe(() =>
        onCourseCommentForInstructor({
          course,
          commenterId: req.user._id,
          commenterName: commenter?.name || req.user.name,
        }),
      );
    } else if (isReply) {
      const parentFull = await CourseComment.findById(parentObjectId).select("user");
      if (parentFull?.user && String(parentFull.user) !== String(req.user._id)) {
        const replier = await User.findById(req.user._id).select("name");
        const label = req.user.role === "admin" ? "An admin" : (replier?.name || "Someone");
        notifySafe(() =>
          createInAppNotification({
            userId: parentFull.user,
            title: "Reply on course Q&A",
            message: `${label} replied to you in Questions & answers on “${course.title}”.`,
            type: "info",
            courseId,
            actionType: "course.comment_reply",
            sendEmail: false,
          }),
        );
      }
    }

    return res.status(201).json({ comment: created });
  } catch (error) {
    console.error("createCourseComment:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteCourseComment = async (req, res) => {
  try {
    const { courseId, commentId } = req.params;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const comment = await CourseComment.findOne({
      _id: commentId,
      course: courseId,
      isDeleted: { $ne: true },
    });
    if (!comment) return res.status(404).json({ message: "Message not found" });

    const course = await Course.findById(courseId).select("teacher");
    if (!course) return res.status(404).json({ message: "Course not found" });

    const isAdmin = req.user.role === "admin";
    const isOwnerTeacher =
      req.user.role === "teacher" &&
      course.teacher.toString() === req.user._id.toString();
    const isAuthor = String(comment.user) === String(req.user._id);

    if (!isAdmin && !isOwnerTeacher && !isAuthor) {
      return res.status(403).json({ message: "Access denied" });
    }

    comment.isDeleted = true;
    await comment.save();

    return res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error("deleteCourseComment:", error);
    return res.status(500).json({ message: error.message });
  }
};
