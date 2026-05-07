import nodemailer from "nodemailer";

/** "From" header: prefer SMTP_FROM; EMAIL_FROM is supported for older .env setups. */
function mailFrom() {
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || "";
}

/**
 * SMTP is optional. When not configured, email verification is skipped at signup
 * (existing behavior: immediate tokens). See auth.controller signup.
 */
export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      mailFrom(),
  );
}

let transporter;

function getTransporter() {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure =
      String(process.env.SMTP_SECURE || "").toLowerCase() === "true" ||
      port === 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    throw new Error("SMTP is not configured");
  }
  await tx.sendMail({
    from: mailFrom(),
    to,
    subject,
    text,
    html: html || text,
  });
}
