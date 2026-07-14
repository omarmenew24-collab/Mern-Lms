import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Lecture from "../models/lecture.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import { updateUnifiedProgress } from "../lib/utils.js";
import { parseHttpUrl } from "../lib/safeHttpUrl.js";
import { getVimeoVideoMeta } from "../lib/vimeoService.js";
import { notifySafe, onLecturePublished } from "../services/notification.service.js";

const requireCourseTeacherOrAdmin = async (req, courseId, res) => {
  const course = await Course.findById(courseId).select("teacher lectures");

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

// ======================
// CREATE LECTURE
// ======================
export const createLecture = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only teachers can create lectures" });
    }

    const course = await requireCourseTeacherOrAdmin(req, courseId, res);
    if (!course) return;

    const { title, description, videoUrl, vimeoVideoId, duration, order, isFreePreview,
      contentType: rawContentType, fileUrl, fileName, linkUrl, linkLabel, textContent,
      attachments: rawAttachments } = req.body;
    const freePreviewFlag = Boolean(isFreePreview);
    const contentType = ["video", "file", "link", "text"].includes(rawContentType) ? rawContentType : "video";

    const level = typeof req.body.level === "string"
      ? JSON.parse(req.body.level)
      : req.body.level;

    if (!title || !level?.number || !level?.title) {
      return res
        .status(400)
        .json({ message: "Missing required lecture fields (title, level)" });
    }

    let finalVideoUrl = "";
    let vimeoIdStored = "";
    let finalDuration = duration !== undefined && duration !== null && duration !== "" ? Number(duration) : null;
    if (Number.isNaN(finalDuration)) finalDuration = null;

    if (contentType === "video") {
      finalVideoUrl = (videoUrl || "").trim();

      if (vimeoVideoId != null && String(vimeoVideoId).trim() !== "") {
        const raw = String(vimeoVideoId).trim();
        const digits = raw.replace(/\D/g, "");
        if (!/^\d{3,20}$/.test(digits)) {
          return res.status(400).json({ message: "Invalid vimeoVideoId" });
        }
        vimeoIdStored = digits;
        finalVideoUrl = `https://vimeo.com/${digits}`;
      }

      if (!finalVideoUrl) {
        return res.status(400).json({ message: "Video lectures require a video URL" });
      }

      if (!vimeoIdStored) {
        try {
          const u = new URL(
            String(finalVideoUrl).startsWith("http") ? String(finalVideoUrl) : `https://${finalVideoUrl}`,
          );
          if (u.hostname.includes("vimeo.com")) {
            const parts = u.pathname.split("/").filter(Boolean);
            const n = parts.find((p) => /^\d+$/.test(p));
            if (n) vimeoIdStored = n;
          }
        } catch {
          /* not a vimeo url */
        }
      }

      const videoUrlCheck = parseHttpUrl(finalVideoUrl);
      if (!videoUrlCheck.ok) {
        return res.status(400).json({ message: videoUrlCheck.message });
      }
      finalVideoUrl = videoUrlCheck.value;

      if (vimeoIdStored && (finalDuration == null || finalDuration === 0)) {
        const meta = await getVimeoVideoMeta(vimeoIdStored);
        if (meta?.duration != null && !Number.isNaN(meta.duration)) {
          finalDuration = meta.duration;
        }
      }
    }

    if (contentType === "link" && !linkUrl) {
      return res.status(400).json({ message: "Link lectures require a URL" });
    }

    let validAttachments;
    if (Array.isArray(rawAttachments)) {
      validAttachments = rawAttachments
        .filter((a) => a && typeof a.url === "string" && a.url.trim())
        .slice(0, 5)
        .map((a) => ({ url: a.url.trim(), fileName: (a.fileName || "").trim() }));
    }

    const lecture = await Lecture.create({
      course: course._id,
      title,
      description,
      contentType,
      videoUrl: finalVideoUrl || undefined,
      vimeoVideoId: vimeoIdStored || undefined,
      fileUrl: contentType === "file" ? (fileUrl || "") : undefined,
      fileName: contentType === "file" ? (fileName || "") : undefined,
      linkUrl: contentType === "link" ? (linkUrl || "") : undefined,
      linkLabel: contentType === "link" ? (linkLabel || "") : undefined,
      textContent: contentType === "text" ? (textContent || "") : undefined,
      attachments: validAttachments?.length ? validAttachments : undefined,
      level,
      duration: finalDuration,
      order: order ? Number(order) : 0,
      isFreePreview: freePreviewFlag,
      createdBy: req.user._id,
    });

    course.lectures.push(lecture._id);
    await course.save();

    const enrollments = await Enrollment.find({
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    }).select("student");

    await Promise.all(
      enrollments.map((e) => updateUnifiedProgress(e.student, courseId)),
    );

    const courseForNotify = await Course.findById(courseId).select("title");
    notifySafe(() =>
      onLecturePublished({
        course: { _id: course._id, title: courseForNotify?.title || "" },
        lectureDoc: lecture,
      }),
    );

    res.status(201).json({ message: "Lecture added successfully", lecture });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ======================
// UPDATE LECTURE
// ======================
export const updateLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    const course = await requireCourseTeacherOrAdmin(req, courseId, res);
    if (!course) return;

    const lecture = await Lecture.findOne({ _id: lectureId, course: courseId });
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found in this course" });
    }

    const { title, description, videoUrl, vimeoVideoId, duration, order, isFreePreview,
      contentType, fileUrl, fileName, linkUrl, linkLabel, textContent,
      attachments: rawAttachments } = req.body;

    const level = req.body.level
      ? typeof req.body.level === "string"
        ? JSON.parse(req.body.level)
        : req.body.level
      : undefined;

    if (title !== undefined) lecture.title = title;
    if (description !== undefined) lecture.description = description;

    if (rawAttachments !== undefined) {
      if (Array.isArray(rawAttachments)) {
        lecture.attachments = rawAttachments
          .filter((a) => a && typeof a.url === "string" && a.url.trim())
          .slice(0, 5)
          .map((a) => ({ url: a.url.trim(), fileName: (a.fileName || "").trim() }));
      } else {
        lecture.attachments = [];
      }
    }
    if (level) lecture.level = level;
    if (order !== undefined) lecture.order = Number(order);
    if (contentType && ["video", "file", "link", "text"].includes(contentType)) {
      lecture.contentType = contentType;
    }
    if (fileUrl !== undefined) lecture.fileUrl = fileUrl;
    if (fileName !== undefined) lecture.fileName = fileName;
    if (linkUrl !== undefined) lecture.linkUrl = linkUrl;
    if (linkLabel !== undefined) lecture.linkLabel = linkLabel;
    if (textContent !== undefined) lecture.textContent = textContent;

    if (isFreePreview !== undefined) {
      lecture.isFreePreview = Boolean(isFreePreview);
    }

    if (duration !== undefined && duration !== "") {
      lecture.duration = Number(duration);
    }

    if (vimeoVideoId !== undefined) {
      const t = vimeoVideoId == null ? "" : String(vimeoVideoId).trim();
      if (t === "") {
        lecture.vimeoVideoId = "";
      } else {
        const raw = t.replace(/\D/g, "");
        if (!/^\d{3,20}$/.test(raw)) {
          return res.status(400).json({ message: "Invalid vimeoVideoId" });
        }
        lecture.vimeoVideoId = raw;
        lecture.videoUrl = `https://vimeo.com/${raw}`;
      }
    } else if (videoUrl) {
      const videoUrlCheck = parseHttpUrl(videoUrl);
      if (!videoUrlCheck.ok) {
        return res.status(400).json({ message: videoUrlCheck.message });
      }
      lecture.videoUrl = videoUrlCheck.value;
      let vid = "";
      try {
        const u = new URL(lecture.videoUrl);
        if (u.hostname.includes("vimeo.com")) {
          const parts = u.pathname.split("/").filter(Boolean);
          const n = parts.find((p) => /^\d+$/.test(p));
          if (n) vid = n;
        }
      } catch {
        /* ignore */
      }
      lecture.vimeoVideoId = vid || "";
      if (duration !== undefined && duration !== null && duration !== "") {
        const d = Number(duration);
        if (!Number.isNaN(d)) lecture.duration = d;
      }
    }

    await lecture.save();

    res.status(200).json({ message: "Lecture updated successfully", lecture });
  } catch (error) {
    console.error("Error updating lecture:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ======================
// GET LECTURES
// ======================
export const getLecturesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const course = await Course.findById(courseId).select("teacher");
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

    const populatedCourse = await Course.findById(courseId).populate({
      path: "lectures",
      model: "Lecture",
      populate: { path: "createdBy", select: "name email" },
    });

    res.status(200).json({ lectures: populatedCourse.lectures });
  } catch (error) {
    console.error("Error fetching lectures:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ======================
// MARK LECTURE COMPLETE
// ======================
export const markLectureAsComplete = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const studentId = req.user._id;

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    });

    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course" });
    }

    const lecture = await Lecture.findOne({
      _id: lectureId,
      course: courseId,
    });

    if (!lecture) {
      return res
        .status(400)
        .json({ message: "Lecture does not belong to this course" });
    }

    await CourseCompletion.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $addToSet: { completedLectures: lectureId } },
      { upsert: true },
    );

    const updatedRecord = await updateUnifiedProgress(studentId, courseId);

    res.status(200).json({
      message: "Lecture marked as complete",
      completedLectures: updatedRecord.completedLectures,
      progress: updatedRecord.progress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================
// STUDENT: ACKNOWLEDGE LECTURE (self "reviewed" — does not change progress %)
// ======================
export const toggleLectureAcknowledgment = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const acknowledged = Boolean(req.body?.acknowledged);

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const studentId = req.user._id;

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    });

    if (!enrollment) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    const lecture = await Lecture.findOne({
      _id: lectureId,
      course: courseId,
    });

    if (!lecture) {
      return res.status(400).json({ message: "Lecture does not belong to this course" });
    }

    const course = await Course.findById(courseId).select("lectures");
    const validLectureIds = new Set((course?.lectures || []).map((id) => id.toString()));

    let doc = await CourseCompletion.findOne({ student: studentId, course: courseId });

    if (!doc) {
      doc = await CourseCompletion.create({
        student: studentId,
        course: courseId,
        completedLectures: [],
        completedTasks: [],
        acknowledgedLectures: [],
        progress: 0,
        isCompleted: false,
      });
    }

    const ackSet = new Set((doc.acknowledgedLectures || []).map((id) => id.toString()));
    if (acknowledged) {
      ackSet.add(lectureId.toString());
    } else {
      ackSet.delete(lectureId.toString());
    }

    doc.acknowledgedLectures = [...ackSet].filter((id) => validLectureIds.has(id));
    await doc.save();

    res.status(200).json({
      acknowledgedLectures: doc.acknowledgedLectures.map((id) => id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================
// DELETE LECTURE
// ======================
export const deleteLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only teachers can delete lectures" });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    if (lecture.course.toString() !== courseId) {
      return res
        .status(400)
        .json({ message: "Lecture does not belong to this course" });
    }

    const course = await requireCourseTeacherOrAdmin(req, courseId, res);
    if (!course) return;

    await Lecture.findByIdAndDelete(lectureId);

    await Course.updateOne(
      { _id: courseId },
      { $pull: { lectures: lectureId } },
    );

    const enrollments = await Enrollment.find({
      course: courseId,
      ...activeOrLegacyEnrollmentFilter,
    }).select("student");

    await Promise.all(
      enrollments.map((e) => updateUnifiedProgress(e.student, courseId)),
    );

    res.status(200).json({ message: "Lecture deleted successfully" });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    res.status(500).json({ message: "Server error" });
  }
};
