import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";

const ANNOUNCEMENT_ACTION = "announcement";
const activeEnrollmentMatch = {
  $or: [{ status: "active" }, { status: { $exists: false } }],
};

function recipientUserBaseFilter() {
  return { isDeleted: { $ne: true }, status: { $ne: "suspended" } };
}

async function userIdsByRole(role) {
  const rows = await User.find({ ...recipientUserBaseFilter(), role }).select("_id").lean();
  return rows.map((r) => r._id);
}

async function userIdsAll() {
  const rows = await User.find(recipientUserBaseFilter()).select("_id").lean();
  return rows.map((r) => r._id);
}

async function studentIdsForCourse(courseId) {
  const rows = await Enrollment.find({
    course: courseId,
    ...activeEnrollmentMatch,
  })
    .select("student")
    .lean();
  const set = new Set(rows.map((r) => String(r.student)));
  return [...set].map((id) => new mongoose.Types.ObjectId(id));
}

const BULK_CHUNK = 500;

async function insertNotificationBulk(docs) {
  if (!docs.length) return 0;
  let inserted = 0;
  for (let i = 0; i < docs.length; i += BULK_CHUNK) {
    const chunk = docs.slice(i, i + BULK_CHUNK);
    const res = await Notification.insertMany(chunk, { ordered: false });
    inserted += res.length;
  }
  return inserted;
}

const maxLimit = 50;

export const getNotifications = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ user: req.user._id }),
    ]);

    return res.status(200).json({
      notifications: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    });
  } catch (e) {
    console.error("getNotifications:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
    return res.status(200).json({ count });
  } catch (e) {
    console.error("getUnreadCount:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

export const markOneRead = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const doc = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true },
      { new: true },
    );
    if (!doc) {
      return res.status(404).json({ message: "Notification not found" });
    }
    return res.status(200).json({ notification: doc });
  } catch (e) {
    console.error("markOneRead:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

export const markAllRead = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const r = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true },
    );
    return res.status(200).json({ modified: r.modifiedCount });
  } catch (e) {
    console.error("markAllRead:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /notifications/send
 * Admin: all_users | students | instructors | course
 * Teacher: course only (own courses), enrolled students
 */
export const sendAnnouncements = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      title: rawTitle,
      message: rawMessage,
      targetType,
      courseId: rawCourseId,
      isImportant: rawImportant,
    } = req.body;

    const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
    const message = typeof rawMessage === "string" ? rawMessage.trim() : "";
    if (!title || title.length > 200) {
      return res.status(400).json({ message: "Title is required (max 200 characters)" });
    }
    if (!message || message.length > 2000) {
      return res.status(400).json({ message: "Message is required (max 2000 characters)" });
    }

    const validTargets = ["all_users", "students", "instructors", "course"];
    if (!validTargets.includes(targetType)) {
      return res.status(400).json({
        message: `targetType must be one of: ${validTargets.join(", ")}`,
      });
    }

    const isImportant = Boolean(rawImportant);

    if (user.role === "teacher" && targetType !== "course") {
      return res.status(403).json({
        message: "Instructors can only send announcements to a specific course (enrolled students)",
      });
    }

    let courseObjectId = null;
    if (targetType === "course") {
      if (!rawCourseId || !mongoose.Types.ObjectId.isValid(String(rawCourseId))) {
        return res.status(400).json({ message: "Valid courseId is required for course target" });
      }
      courseObjectId = new mongoose.Types.ObjectId(String(rawCourseId));
      const course = await Course.findById(courseObjectId).select("teacher isDeleted");
      if (!course || course.isDeleted) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (user.role === "teacher") {
        if (String(course.teacher) !== String(user._id)) {
          return res.status(403).json({ message: "You can only announce to your own courses" });
        }
      }
    } else if (rawCourseId) {
      return res.status(400).json({ message: "courseId is only used when targetType is course" });
    }

    let recipientIds = [];

    if (targetType === "all_users") {
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can target all users" });
      }
      recipientIds = await userIdsAll();
    } else if (targetType === "students") {
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can target all students" });
      }
      recipientIds = await userIdsByRole("student");
    } else if (targetType === "instructors") {
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can target all instructors" });
      }
      recipientIds = await userIdsByRole("teacher");
    } else if (targetType === "course") {
      recipientIds = await studentIdsForCourse(courseObjectId);
    }

    if (!recipientIds.length) {
      return res.status(200).json({
        created: 0,
        message: "No recipients matched this audience",
        targetType,
      });
    }

    const notifType = isImportant ? "important" : "info";
    const courseField = targetType === "course" ? courseObjectId : null;

    const docs = recipientIds.map((uid) => ({
      user: uid,
      title,
      message,
      type: notifType,
      isRead: false,
      course: courseField,
      actionType: ANNOUNCEMENT_ACTION,
      createdBy: user._id,
      task: null,
      relatedUser: null,
    }));

    const created = await insertNotificationBulk(docs);

    return res.status(201).json({
      created,
      targetType,
      courseId: courseObjectId ? String(courseObjectId) : null,
    });
  } catch (e) {
    console.error("sendAnnouncements:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteOne = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const r = await Notification.findOneAndDelete({ _id: id, user: req.user._id });
    if (!r) {
      return res.status(404).json({ message: "Notification not found" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("deleteOne notification:", e);
    return res.status(500).json({ message: "Server error" });
  }
};
