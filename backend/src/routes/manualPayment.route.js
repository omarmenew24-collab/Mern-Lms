import express from "express";
import multer from "multer";
import { protectRoute, adminOnly } from "../middlewares/auth.middleware.js";
import { paymentWriteLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  getPublicManualPaymentMethods,
  getAdminManualPaymentMethods,
  createManualPaymentMethod,
  patchManualPaymentMethod,
  createManualPaymentOrder,
  listMyManualPaymentOrders,
  getMyManualPaymentOrder,
  submitManualPaymentProof,
  listAdminManualPaymentOrders,
  getAdminManualPaymentOrder,
  approveManualPaymentOrder,
  rejectManualPaymentOrder,
} from "../controllers/manualPayment.controller.js";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.mimetype);
    cb(ok ? null : new Error("INVALID_FILE_TYPE"), ok);
  },
});

const router = express.Router();

router.get("/manual-payments/methods", getPublicManualPaymentMethods);

router.get("/manual-payments/admin/methods", protectRoute, adminOnly, getAdminManualPaymentMethods);
router.post(
  "/manual-payments/admin/methods",
  protectRoute,
  adminOnly,
  paymentWriteLimiter,
  createManualPaymentMethod,
);
router.patch(
  "/manual-payments/admin/methods/:id",
  protectRoute,
  adminOnly,
  paymentWriteLimiter,
  patchManualPaymentMethod,
);

router.post(
  "/manual-payments/orders",
  protectRoute,
  paymentWriteLimiter,
  createManualPaymentOrder,
);
router.get("/manual-payments/my-orders", protectRoute, listMyManualPaymentOrders);
router.get("/manual-payments/my-orders/:id", protectRoute, getMyManualPaymentOrder);
router.post(
  "/manual-payments/my-orders/:id/proof",
  protectRoute,
  paymentWriteLimiter,
  (req, res, next) => {
    upload.single("receipt")(req, res, (err) => {
      if (!err) return next();
      if (err.message === "INVALID_FILE_TYPE") {
        return res.status(400).json({
          message: "Invalid file type. Use JPG, PNG, WebP, or PDF.",
        });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large (max 5 MB)." });
      }
      return next(err);
    });
  },
  submitManualPaymentProof,
);

router.get(
  "/manual-payments/admin/orders",
  protectRoute,
  adminOnly,
  listAdminManualPaymentOrders,
);
router.get(
  "/manual-payments/admin/orders/:id",
  protectRoute,
  adminOnly,
  getAdminManualPaymentOrder,
);
router.post(
  "/manual-payments/admin/orders/:id/approve",
  protectRoute,
  adminOnly,
  paymentWriteLimiter,
  approveManualPaymentOrder,
);
router.post(
  "/manual-payments/admin/orders/:id/reject",
  protectRoute,
  adminOnly,
  paymentWriteLimiter,
  rejectManualPaymentOrder,
);

export default router;
