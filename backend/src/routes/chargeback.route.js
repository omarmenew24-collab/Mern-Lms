import express from "express";
import { protectRoute, adminOnly } from "../middlewares/auth.middleware.js";
import {
  listChargebacks,
  getChargeback,
  createChargeback,
  patchChargeback,
  refreshChargebackEvidence,
  exportChargebackPdf,
} from "../controllers/chargeback.controller.js";

const router = express.Router();

router.get("/admin/chargebacks", protectRoute, adminOnly, listChargebacks);
router.post("/admin/chargebacks", protectRoute, adminOnly, createChargeback);
router.get("/admin/chargebacks/:id/export.pdf", protectRoute, adminOnly, exportChargebackPdf);
router.post("/admin/chargebacks/:id/refresh-evidence", protectRoute, adminOnly, refreshChargebackEvidence);
router.get("/admin/chargebacks/:id", protectRoute, adminOnly, getChargeback);
router.patch("/admin/chargebacks/:id", protectRoute, adminOnly, patchChargeback);

export default router;
