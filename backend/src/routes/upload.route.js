import express from "express";
import multer from "multer";
import {
  uploadfile,
  getMySubmission,
  getMySubmissionsSummaryForCourse,
  deleteMySubmission,
} from "../controllers/uploadfile.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", protectRoute, upload.single("file"), uploadfile);

router.get(
  "/submissions/me/course/:courseId",
  protectRoute,
  getMySubmissionsSummaryForCourse,
);
router.get("/submissions/me/:taskId", protectRoute, getMySubmission);
router.delete(
  "/submissions/me/:courseId/:taskId",
  protectRoute,
  deleteMySubmission,
);

export default router;
