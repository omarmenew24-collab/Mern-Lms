import express from "express";
import multer from "multer";
import {
  login,
  signup,
  logout,
  getuserpicture,
  updateuserprofile,
  getPublicUserProfile,
  getteachers,
  googleauth,
  refreshController,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { requireCookieAuthHeader } from "../middlewares/cookieAuthHeader.middleware.js";
import {
  loginLimiter,
  refreshLimiter,
  signupLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/public/user/:userId", getPublicUserProfile);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", signupLimiter, resendVerification);
router.post("/forgot-password", loginLimiter, forgotPassword);
router.post("/reset-password", loginLimiter, resetPassword);

router.post("/signup", signupLimiter, upload.single("image"), signup);
router.post("/login", loginLimiter, login);
router.post("/logout", requireCookieAuthHeader, logout); // httpOnly cookie + server session
router.put(
  "/updateuserprofile/:userId",
  protectRoute,
  upload.single("image"),
  updateuserprofile,
);
router.get("/user/:id/picture", getuserpicture);
router.get("/teachers", getteachers);
// GET courses by a specific teacher

//const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/auth/google", loginLimiter, googleauth);

// Cookie-mutating POSTs: rate limit + non-simple header (see cookieAuthHeader middleware).
router.post(
  "/refresh",
  refreshLimiter,
  requireCookieAuthHeader,
  refreshController,
);


export default router;
