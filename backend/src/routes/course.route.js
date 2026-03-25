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
  deletecourse,
  getcoursesbyteacher
} from "../controllers/course.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.post("/createcourse", protectRoute, createcourse);

router.delete("/deletecourse/:courseId", protectRoute, deletecourse)

// this needs a protection
router.post("/togglecertificate/:courseId/:studentId",protectRoute,toggleCertificatePermission)


router.get("/courses/enrolled",protectRoute, getstudentcourses);


router.get("/teacher/:teacherId/enrollments", protectRoute, getTeacherEnrollments);

router.get("/courses/:courseId/students",protectRoute, getStudentsByCourse);

router.get(
  "/course/:courseId/student/:studentId/submissions",protectRoute,
  getStudentSubmissionsByCourse
);


router.get("/progress/:courseId", protectRoute, getCourseProgress);

router.get("/progress/bulk/:courseId",protectRoute, getBulkCourseProgress)

router.get("/courses/teacher", protectRoute, getcoursesbyteacher);


export default router;
