import express from "express";
import { protectRoute, adminOnly } from "../middlewares/auth.middleware.js";
import {
  getPublicRefundPolicy,
  getRefundEligibility,
  listMyRefundRequests,
  createRefundRequest,
  listAdminRefundRequests,
  getAdminRefundRequest,
  updateAdminRefundRequest,
} from "../controllers/refund.controller.js";

const router = express.Router();

router.get("/public/refund-policy", getPublicRefundPolicy);
router.get("/refunds/eligibility/:courseId", protectRoute, getRefundEligibility);
router.get("/refunds/mine", protectRoute, listMyRefundRequests);
router.post("/refunds", protectRoute, createRefundRequest);

router.get("/admin/refunds", protectRoute, adminOnly, listAdminRefundRequests);
router.get("/admin/refunds/:id", protectRoute, adminOnly, getAdminRefundRequest);
router.patch("/admin/refunds/:id", protectRoute, adminOnly, updateAdminRefundRequest);

export default router;
