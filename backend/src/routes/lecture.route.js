import express from "express";
import {
  createLecture,
  updateLecture,
  deleteLecture,
  getLecturesByCourse,
  markLectureAsComplete,
  toggleLectureAcknowledgment,
} from "../controllers/lecture.controller.js";
import {
  getVimeoUploadStatus,
  postInitVimeoUpload,
} from "../controllers/vimeoLecture.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

/** Vimeo TUS: teacher gets upload_link, browser uploads to Vimeo, then createLecture with vimeo id. */
router.get(
  "/course/:courseId/lectures/vimeo/upload-status",
  protectRoute,
  getVimeoUploadStatus,
);
router.post(
  "/course/:courseId/lectures/vimeo/init-upload",
  protectRoute,
  postInitVimeoUpload,
);

/** JSON body: title, description, videoUrl, vimeoVideoId (optional), level, order, duration */
router.post("/course/:courseId/createLecture", protectRoute, createLecture);

router.patch(
  "/course/:courseId/lecture/:lectureId",
  protectRoute,
  updateLecture,
);

router.get("/course/:courseId/lectures", protectRoute, getLecturesByCourse);

router.patch(
  "/courses/lecture/:courseId/:lectureId/acknowledge",
  protectRoute,
  toggleLectureAcknowledgment,
);

router.post(
  "/courses/lecture/:courseId/:lectureId",
  protectRoute,
  markLectureAsComplete,
);

router.delete(
  "/courses/lecture/:courseId/:lectureId",
  protectRoute,
  deleteLecture,
);

export default router;
