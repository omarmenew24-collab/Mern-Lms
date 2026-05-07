import express from "express";
import multer from "multer";
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
  getcoursesbyteacher,
  getcourses,
  getAllCoursesForAdmin,
  getCourseById,
  updateCourseDetails,
  setCoursePublished,
  softDeleteCourse,
  submitCourseForReview,
  reviewCourse,
} from "../controllers/course.controller.js";
import {
  getPublicCourse,
  getRatingSummary,
  getMyRating,
  upsertRating,
} from "../controllers/rating.controller.js";
import {
  listCourseComments,
  createCourseComment,
  deleteCourseComment,
} from "../controllers/comment.controller.js";
import {
  listCourseCategories,
  createCourseCategory,
  deleteCourseCategory,
} from "../controllers/courseCategory.controller.js";
import { adminOnly, protectRoute } from "../middlewares/auth.middleware.js";


const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/createcourse", protectRoute, upload.single("image"), createcourse);

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

router.get("/course-categories", protectRoute, listCourseCategories);
router.post("/course-categories", protectRoute, createCourseCategory);
router.delete("/course-categories/:id", protectRoute, deleteCourseCategory);

router.get("/courses", getcourses);
router.get("/admin/courses-all", protectRoute, adminOnly, getAllCoursesForAdmin);

router.get("/courses/:courseId/public", getPublicCourse);

router.get("/courses/:courseId/ratings/summary", getRatingSummary);
router.get("/courses/:courseId/ratings/me", protectRoute, getMyRating);
router.post("/courses/:courseId/ratings", protectRoute, upsertRating);

router.get("/courses/:courseId/comments", listCourseComments);
router.post("/courses/:courseId/comments", protectRoute, createCourseComment);
router.delete(
  "/courses/:courseId/comments/:commentId",
  protectRoute,
  deleteCourseComment,
);

router.get("/courses/:courseId", protectRoute, getCourseById);
router.patch("/courses/:courseId", protectRoute, upload.single("image"), updateCourseDetails);

router.patch("/courses/:courseId/publish", protectRoute, adminOnly, setCoursePublished);
router.post("/courses/:courseId/submit-review", protectRoute, submitCourseForReview);
router.patch("/courses/:courseId/review", protectRoute, adminOnly, reviewCourse);

router.patch("/courses/:courseId/soft-delete", protectRoute, adminOnly, softDeleteCourse);



export default router;
