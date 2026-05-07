import {
  COOKIE_AUTH_HEADER,
  COOKIE_AUTH_HEADER_VALUE,
} from "../lib/cookieAuthHeader.js";

/** Browsers still send cookies on simple cross-site requests; a non-simple header does not. */
export function requireCookieAuthHeader(req, res, next) {
  if (req.get(COOKIE_AUTH_HEADER) !== COOKIE_AUTH_HEADER_VALUE) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}
