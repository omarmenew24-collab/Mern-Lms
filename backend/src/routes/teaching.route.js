import express from "express"
import { createteachingrequest, getteachingrequests,reviewrequest,deleterequest } from "../controllers/teaching.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js"

const router = express.Router();

router.post("/createteachingrequest", createteachingrequest);

router.get("/getteachingrequests",protectRoute,getteachingrequests)

router.put("/reviewrequest/:id",protectRoute, reviewrequest);

router.delete("/deleterequest",protectRoute, deleterequest);

export default router;
