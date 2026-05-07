/** Must match frontend `VITE_COOKIE_AUTH_HEADER_*` (case-insensitive over HTTP). */
export const COOKIE_AUTH_HEADER = "x-cookie-auth";
export const COOKIE_AUTH_HEADER_VALUE =
  process.env.COOKIE_AUTH_HEADER_VALUE || "1";
