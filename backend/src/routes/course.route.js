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
  getCourseRosterLearnerSnapshots,
  getCourseCurriculumAnalytics,
  getCourseInstructorActivity,
  getCourseTaskAnalytics,
  getLearnerEnrollmentSnapshotSingle,
  recordCourseWorkspaceVisit,
  toggleCertificatePermission,
  deletecourse,
  getcoursesbyteacher,
  getTeacherDashboard,
  getStudentDashboard,
  getcourses,
  getAllCoursesForAdmin,
  getCourseById,
  updateCourseDetails,
  setCoursePublished,
  softDeleteCourse,
  publishCourseAsInstructor,
} from "../controllers/course.controller.js";
import {
  getPublicCourse,
  getRatingSummary,
  getMyRating,
  upsertRating,
} from "../controllers/rating.controller.js";
import { downloadCourseCertificatePdf } from "../controllers/certificate.controller.js";
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

router.get("/courses/:courseId/certificate/pdf", protectRoute, downloadCourseCertificatePdf);

router.get("/courses/enrolled", protectRoute, getstudentcourses);
router.get("/courses/student/dashboard", protectRoute, getStudentDashboard);


router.get("/teacher/:teacherId/enrollments", protectRoute, getTeacherEnrollments);

router.get("/courses/:courseId/students",protectRoute, getStudentsByCourse);

router.get(
  "/course/:courseId/student/:studentId/submissions",protectRoute,
  getStudentSubmissionsByCourse
);


router.get("/progress/:courseId", protectRoute, getCourseProgress);

router.get("/progress/bulk/:courseId",protectRoute, getBulkCourseProgress)

router.get("/courses/teacher", protectRoute, getcoursesbyteacher);
router.get("/courses/teacher/dashboard", protectRoute, getTeacherDashboard);

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

router.get(
  "/courses/:courseId/roster-learners",
  protectRoute,
  getCourseRosterLearnerSnapshots,
);
router.get(
  "/courses/:courseId/curriculum-analytics",
  protectRoute,
  getCourseCurriculumAnalytics,
);
router.get(
  "/courses/:courseId/instructor-activity",
  protectRoute,
  getCourseInstructorActivity,
);
router.get(
  "/courses/:courseId/task-analytics",
  protectRoute,
  getCourseTaskAnalytics,
);
router.get(
  "/courses/:courseId/learners/:studentId/snapshot",
  protectRoute,
  getLearnerEnrollmentSnapshotSingle,
);
router.post(
  "/courses/:courseId/workspace-visits",
  protectRoute,
  recordCourseWorkspaceVisit,
);

router.get("/courses/:courseId", protectRoute, getCourseById);
router.patch("/courses/:courseId", protectRoute, upload.single("image"), updateCourseDetails);

router.patch("/courses/:courseId/publish", protectRoute, adminOnly, setCoursePublished);
router.post("/courses/:courseId/publish", protectRoute, publishCourseAsInstructor);

router.patch("/courses/:courseId/soft-delete", protectRoute, adminOnly, softDeleteCourse);



export default router;
