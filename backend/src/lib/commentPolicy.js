import SiteSettings from "../models/siteSettings.model.js";

let cached;
let cacheAt = 0;
const CACHE_MS = 5000;

/**
 * @returns {Promise<{ commentsGloballyDisabled: boolean }>}
 */
export async function getSiteCommentSettings() {
  const now = Date.now();
  if (cached && now - cacheAt < CACHE_MS) {
    return cached;
  }
  let doc = await SiteSettings.findById("global").lean();
  if (!doc) {
    await SiteSettings.findOneAndUpdate(
      { _id: "global" },
      { $setOnInsert: { commentsGloballyDisabled: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).catch(() => {});
    doc = await SiteSettings.findById("global").lean();
  }
  const settings = {
    commentsGloballyDisabled: Boolean(doc?.commentsGloballyDisabled),
  };
  cached = settings;
  cacheAt = now;
  return settings;
}

export function invalidateCommentSettingsCache() {
  cached = null;
  cacheAt = 0;
}

/**
 * When comments are “locked”, only platform admin or the course teacher may post or reply.
 */
export function canBypassCommentLock(user, course) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "teacher" && course?.teacher) {
    return String(course.teacher) === String(user._id);
  }
  return false;
}

/**
 * @param {import("mongoose").Document|object} course — must have teacher, commentsDisabled
 * @param {{ commentsGloballyDisabled: boolean }} site
 */
export function isCommentSectionLockedForPublic(site, course) {
  if (site?.commentsGloballyDisabled) return true;
  return Boolean(course?.commentsDisabled);
}
