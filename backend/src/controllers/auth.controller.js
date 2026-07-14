import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import UserSession, { sessionTtlMs } from "../models/userSession.model.js";
import { isUserAllowedAccess } from "../lib/userAccess.js";
import { isMailConfigured } from "../lib/sendMail.js";
import {
  sendVerificationEmail,
  verifyEmailFromToken,
} from "../lib/emailVerification.js";
import {
  sendPasswordResetEmail,
  verifyPasswordResetToken,
} from "../lib/passwordReset.js";
import bcrypt from "bcrypt"; // or "bcrypt"
import { generateAccessToken, generateRefreshToken } from "../lib/utils.js";
import { uploadImage } from "../lib/cloudinaryupload.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import axios from "axios";

const isProduction = process.env.NODE_ENV === "production";

/** Trim ends only (same at signup + login) so accidental spaces from paste/mobile do not break auth. */
function normalizePasswordFromBody(pw) {
  return typeof pw === "string" ? pw.trim() : "";
}

function publicUserFields(u) {
  if (!u) return null;
  return {
    _id: u._id,
    name: u.name,
    role: u.role,
    email: u.email || "",
    picture: u.picture || "",
    publicAbout: typeof u.publicAbout === "string" ? u.publicAbout : "",
    publicProjectLinks: Array.isArray(u.publicProjectLinks) ? u.publicProjectLinks : [],
    notificationEmailEnabled: u.notificationEmailEnabled !== false,
    notificationLevel: u.notificationLevel === "important" ? "important" : "all",
  };
}

const MAX_PUBLIC_LINKS = 10;

function normalizePublicProjectLinks(raw) {
  if (raw == null) return [];
  const arr = Array.isArray(raw) ? raw : [];
  const out = [];
  for (const item of arr) {
    if (out.length >= MAX_PUBLIC_LINKS) break;
    const s = String(item).trim().slice(0, 500);
    if (!s) continue;
    if (!/^https:\/\//i.test(s) && !/^http:\/\//i.test(s)) continue;
    out.push(s);
  }
  return out;
}

/**
 * No auth. Safe subset for marketing profile pages.
 */
export const getPublicUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({
      _id: userId,
      isDeleted: { $ne: true },
    }).select("name picture role publicAbout publicProjectLinks status createdAt");

    if (!user) {
      return res.status(404).json({ message: "Profile not found" });
    }
    if (user.status === "suspended") {
      return res.status(404).json({ message: "Profile not found" });
    }

    let publishedCourses = [];
    if (user.role === "teacher") {
      publishedCourses = await Course.find({
        teacher: user._id,
        isPublished: true,
        isDeleted: { $ne: true },
        status: "published",
      })
        .select("title _id")
        .sort({ updatedAt: -1 })
        .limit(40)
        .lean();
    }

    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        picture: user.picture || "",
        role: user.role,
        publicAbout: typeof user.publicAbout === "string" ? user.publicAbout : "",
        publicProjectLinks: Array.isArray(user.publicProjectLinks) ? user.publicProjectLinks : [],
        createdAt: user.createdAt,
      },
      publishedCourses: publishedCourses.map((c) => ({ _id: c._id, title: c.title })),
    });
  } catch (error) {
    console.error("getPublicUserProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const REFRESH_JWT_OPTIONS = { algorithms: ["HS256"] }; // reject non-HS256 JWT "alg"

/** bcrypt of "timing-mitigation-placeholder" @ cost 10 — used when no password row so login timing does not leak user existence */
const BCRYPT_LOGIN_TIMING_DUMMY =
  "$2b$10$hE2soXsaBky6780NH6K74u09k6twneBDmYBIO6vonbRMCmnuu4nZC";

/** Cross-site SPA + API in prod needs SameSite=None; must pair with Secure. */
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

/** New login/signup/Google sign-in: one browser = one `UserSession`; other devices keep their own sessions. */
async function issueTokensForNewSession(res, user, req) {
  await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }).catch((e) => {
    console.warn("[auth] lastLogin update failed:", e?.message);
  });

  const rawUa = req?.headers?.["user-agent"];
  const userAgent =
    typeof rawUa === "string" ? rawUa.slice(0, 512) : "";
  const session = await UserSession.create({
    user: user._id,
    userAgent,
    expiresAt: new Date(Date.now() + sessionTtlMs),
  });
  const accessToken = generateAccessToken(user, session._id);
  const refreshToken = generateRefreshToken(
    user,
    session._id,
    session.refreshTokenVersion,
  );
  setRefreshTokenCookie(res, refreshToken);
  return { accessToken };
}

export const signup = async (req, res) => {
  try {
    let { name, password, email } = req.body;
    password = normalizePasswordFromBody(password);

    // 1️⃣ Normalize input
    name = name?.toLowerCase().trim();
    email = email?.toLowerCase().trim();

    // 2️⃣ Validate input
    if (!name || !password || !email) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // 3️⃣ Check if user exists (email OR name)
    const existingUser = await User.findOne({
      $or: [{ email }, { name }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const picture = req.file ? await uploadImage(req.file.path) : undefined;

    const wantsVerification = isMailConfigured();

    // 5️⃣ Create user (emailVerified false only when we will send a verification email)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
      emailVerified: !wantsVerification,
      ...(picture ? { picture } : {}),
    });

    if (wantsVerification) {
      try {
        await sendVerificationEmail(newUser);
      } catch (mailErr) {
        console.error("Verification email failed:", mailErr.message);
        await User.findByIdAndDelete(newUser._id);
        return res.status(503).json({
          message:
            "Could not send verification email. Check SMTP settings or try again later.",
        });
      }
      return res.status(201).json({
        message:
          "Account created. Check your email and click the link to verify before signing in.",
        needsVerification: true,
        email: newUser.email,
      });
    }

    const { accessToken } = await issueTokensForNewSession(res, newUser, req);

    return res.status(201).json({
      message: "Signup successful",
      accessToken,
      userResponse: publicUserFields(newUser),
    });

  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};



export const login = async (req, res) => {
  try {
    const { name } = req.body;
    const password = normalizePasswordFromBody(req.body.password);

    if (!name || !password) {
      return res.status(400).json({
        message: "Name and password are required",
      });
    }

    const user = await User.findOne({ name: name.toLowerCase() });
    const hashForCompare = user?.password || BCRYPT_LOGIN_TIMING_DUMMY;
    const passwordOk = await bcrypt.compare(password, hashForCompare);
    // One bcrypt path for unknown vs known user; access still gated below.
    const loginAllowed =
      user &&
      user.password &&
      passwordOk &&
      isUserAllowedAccess(user);

    if (!loginAllowed) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // --- Dev escape hatch: fake / unreachable emails can still sign in locally. ---
    // Set DEV_ALLOW_UNVERIFIED_LOGIN=true in backend .env only while NODE_ENV=development.
    // Remove the flag or set false before any production deploy; do not rely on this for real security.
    const allowUnverifiedPasswordLogin =
      process.env.NODE_ENV === "development" &&
      process.env.DEV_ALLOW_UNVERIFIED_LOGIN === "true";

    if (user.emailVerified === false && !allowUnverifiedPasswordLogin) {
      return res.status(403).json({
        message:
          "Please verify your email before signing in. Check your inbox or use “Resend” on the check-email page (linked after sign-up).",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }
    if (user.emailVerified === false && allowUnverifiedPasswordLogin) {
      console.warn(
        "[auth] DEV_ALLOW_UNVERIFIED_LOGIN: allowing password login without verified email for",
        user.email,
      );
    }

    const { accessToken } = await issueTokensForNewSession(res, user, req);

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      userResponse: publicUserFields(user),
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET,
          REFRESH_JWT_OPTIONS,
        );
        if (decoded.sid && typeof decoded.rv === "number") {
          await UserSession.deleteOne({
            _id: decoded.sid,
            user: decoded._id,
          });
        }
      } catch {
        /* stale or tampered cookie — still clear client cookie */
      }
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error in logout controller", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


export const updateuserprofile = async (req, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user?.role === "admin";
    const isSelf = String(req.user._id) === String(userId);
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, picture, notificationEmailEnabled, notificationLevel, publicAbout, publicProjectLinks } = req.body;

    const updates = {};
    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }

    if (req.file) {
      updates.picture = await uploadImage(req.file.path);
    } else if (typeof picture === "string") {
      updates.picture = picture.trim();
    }

    if (isSelf || isAdmin) {
      if (publicAbout !== undefined) {
        updates.publicAbout =
          typeof publicAbout === "string" ? publicAbout.trim().slice(0, 4000) : "";
      }
      if (publicProjectLinks !== undefined) {
        let raw = publicProjectLinks;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw);
          } catch {
            raw = [];
          }
        }
        updates.publicProjectLinks = normalizePublicProjectLinks(raw);
      }
    }

    if (isSelf) {
      const ne = notificationEmailEnabled;
      if (typeof ne === "boolean") {
        updates.notificationEmailEnabled = ne;
      } else if (ne === "true" || ne === "false") {
        updates.notificationEmailEnabled = ne === "true";
      }
      if (notificationLevel === "all" || notificationLevel === "important") {
        updates.notificationLevel = notificationLevel;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: publicUserFields(updatedUser),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};

export const getuserpicture = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || !user.picture) return res.status(404).send("No picture");

  const response = await axios.get(user.picture, {
    responseType: "arraybuffer",
  });
  res.set("Content-Type", "image/jpeg");
  res.send(response.data);
};

export const getteachers = async (req, res) => {
  try {
    const { searchquery } = req.query; // take from query params
    let filter = { role: "teacher" };

    if (searchquery) {
      filter.name = { $regex: searchquery, $options: "i" }; // case-insensitive
    }

    const teachers = await User.find(filter).select("_id name");
    res.status(200).json(teachers);
    console.log("teachers are:", teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};






const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleauth = async (req, res) => {
  try {
    const { token } = req.body;

    // 1️⃣ Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    let { sub, email, name, picture } = payload;

    // 2️⃣ Normalize
    email = email?.toLowerCase().trim();
    name = name?.trim();

    // 3️⃣ Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        googleId: sub,
        email,
        name,
        picture,
        role: "student",
        emailVerified: true,
      });
    } else {
      if (!user.googleId) {
        user.googleId = sub;
        user.picture = user.picture || picture;
      }
      user.emailVerified = true;
      await user.save();
    }

    if (!isUserAllowedAccess(user)) {
      return res.status(401).json({
        message: "Account is not available",
      });
    }

    const { accessToken } = await issueTokensForNewSession(res, user, req);

    // 6️⃣ Response
    return res.status(200).json({
      message: "Login successful",
      accessToken,
      userResponse: publicUserFields(user),
    });

  } catch (err) {
    console.error("Google login error:", err);
    return res.status(401).json({
      message: "Invalid Google token",
    });
  }
};

/**
 * Rotates refresh: atomic match on sid + user + rv + unexpired session bumps `rv`,
 * so a stolen old refresh JWT fails after one successful use. Returns new access + user
 * so the SPA does not need a separate /me round-trip.
 */
export const refreshController = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  let decoded;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      REFRESH_JWT_OPTIONS,
    );
  } catch {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  if (typeof decoded.rv !== "number" || !decoded.sid) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  const session = await UserSession.findOneAndUpdate(
    {
      _id: decoded.sid,
      user: decoded._id,
      refreshTokenVersion: decoded.rv,
      expiresAt: { $gt: new Date() },
    },
    {
      $inc: { refreshTokenVersion: 1 },
      $set: { expiresAt: new Date(Date.now() + sessionTtlMs) },
    },
    { new: true },
  );

  if (!session) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  const user = await User.findById(decoded._id).select("-password");
  if (!user) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  if (!isUserAllowedAccess(user)) {
    await UserSession.deleteOne({ _id: decoded.sid, user: decoded._id });
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  const accessToken = generateAccessToken(user, session._id);
  const newRefreshToken = generateRefreshToken(
    user,
    session._id,
    session.refreshTokenVersion,
  );

  setRefreshTokenCookie(res, newRefreshToken);

  return res.status(200).json({
    accessToken,
    user: publicUserFields(user),
  });
};

/** GET — link from verification email; redirects to frontend login with query flag. */
export const verifyEmail = async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const result = await verifyEmailFromToken(token);
  const fe = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  if (!result.ok) {
    return res.redirect(`${fe}/login?verify=error`);
  }
  return res.redirect(`${fe}/login?verify=success`);
};

/** POST { email } — resend verification (password accounts only, unverified). */
export const resendVerification = async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : "";
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!isMailConfigured()) {
      return res.status(503).json({
        message: "Email verification is not enabled on this server.",
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password || user.emailVerified !== false) {
      return res.status(200).json({
        message: "If an account needs verification, check your inbox for a new link.",
      });
    }

    await sendVerificationEmail(user);
    return res.status(200).json({
      message: "Check your inbox for a new verification link.",
    });
  } catch (e) {
    console.error("resendVerification:", e.message);
    return res.status(500).json({ message: "Could not send email. Try again later." });
  }
};

const GENERIC_FORGOT_RESPONSE = {
  message:
    "If an account exists for that email, you will receive reset instructions shortly.",
};

/** POST { email } — send password reset link (password-based accounts only). */
export const forgotPassword = async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : "";
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!isMailConfigured()) {
      return res.status(503).json({
        message: "Password reset by email is not configured on this server.",
      });
    }

    const user = await User.findOne({ email });
    if (!user?.password || !isUserAllowedAccess(user)) {
      return res.status(200).json(GENERIC_FORGOT_RESPONSE);
    }

    try {
      await sendPasswordResetEmail(user);
    } catch (mailErr) {
      console.error("forgotPassword mail:", mailErr.message);
      return res.status(500).json({
        message: "Could not send email. Try again later.",
      });
    }

    return res.status(200).json(GENERIC_FORGOT_RESPONSE);
  } catch (e) {
    console.error("forgotPassword:", e.message);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

/** POST { token, password } — set new password from email link. */
export const resetPassword = async (req, res) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const password = normalizePasswordFromBody(req.body?.password);

    if (!token) {
      return res.status(400).json({ message: "Reset link is missing or invalid." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    const vr = verifyPasswordResetToken(token);
    if (!vr.ok) {
      return res.status(400).json({
        message: "This reset link is invalid or has expired. Request a new one.",
      });
    }

    const user = await User.findById(vr.userId);
    if (!user?.password || !isUserAllowedAccess(user)) {
      return res.status(400).json({
        message: "This reset link is no longer valid.",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    await UserSession.deleteMany({ user: user._id });

    return res.status(200).json({
      message: "Password updated. You can sign in with your name and new password.",
    });
  } catch (e) {
    console.error("resetPassword:", e.message);
    return res.status(500).json({ message: "Could not reset password. Try again." });
  }
};
