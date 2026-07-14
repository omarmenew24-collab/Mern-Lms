import express from "express";
import { protectRoute, adminOnly } from "../middlewares/auth.middleware.js";
import { paymentWriteLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  validateCheckoutCoupon,
  listAdminCoupons,
  createAdminCoupon,
  patchAdminCoupon,
} from "../controllers/coupon.controller.js";

const router = express.Router();

router.post(
  "/coupons/validate",
  protectRoute,
  paymentWriteLimiter,
  validateCheckoutCoupon,
);

router.get("/coupons/admin", protectRoute, adminOnly, listAdminCoupons);
router.post(
  "/coupons/admin",
  protectRoute,
  adminOnly,
  paymentWriteLimiter,
  createAdminCoupon,
);
router.patch(
  "/coupons/admin/:id",
  protectRoute,
  adminOnly,
  paymentWriteLimiter,
  patchAdminCoupon,
);

export default router;
