import express from "express";
import Stripe from "stripe";
import { webhook } from "../controllers/webhook.controller.js";

const router = express.Router();



router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhook
 
);

export default router;