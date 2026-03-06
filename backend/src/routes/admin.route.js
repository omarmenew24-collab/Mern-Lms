import { protectRoute, adminOnly } from "../middlewares/auth.middleware.js";
import { getAllUsers , softDeleteUser , changeUserRole , getDashboardStats , getUserById } from "../controllers/admin.controller.js";
import express from "express";

const router = express.Router();

router.get("/dashboardstats", protectRoute, getDashboardStats)
router.get("/users", protectRoute, adminOnly, getAllUsers);
router.delete("/users/:id", protectRoute, adminOnly, softDeleteUser);
router.patch("/users/:id/role", protectRoute, adminOnly, changeUserRole);
router.get("/users/:userId", protectRoute, adminOnly, getUserById);





export default router