import jwt from "jsonwebtoken";
import { sendMail, isMailConfigured } from "./sendMail.js";

const JWT_ALG = "HS256";

function frontendBase() {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

export function buildPasswordResetToken(userId) {
  return jwt.sign(
    { pwd: 1, sub: String(userId) },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h", algorithm: JWT_ALG },
  );
}

export function verifyPasswordResetToken(token) {
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
  if (decoded.pwd !== 1 || !decoded.sub) {
    return { ok: false, reason: "invalid_token" };
  }
  return { ok: true, userId: decoded.sub };
}

export async function sendPasswordResetEmail(user) {
  if (!isMailConfigured()) return;

  const token = buildPasswordResetToken(user._id);
  const resetUrl = `${frontendBase()}/reset-password?token=${encodeURIComponent(token)}`;

  await sendMail({
    to: user.email,
    subject: "Reset your password",
    text: `Hi ${user.name},\n\nWe received a request to reset your password. Open this link (valid 1 hour):\n${resetUrl}\n\nIf you did not ask for this, ignore this email.`,
    html: `<p>Hi ${escapeHtml(user.name)},</p><p>We received a request to reset your password. Click below (link valid 1 hour):</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not ask for this, ignore this email.</p>`,
  });
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
