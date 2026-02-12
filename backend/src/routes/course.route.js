import express from "express";
import {
  createcourse,
  getstudentcourses,
  getTeacherEnrollments,
  getStudentsByCourse,
  getStudentSubmissionsByCourse,
  getCourseProgress,
  getBulkCourseProgress,
  toggleCertificatePermission,
  deletecourse
} from "../controllers/course.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.post("/createcourse", createcourse);

router.delete("/deletecourse/:courseId", protectRoute, deletecourse)

// this needs a protection
router.post("/togglecertificate/:courseId/:studentId",toggleCertificatePermission)


router.get("/courses/enrolled",protectRoute, getstudentcourses);


router.get("/teacher/:teacherId/enrollments", getTeacherEnrollments);

router.get("/courses/:courseId/students", getStudentsByCourse);

router.get(
  "/course/:courseId/student/:studentId/submissions",
  getStudentSubmissionsByCourse
);



router.get("/progress/:courseId", protectRoute, getCourseProgress);

router.get("/progress/bulk/:courseId",protectRoute, getBulkCourseProgress)

export default router;
