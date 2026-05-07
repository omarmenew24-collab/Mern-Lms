import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { connectDB } from "./src/lib/db.js";
import { COOKIE_AUTH_HEADER } from "./src/lib/cookieAuthHeader.js";
import { apiLimiter } from "./src/middlewares/rateLimit.middleware.js";
// Routes
import AuthRoutes from "./src/routes/auth.route.js";
import CourseRoutes from "./src/routes/course.route.js";
import PaymentRoutes from "./src/routes/payment.route.js";
import ManualPaymentRoutes from "./src/routes/manualPayment.route.js";
import UploadRoutes from "./src/routes/upload.route.js";
import LectureRoutes from "./src/routes/lecture.route.js";
import TeachingRoutes from "./src/routes/teaching.route.js";
import TaskRoutes from "./src/routes/task.route.js";
import AdminRoutes from "./src/routes/admin.route.js";
import NotificationRoutes from "./src/routes/notification.route.js";
import RefundRoutes from "./src/routes/refund.route.js";
import ChargebackRoutes from "./src/routes/chargeback.route.js";
import {
  getPublicAbout,
  getPublicHomeAnnouncement,
  getPublicWhyLearn,
  getPublicMoneyBackGuarantee,
  getPublicSiteBranding,
} from "./src/controllers/admin.controller.js";

// Import Webhook Controller directly
import { webhook } from "./src/controllers/webhook.controller.js";


dotenv.config();
const app = express();

// --- 1. WEBHOOK (MOUNTED DIRECTLY) ---
// By using app.post here, we guarantee express.json() hasn't parsed the body yet.
app.post("/api/webhook", express.raw({ type: "application/json" }), webhook);

// --- 2. MIDDLEWARE ---

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mern-lms-frontend-kcn4.onrender.com",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", COOKIE_AUTH_HEADER],
  }),
);

// Parse cookies
app.use(cookieParser());

// This JSON parser will now only apply to routes BELOW it
app.use(express.json());

app.set("trust proxy", 1);

app.use("/api", apiLimiter);

// Public (no auth)
app.get("/api/public/home-announcement", getPublicHomeAnnouncement);
app.get("/api/public/site-branding", getPublicSiteBranding);
app.get("/api/public/about", getPublicAbout);
app.get("/api/public/why-learn", getPublicWhyLearn);
app.get("/api/public/money-back-guarantee", getPublicMoneyBackGuarantee);

// --- 3. ROUTES ---
app.use("/api", ManualPaymentRoutes);
app.use("/api", PaymentRoutes);
app.use("/api", AuthRoutes);
app.use("/api", CourseRoutes);
app.use("/api", UploadRoutes);
app.use("/api", LectureRoutes);
app.use("/api", TeachingRoutes);
app.use("/api", TaskRoutes);
app.use("/api", AdminRoutes);
app.use("/api", NotificationRoutes);
app.use("/api", RefundRoutes);
app.use("/api", ChargebackRoutes);

// --- START SERVER ---
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server started at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed: database is unavailable.");
    process.exit(1);
  }
};

startServer();
