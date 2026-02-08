import express from "express";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import Stripe from "stripe";
import cors from "cors";
import Enrollment from "../models/enrollment.model.js";
import { paymentIntent , enrollatcourse , checkenrollment} from "../controllers/payment.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";



const router = express.Router();


// Your Secret Test Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


router.post("/create-payment-intent",protectRoute,paymentIntent );


router.post("/enroll/:courseId/:studentId",enrollatcourse);




router.get("/check/:courseId/:studentId",checkenrollment );

export default router;
