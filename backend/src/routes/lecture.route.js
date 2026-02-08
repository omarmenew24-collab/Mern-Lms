import express from "express";
import {
  createLecture,
  deleteLecture,
  getLecturesByCourse,
  markLectureAsComplete,
 
} from "../controllers/lecture.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/courses/lecture/:courseId/:lectureId",protectRoute, markLectureAsComplete )

router.delete("/courses/lecture/:courseId/:lectureId",protectRoute, deleteLecture )

router.post("/course/:courseId/createLecture", createLecture);

router.get("/course/:courseId/lectures", getLecturesByCourse);

export default router;