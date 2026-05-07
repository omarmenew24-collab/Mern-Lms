import express from "express"
import { createteachingrequest, getteachingrequests,reviewrequest,deleterequest } from "../controllers/teaching.controller.js";
import { protectRoute, adminOnly } from "../middlewares/auth.middleware.js"

const router = express.Router();

router.post("/createteachingrequest", createteachingrequest);

router.get("/getteachingrequests", protectRoute, adminOnly, getteachingrequests);

router.put("/reviewrequest/:id", protectRoute, adminOnly, reviewrequest);

router.delete("/deleterequest", protectRoute, adminOnly, deleterequest);

export default router;
