import express from "express";
import {
  deletetask,
  updatetask,
  gradesubmission,
  markTaskAsComplete,
  createtask,
  gettasks,
  submissions
 
  
} from "../controllers/task.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/courses/:courseId/tasks", protectRoute, createtask);

router.post("/submissions/:taskId/:studentId",protectRoute, gradesubmission)

router.post("/courses/task/:courseId/:taskId",protectRoute, markTaskAsComplete)

router.get("/courses/:courseId/gettasks", protectRoute, gettasks);

router.delete("/courses/:courseId/tasks/:taskId", protectRoute, deletetask);

router.put("/courses/:courseId/tasksupdate/:taskId", protectRoute, updatetask);

router.get("/submissions/:taskId", protectRoute, submissions);

export default router;

