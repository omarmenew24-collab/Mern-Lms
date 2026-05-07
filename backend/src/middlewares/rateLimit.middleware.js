import rateLimit from "express-rate-limit";

const jsonMessage = (message) => ({ message });

const skipStripeWebhook = (req) => {
  const path = req.originalUrl || req.url || "";
  return path.includes("webhook");
};

/** Broad cap for all /api routes (webhook excluded). */
export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 400,
  message: jsonMessage("Too many requests, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipStripeWebhook,
});

/** Login and Google auth — credential attempts. */
export const loginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 15,
  message: jsonMessage("Too many login attempts, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
});

/** Signup — separate window to limit throwaway accounts. */
export const signupLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_SIGNUP_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_SIGNUP_MAX) || 8,
  message: jsonMessage("Too many signup attempts, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
});

/** Refresh can spike legitimately; still bounded. */
export const refreshLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_REFRESH_WINDOW_MS) || 5 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_REFRESH_MAX) || 120,
  message: jsonMessage("Too many refresh attempts, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
});

/** Payment intent creation / sync. */
export const paymentWriteLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_PAYMENT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PAYMENT_MAX) || 60,
  message: jsonMessage("Too many payment requests, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
});

