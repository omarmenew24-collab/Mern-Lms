import Course from "../models/course.model.js";
import {
  createTusUploadPlaceholder,
  isVimeoUploadConfigured,
} from "../lib/vimeoService.js";

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

/**
 * For UI: is Vimeo upload available on the server.
 */
export const getVimeoUploadStatus = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const { courseId } = req.params;
    const course = await requireCourseTeacherOrAdmin(req, courseId, res);
    if (!course) return;
    return res.status(200).json({ configured: isVimeoUploadConfigured() });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

/**
 * Body: { fileName?: string, fileSize: number }
 * Returns: { videoId, uploadLink, uri } for TUS (browser) upload to Vimeo.
 */
export const postInitVimeoUpload = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only teachers or admins" });
    }

    const { courseId } = req.params;
    const course = await requireCourseTeacherOrAdmin(req, courseId, res);
    if (!course) return;

    if (!isVimeoUploadConfigured()) {
      return res.status(503).json({
        message:
          "Vimeo is not configured. Set VIMEO_ACCESS_TOKEN in the server .env (Vimeo app → create access token with upload + edit scopes) and restart the API.",
        configured: false,
      });
    }

    const fileName =
      typeof req.body?.fileName === "string" ? req.body.fileName : "lecture.mp4";
    const fileSize = Number(req.body?.fileSize);
    if (Number.isNaN(fileSize) || fileSize < 1) {
      return res.status(400).json({ message: "fileSize (bytes) is required" });
    }

    const { videoId, uploadLink, uri } = await createTusUploadPlaceholder({
      name: fileName,
      fileSizeBytes: fileSize,
    });
    return res.status(200).json({ videoId, uploadLink, uri });
  } catch (e) {
    const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 500;
    if (status >= 500) console.error("postInitVimeoUpload", e);
    return res.status(status).json({ message: e.message || "Server error" });
  }
};
