import jwt from "jsonwebtoken";
import UserSession from "../models/userSession.model.js";
import { isUserAllowedAccess } from "../lib/userAccess.js";

/** Prevents "alg: none" / unexpected algorithms if a token is ever tampered with. */
const ACCESS_JWT_OPTIONS = { algorithms: ["HS256"] };

/**
 * Load current user from DB only if the access token's `sid` matches an active session.
 * Uses DB user fields (e.g. role), not JWT claims, so role changes apply immediately.
 */
export async function loadUserFromAccessPayload(decoded) {
  // lean converts from mongodb document to javasrcipt object
  if (!decoded?.sid || !decoded?._id) return null;
  const session = await UserSession.findOne({
    _id: decoded.sid,
    user: decoded._id,
  })
    .populate({ path: "user", select: "-password" })
    .lean();

  if (!session?.user) return null;
  if (!isUserAllowedAccess(session.user)) return null;

  return { ...session.user, sid: String(session._id) };
}

const authenticateBearerAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token Provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      ACCESS_JWT_OPTIONS,
    );
    const user = await loadUserFromAccessPayload(decoded);

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized - Session invalid or expired",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("authenticateBearerAccessToken:", error.message);
    return res
      .status(401)
      .json({ message: "Unauthorized - Invalid or Expired Token" });
  }
};

export const protectRoute = authenticateBearerAccessToken;

export const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied - Admins only" });
    }

    next();
  } catch (error) {
    console.log("Error in adminOnly middleware:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/** Admin or teacher (instructor) — for controlled announcements, not open to students. */
export const adminOrTeacherOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role === "admin" || req.user.role === "teacher") {
      return next();
    }
    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    console.log("Error in adminOrTeacherOnly:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
