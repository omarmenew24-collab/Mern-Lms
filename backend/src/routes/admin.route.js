import { getDashboardStats } from "../controllers/admin.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import express from "express";

const router = express.Router();

router.get("/dashboardstats", protectRoute, getDashboardStats)

export default router