import { protectRoute, adminOnly } from "../middlewares/auth.middleware.js";
import {
  getAllUsers,
  softDeleteUser,
  getDashboardStats,
  getUserById,
  getAdminUserLearnerSnapshots,
  getDashboardAnalytics,
  getFinanceOverview,
  getSiteSettings,
  patchSiteSettings,
} from "../controllers/admin.controller.js";
import { getStudentEnrolledCoursesForAdmin } from "../controllers/course.controller.js";
import {
  exportUsersCsv,
  exportCoursesCsv,
  exportPaymentsCsv,
  exportEnrollmentsCsv,
  exportRefundsCsv,
  exportManualPaymentsCsv,
} from "../controllers/adminExport.controller.js";
import express from "express";

const router = express.Router();

router.get("/dashboardstats", protectRoute,adminOnly, getDashboardStats)
router.get("/dashboard-analytics", protectRoute, adminOnly, getDashboardAnalytics);
router.get("/finance-overview", protectRoute, adminOnly, getFinanceOverview);
router.get("/users", protectRoute, adminOnly, getAllUsers);
router.delete("/users/:id", protectRoute, adminOnly, softDeleteUser);
router.get(
  "/users/:userId/enrolled-courses",
  protectRoute,
  adminOnly,
  getStudentEnrolledCoursesForAdmin,
);
router.get(
  "/users/:userId/learner-snapshots",
  protectRoute,
  adminOnly,
  getAdminUserLearnerSnapshots,
);
router.get("/users/:userId", protectRoute, adminOnly, getUserById);
router.get("/site-settings", protectRoute, adminOnly, getSiteSettings);
router.patch("/site-settings", protectRoute, adminOnly, patchSiteSettings);

/** CSV exports (admin bookkeeping & operations) */
router.get("/admin/exports/users", protectRoute, adminOnly, exportUsersCsv);
router.get("/admin/exports/courses", protectRoute, adminOnly, exportCoursesCsv);
router.get("/admin/exports/payments", protectRoute, adminOnly, exportPaymentsCsv);
router.get("/admin/exports/enrollments", protectRoute, adminOnly, exportEnrollmentsCsv);
router.get("/admin/exports/refunds", protectRoute, adminOnly, exportRefundsCsv);
router.get("/admin/exports/manual-payments", protectRoute, adminOnly, exportManualPaymentsCsv);





export default router