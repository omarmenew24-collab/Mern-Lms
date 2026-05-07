import express from "express";
import {
  paymentIntent,
  enrollatcourse,
  bulkEnrollAtCourse,
  checkenrollment,
  getCoursePayments,
  getAdminFinancePayments,
  syncPaymentIntent,
} from "../controllers/payment.controller.js";
import { adminOnly, protectRoute } from "../middlewares/auth.middleware.js";
import { paymentWriteLimiter } from "../middlewares/rateLimit.middleware.js";



const router = express.Router();

router.post(
  "/create-payment-intent",
  paymentWriteLimiter,
  protectRoute,
  paymentIntent,
);

router.post(
  "/sync-payment-intent",
  paymentWriteLimiter,
  protectRoute,
  syncPaymentIntent,
);


router.post(
  "/enroll/:courseId/bulk",
  protectRoute,
  adminOnly,
  bulkEnrollAtCourse,
);

router.post(
  "/enroll/:courseId/:studentId",
  protectRoute,
  adminOnly,
  enrollatcourse,
);




router.get("/check/:courseId/:studentId", protectRoute, checkenrollment);

router.get(
  "/admin/courses/:courseId/payments",
  protectRoute,
  adminOnly,
  getCoursePayments,
);

router.get(
  "/admin/payments",
  protectRoute,
  adminOnly,
  getAdminFinancePayments,
);

export default router;
