import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
// DB
import { connectDB } from "./src/lib/db.js";
// Routes
import AuthRoutes from './src/routes/auth.route.js';
import CourseRoutes from './src/routes/course.route.js';
import PaymentRoutes from './src/routes/payment.route.js';
import UploadRoutes from './src/routes/upload.route.js';
import LectureRoutes from './src/routes/lecture.route.js';
import TeachingRoutes from './src/routes/teaching.route.js';
import TaskRoutes from './src/routes/task.route.js';

// Import Webhook Controller directly
import { webhook } from "./src/controllers/webhook.controller.js";

dotenv.config();
const app = express();

// --- 1. WEBHOOK (MOUNTED DIRECTLY) ---
// By using app.post here, we guarantee express.json() hasn't parsed the body yet.
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhook
);

// --- 2. MIDDLEWARE ---
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// This JSON parser will now only apply to routes BELOW it
app.use(express.json());

app.use(cookieParser());
app.use(
  session({ secret: "secretkey", resave: false, saveUninitialized: false })
);

app.use(passport.initialize());
app.use(passport.session());

// --- 3. ROUTES ---
app.use("/api", PaymentRoutes);
app.use("/api", AuthRoutes);
app.use("/api", CourseRoutes);
app.use("/api", UploadRoutes);
app.use("/api", LectureRoutes)
app.use("/api", TeachingRoutes)
app.use("/api", TaskRoutes)


// --- START SERVER ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started at: http://localhost:${PORT}`);
  connectDB();
});