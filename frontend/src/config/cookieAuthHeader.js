export const COOKIE_AUTH_HEADER = "X-Cookie-Auth";
export const COOKIE_AUTH_HEADER_VALUE =
  import.meta.env.VITE_COOKIE_AUTH_HEADER_VALUE || "1";

/** Matches axios `config.url` (path only or with base path) for cookie-auth POSTs. */
export function isRefreshOrLogoutUrl(url) {
  if (!url) return false;
  const p = url.split("?")[0];
  return (
    p === "/refresh" ||
    p === "refresh" ||
    p.endsWith("/refresh") ||
    p === "/logout" ||
    p === "logout" ||
    p.endsWith("/logout")
  );
}
