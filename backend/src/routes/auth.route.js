import express from "express";
import {
  login,
  signup,
  logout,
  getuserpicture,
  updateuserprofile,
  checkAuth,
  getteachers,
  getcourses,
  googleauth,
  authme,
  refreshController
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.put("/updateuserprofile/:userId", updateuserprofile);
router.get("/user/:id/picture", getuserpicture);
router.get("/teachers", getteachers);
router.get("/courses", getcourses);
// GET courses by a specific teacher

//const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/auth/google", googleauth);

// routes/auth.js

router.get("/auth/me", checkAuth, authme);
router.post("/refresh", refreshController);


export default router;
