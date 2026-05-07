/** Block login, refresh, and API access for disabled accounts. */
export function isUserAllowedAccess(user) {
  if (!user) return false;
  if (user.isDeleted === true) return false;
  if (user.status && user.status !== "active") return false;
  return true;
}
