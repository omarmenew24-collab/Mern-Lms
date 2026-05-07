import SiteSettings from "../models/siteSettings.model.js";

/** Shown on new installs and when migrating old `SiteSettings` without this field. */
export const DEFAULT_PLATFORM_CATEGORIES = [
  "Web development",
  "Mobile development",
  "Data science & analytics",
  "Machine learning & AI",
  "DevOps & cloud",
  "Design & UX",
  "Business & productivity",
  "Language learning",
  "Test preparation",
  "Personal development",
  "IT & software",
  "Security & networking",
];

export function normalizePlatformCourseCategoryList(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const x of raw) {
    const s = String(x ?? "")
      .trim()
      .slice(0, 80);
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length >= 100) break;
  }
  return out;
}

/**
 * Resolves the global category list, seeding defaults once for legacy documents
 * where `platformCourseCategories` was never set. An explicit empty array is
 * left as [] (admin cleared the list on purpose).
 */
export async function getPlatformCategoryNamesForApi() {
  let doc = await SiteSettings.findById("global").lean();

  if (!doc) {
    await SiteSettings.create({
      _id: "global",
      commentsGloballyDisabled: false,
      homeAnnouncement: "",
      platformCourseCategories: DEFAULT_PLATFORM_CATEGORIES,
    });
    return [...DEFAULT_PLATFORM_CATEGORIES];
  }

  if (doc.platformCourseCategories === undefined) {
    const updated = await SiteSettings.findOneAndUpdate(
      { _id: "global" },
      { $set: { platformCourseCategories: DEFAULT_PLATFORM_CATEGORIES } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    return Array.isArray(updated?.platformCourseCategories)
      ? updated.platformCourseCategories
      : [...DEFAULT_PLATFORM_CATEGORIES];
  }

  return Array.isArray(doc.platformCourseCategories) ? doc.platformCourseCategories : [];
}
