import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { sendMail, isMailConfigured } from "./sendMail.js";

const JWT_ALG = "HS256";

function publicApiBase() {
  const raw = process.env.API_PUBLIC_URL || "";
  const trimmed = String(raw).replace(/\/$/, "");
  if (trimmed) return trimmed;
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

export function buildEmailVerificationToken(userId) {
  return jwt.sign(
    { ev: 1, sub: String(userId) },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "48h", algorithm: JWT_ALG },
  );
}

export async function sendVerificationEmail(user) {
  if (!isMailConfigured()) return;

  const token = buildEmailVerificationToken(user._id);
  const verifyUrl = `${publicApiBase()}/api/verify-email?token=${encodeURIComponent(token)}`;

  await sendMail({
    to: user.email,
    subject: "Verify your email",
    text: `Hi ${user.name},\n\nPlease verify your email by opening this link (valid 48 hours):\n${verifyUrl}\n\nIf you did not create an account, ignore this message.`,
    html: `<p>Hi ${escapeHtml(user.name)},</p><p>Please verify your email by clicking below (link valid 48 hours):</p><p><a href="${verifyUrl}">Verify email</a></p><p>If you did not create an account, ignore this message.</p>`,
  });
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Validates token and marks user verified. Returns { ok, user } or { ok: false, reason }.
 */
export async function verifyEmailFromToken(token) {
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing_token" };
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      algorithms: [JWT_ALG],
    });
  } catch {
    return { ok: false, reason: "invalid_or_expired" };
  }
  if (decoded.ev !== 1 || !decoded.sub) {
    return { ok: false, reason: "invalid_token" };
  }

  const user = await User.findById(decoded.sub);
  if (!user) return { ok: false, reason: "user_not_found" };

  if (user.emailVerified !== false) {
    return { ok: true, user, already: true };
  }

  user.emailVerified = true;
  await user.save();
  return { ok: true, user, already: false };
}
