import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import SiteSettings from "../models/siteSettings.model.js";
import { invalidateCommentSettingsCache } from "../lib/commentPolicy.js";
import {
  getPlatformCategoryNamesForApi,
  normalizePlatformCourseCategoryList,
} from "../lib/platformCourseCategories.js";
import { parseHttpUrl } from "../lib/safeHttpUrl.js";

/** Shown on GET /api/public/about when DB body is empty. */
export const DEFAULT_ABOUT_PAGE_TITLE = "About CourseAcademy";
export const DEFAULT_ABOUT_PAGE_BODY = `Welcome to CourseAcademy — a learning space for structured online courses, clear progress, and collaboration between instructors and students.

What you can do
Browse the catalog, enroll in courses, watch lectures, complete tasks, and track your learning in one place. When your instructor enables it, you may receive certificates that reflect your progress.

For instructors
Publish courses, organize lectures and assignments, review submissions, and support learners from each course’s workspace. Admins and teachers use the same platform with role-appropriate tools.

How it works
Create an account, explore courses, and add them to your cart to enroll. After purchase (where applicable), open the course workspace to learn at your own pace. Notifications keep you updated on what matters in your account.

Get help
Use the links in the site footer, or message your course instructor from the course page.`;

/** Rich default About (blocks) when DB has no custom blocks or body. */
export const DEFAULT_ABOUT_PAGE_BLOCKS = [
  { type: "heading", heading: "Built for real teaching and real learning" },
  {
    type: "paragraph",
    text: "We’re an online school platform: structured courses, video lessons, assignments, and progress in one place. Whether you’re growing a small academy or joining as a learner, everything stays clear and easy to follow.",
  },
  {
    type: "image",
    imageUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Man working on a laptop at a desk",
  },
  {
    type: "split",
    imageUrl:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Man at a desk with a laptop and monitor",
    heading: "For learners",
    text: "Browse the catalog, read full course pages, and enroll when you’re ready. Follow lectures, submit tasks, and see your progress in the course workspace. When your school enables it, you can earn certificates and keep lifetime access to what you’ve purchased.",
  },
  { type: "heading", heading: "What you can do here" },
  {
    type: "bullets",
    title: "As a student",
    items: [
      "Search and filter courses, then add them to your cart and check out securely",
      "Watch lessons and track completion in a dedicated workspace per course",
      "Leave ratings and join discussions where your school allows it",
    ],
  },
  {
    type: "split",
    imageUrl:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Two men meeting and collaborating in an office",
    heading: "For instructors & schools",
    text: "Publish courses, upload lectures, create assignments, and support your learners from one hub. Admins and teachers have tools that match their role, so a small team can run a full catalog without juggling spreadsheets and scattered links.",
  },
  { type: "heading", heading: "Need help?" },
  {
    type: "paragraph",
    text: "Use the links in the site footer, or go to your course and contact your instructor — they’re the best people for content questions. Platform issues can be directed to your school’s admin team.",
  },
];

/** Home "Why learn" when DB has no custom cards. */
export const DEFAULT_WHY_LEARN = {
  title: "Why learn on",
  titleHighlight: "CourseAcademy?",
  subtitle:
    "The best learning experience, designed for both learners and teachers.",
  cards: [
    {
      title: "Secure payments",
      desc: "All transactions protected with Stripe. Your payments are safe and reliable.",
      icon: "shield",
      color: "brand",
    },
    {
      title: "Expert-led courses",
      desc: "Access top-notch courses created by industry experts to enhance your skills.",
      icon: "bookOpen",
      color: "emerald",
    },
    {
      title: "Share your expertise",
      desc: "Become an instructor and reach thousands of eager learners on the platform.",
      icon: "share2",
      color: "amber",
    },
  ],
};

const MAX_ABOUT_BLOCKS = 40;
const MAX_WHY_LEARN_CARDS = 20;
const WHY_LEARN_ICONS = new Set([
  "shield",
  "bookOpen",
  "share2",
  "zap",
  "target",
  "users",
  "globe",
  "heart",
  "lightbulb",
  "award",
  "lineChart",
  "graduationCap",
  "checkCircle",
  "layers",
  "messageCircle",
  "briefcase",
  "laptop",
  "sparkles",
]);
const WHY_LEARN_COLORS = new Set([
  "brand",
  "emerald",
  "amber",
  "violet",
  "rose",
  "cyan",
  "sky",
]);

function normalizeWhyLearnCards(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const c of raw.slice(0, MAX_WHY_LEARN_CARDS)) {
    if (!c || typeof c !== "object") continue;
    const title = String(c.title || "")
      .trim()
      .slice(0, 200);
    if (!title) continue;
    const desc = String(c.desc || "")
      .trim()
      .slice(0, 2000);
    const icon = String(c.icon || "sparkles")
      .trim()
      .toLowerCase();
    const color = String(c.color || "brand")
      .trim()
      .toLowerCase();
    out.push({
      title,
      desc,
      icon: WHY_LEARN_ICONS.has(icon) ? icon : "sparkles",
      color: WHY_LEARN_COLORS.has(color) ? color : "brand",
    });
  }
  return out;
}

const DEFAULT_SITE_DISPLAY_NAME = "CourseAcademy";
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";

const DEFAULT_BRANDING = {
  siteDisplayName: DEFAULT_SITE_DISPLAY_NAME,
  heroBadgeText: "New courses added weekly",
  heroTitleLine1: "Learning that gets",
  heroTitleHighlight: "you ahead",
  heroSubtitle:
    "Skills for your present and your future. Get started with expert-led courses designed for real outcomes.",
  heroImageUrl: DEFAULT_HERO_IMAGE,
  heroPrimaryCtaLabel: "Get started",
  heroSecondaryCtaLabel: "Browse courses",
  heroTrustLine1: "Expert instructors",
  heroTrustLine2: "Lifetime access",
  heroTrustLine3: "Secure payments",
};

function brandingStr(doc, key, fallback) {
  const v = doc && typeof doc[key] === "string" ? doc[key].trim() : "";
  return v || fallback;
}

/** Resolved branding for public home / header (defaults when unset). */
export function getPublicBrandingPayload(doc) {
  const d = doc || {};
  const B = DEFAULT_BRANDING;
  return {
    siteDisplayName: brandingStr(d, "siteDisplayName", B.siteDisplayName).slice(0, 48),
    heroBadgeText: brandingStr(d, "heroBadgeText", B.heroBadgeText).slice(0, 120),
    heroTitleLine1: brandingStr(d, "heroTitleLine1", B.heroTitleLine1).slice(0, 120),
    heroTitleHighlight: brandingStr(d, "heroTitleHighlight", B.heroTitleHighlight).slice(0, 80),
    heroSubtitle: brandingStr(d, "heroSubtitle", B.heroSubtitle).slice(0, 600),
    heroImageUrl: brandingStr(d, "heroImageUrl", B.heroImageUrl).slice(0, 500),
    heroPrimaryCtaLabel: brandingStr(d, "heroPrimaryCtaLabel", B.heroPrimaryCtaLabel).slice(0, 40),
    heroSecondaryCtaLabel: brandingStr(d, "heroSecondaryCtaLabel", B.heroSecondaryCtaLabel).slice(0, 40),
    heroTrustLine1: brandingStr(d, "heroTrustLine1", B.heroTrustLine1).slice(0, 80),
    heroTrustLine2: brandingStr(d, "heroTrustLine2", B.heroTrustLine2).slice(0, 80),
    heroTrustLine3: brandingStr(d, "heroTrustLine3", B.heroTrustLine3).slice(0, 80),
  };
}

const getPublicWhyLearnPayload = (doc) => {
  const w = DEFAULT_WHY_LEARN;
  const t =
    typeof doc?.whyLearnTitle === "string" && doc.whyLearnTitle.trim()
      ? doc.whyLearnTitle.trim().slice(0, 200)
      : w.title;
  const th =
    typeof doc?.whyLearnTitleHighlight === "string"
      ? doc.whyLearnTitleHighlight.trim().slice(0, 120)
      : w.titleHighlight;
  const sub =
    typeof doc?.whyLearnSubtitle === "string" && doc.whyLearnSubtitle.trim()
      ? doc.whyLearnSubtitle.trim().slice(0, 500)
      : w.subtitle;
  const fromDb = normalizeWhyLearnCards(doc?.whyLearnCards);
  const cards = fromDb.length > 0 ? fromDb : w.cards;
  return { title: t, titleHighlight: th, subtitle: sub, cards };
};

function normalizeAboutPageBlocks(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const b of raw.slice(0, MAX_ABOUT_BLOCKS)) {
    if (!b || typeof b !== "object") continue;
    const type = b.type;
    if (type === "heading") {
      const heading = String(b.heading || b.text || "")
        .trim()
        .slice(0, 200);
      if (heading) out.push({ type: "heading", heading });
    } else if (type === "paragraph") {
      const text = String(b.text || "")
        .trim()
        .slice(0, 8000);
      if (text) out.push({ type: "paragraph", text });
    } else if (type === "bullets") {
      const items = Array.isArray(b.items)
        ? b.items
            .map((x) => String(x).trim().slice(0, 500))
            .filter(Boolean)
            .slice(0, 40)
        : [];
      if (!items.length) continue;
      const title = String(b.title || "")
        .trim()
        .slice(0, 200);
      out.push({
        type: "bullets",
        ...(title ? { title } : {}),
        items,
      });
    } else if (type === "image") {
      const imageUrl = String(b.imageUrl || "")
        .trim()
        .slice(0, 2000);
      if (!/^https?:\/\//i.test(imageUrl)) continue;
      const imageAlt = String(b.imageAlt || "")
        .trim()
        .slice(0, 200);
      out.push({ type: "image", imageUrl, imageAlt: imageAlt || "Image" });
    } else if (type === "split") {
      const imageUrl = String(b.imageUrl || "")
        .trim()
        .slice(0, 2000);
      const text = String(b.text || "")
        .trim()
        .slice(0, 8000);
      if (!/^https?:\/\//i.test(imageUrl) || !text) continue;
      const imageAlt = String(b.imageAlt || "")
        .trim()
        .slice(0, 200);
      const heading = String(b.heading || "")
        .trim()
        .slice(0, 200);
      out.push({
        type: "split",
        imageUrl,
        imageAlt: imageAlt || "Image",
        ...(heading ? { heading } : {}),
        text,
      });
    }
  }
  return out;
}

const formatMonthKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const getLastNMonthBuckets = (months = 6) => {
  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const buckets = [];
  for (let i = 0; i < months; i += 1) {
    const d = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + i, 1);
    const key = formatMonthKey(d);
    buckets.push({
      key,
      label: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }
  return { startDate: firstMonth, buckets };
};

const makeMonthlyCountSeries = async (
  Model,
  dateField,
  months = 6,
  match = {},
) => {
  const { startDate, buckets } = getLastNMonthBuckets(months);
  const rows = await Model.aggregate([
    {
      $match: {
        ...match,
        [dateField]: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: `$${dateField}` },
          month: { $month: `$${dateField}` },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  
  const map = new Map(rows.map((r) => [`${r._id.year}-${String(r._id.month).padStart(2, "0")}`, r.count]));
  return buckets.map((b) => ({
    month: b.label,
    key: b.key,
    value: map.get(b.key) || 0,
  }));
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalPayments = await Payment.countDocuments({ status: "succeeded" });

    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teacher" });

    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalStudents,
      totalTeachers,
      totalPayments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardAnalytics = async (req, res) => {
  try {
    const months = Math.min(Number(req.query.months) || 6, 24);

    const [usersSeries, coursesSeries, enrollmentsSeries, paymentsRows] =
      await Promise.all([
        makeMonthlyCountSeries(User, "createdAt", months),
        makeMonthlyCountSeries(Course, "createdAt", months, {
          isDeleted: { $ne: true },
        }),
        makeMonthlyCountSeries(Enrollment, "enrolledAt", months, {
          status: "active",
        }),
        makeMonthlyCountSeries(Payment, "paidAt", months, {
          status: "succeeded",
        }),
      ]);

    const { startDate, buckets } = getLastNMonthBuckets(months);
    const revenueAgg = await Payment.aggregate([
      {
        $match: {
          status: "succeeded",
          paidAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paidAt" },
            month: { $month: "$paidAt" },
          },
          revenue: { $sum: "$amount" },
        },
      },
    ]);
    const revenueMap = new Map(
      revenueAgg.map((r) => [
        `${r._id.year}-${String(r._id.month).padStart(2, "0")}`,
        Number(r.revenue || 0),
      ]),
    );
    const revenueSeries = buckets.map((b) => ({
      month: b.label,
      key: b.key,
      value: revenueMap.get(b.key) || 0,
    }));

    return res.status(200).json({
      usersGrowth: usersSeries,
      coursesGrowth: coursesSeries,
      enrollmentsGrowth: enrollmentsSeries,
      paymentsGrowth: paymentsRows,
      revenueGrowth: revenueSeries,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFinanceOverview = async (req, res) => {
  try {
    const months = Math.min(Number(req.query.months) || 12, 24);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const { startDate, buckets } = getLastNMonthBuckets(months);

    const [totals, monthlyAgg, topCoursesAgg] = await Promise.all([
      Payment.aggregate([
        { $match: { status: "succeeded" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            transactions: { $sum: 1 },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: "succeeded",
            paidAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$paidAt" },
              month: { $month: "$paidAt" },
            },
            revenue: { $sum: "$amount" },
            transactions: { $sum: 1 },
          },
        },
      ]),
      Payment.aggregate([
        { $match: { status: "succeeded" } },
        {
          $group: {
            _id: "$course",
            revenue: { $sum: "$amount" },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "_id",
            as: "course",
          },
        },
        { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            courseId: "$_id",
            courseTitle: "$course.title",
            revenue: 1,
            transactions: 1,
          },
        },
      ]),
    ]);

    const totalsRow = totals[0] || { totalRevenue: 0, transactions: 0 };
    const monthlyMap = new Map(
      monthlyAgg.map((r) => [
        `${r._id.year}-${String(r._id.month).padStart(2, "0")}`,
        {
          revenue: Number(r.revenue || 0),
          transactions: Number(r.transactions || 0),
        },
      ]),
    );
    const monthlySeries = buckets.map((b) => ({
      month: b.label,
      key: b.key,
      revenue: monthlyMap.get(b.key)?.revenue || 0,
      transactions: monthlyMap.get(b.key)?.transactions || 0,
    }));

    return res.status(200).json({
      summary: {
        totalRevenue: Number(totalsRow.totalRevenue || 0),
        totalTransactions: Number(totalsRow.transactions || 0),
        avgOrderValue:
          Number(totalsRow.transactions || 0) === 0
            ? 0
            : Number(totalsRow.totalRevenue || 0) / Number(totalsRow.transactions),
      },
      monthlySeries,
      topCourses: topCoursesAgg,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });

    res.status(200).json(users);
  } catch (error) {
    console.log("Error fetching users:", error.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Soft delete a user
export const softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Protect admin from deleting themselves
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete an admin" });
    }

    // 3️⃣ Soft delete
    user.isDeleted = true;
    user.status = "suspended"; // optional: suspend immediately
    await user.save();

    res
      .status(200)
      .json({ message: "User deleted successfully (soft delete)" });
  } catch (error) {
    console.log("Soft delete error:", error.message);
    res.status(500).json({ message: "Failed to delete user" });
  }
};


export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // expected: "student" | "teacher" | "admin"

    if (!["student", "teacher", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    res.status(200).json({ message: "Role updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// Get a single user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by ID and not deleted
    const user = await User.findOne({ _id: userId})
      .select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user by ID:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const getPublicAboutPayload = (doc) => {
  const fromDb = normalizeAboutPageBlocks(doc?.aboutPageBlocks);
  const customTitle =
    typeof doc?.aboutPageTitle === "string" && doc.aboutPageTitle.trim()
      ? doc.aboutPageTitle.trim().slice(0, 200)
      : "";
  const title = customTitle || DEFAULT_ABOUT_PAGE_TITLE;

  if (fromDb.length > 0) {
    return { title, useBlocks: true, blocks: fromDb, body: null };
  }

  const customBody =
    typeof doc?.aboutPageBody === "string" && doc.aboutPageBody.trim()
      ? doc.aboutPageBody
      : "";
  if (customBody) {
    return { title, useBlocks: false, blocks: null, body: customBody };
  }

  return {
    title,
    useBlocks: true,
    blocks: DEFAULT_ABOUT_PAGE_BLOCKS,
    body: null,
  };
};

export const getSiteSettings = async (req, res) => {
  try {
    const platformCourseCategories = await getPlatformCategoryNamesForApi();
    const doc = await SiteSettings.findById("global").lean();
    const aboutTitle =
      typeof doc?.aboutPageTitle === "string" ? doc.aboutPageTitle : "";
    const aboutBody = typeof doc?.aboutPageBody === "string" ? doc.aboutPageBody : "";
    const aboutPageBlocks = Array.isArray(doc?.aboutPageBlocks) ? doc.aboutPageBlocks : [];
    const whyLearnCards = Array.isArray(doc?.whyLearnCards) ? doc.whyLearnCards : [];
    const rawRp = Number(doc?.refundPercent);
    const policyRefundPercent = !Number.isFinite(rawRp) ? 100 : Math.min(100, Math.max(1, Math.round(rawRp)));
    return res.status(200).json({
      commentsGloballyDisabled: Boolean(doc?.commentsGloballyDisabled),
      ratingsGloballyDisabled: Boolean(doc?.ratingsGloballyDisabled),
      homeAnnouncement: typeof doc?.homeAnnouncement === "string" ? doc.homeAnnouncement : "",
      refundsEnabled: Boolean(doc?.refundsEnabled),
      refundWindowDays: Math.min(365, Math.max(1, Number(doc?.refundWindowDays) || 14)),
      maxCompletionPercentForRefund: Math.min(
        100,
        Math.max(0, Number(doc?.maxCompletionPercentForRefund) ?? 20),
      ),
      refundPercent: policyRefundPercent,
      refundAutoApprove: Boolean(doc?.refundAutoApprove),
      refundReasonRequired: doc?.refundReasonRequired !== false,
      moneyBackGuaranteeEnabled: Boolean(doc?.moneyBackGuaranteeEnabled),
      moneyBackGuaranteeTitle:
        typeof doc?.moneyBackGuaranteeTitle === "string" ? doc.moneyBackGuaranteeTitle : "",
      moneyBackGuaranteeBody:
        typeof doc?.moneyBackGuaranteeBody === "string" ? doc.moneyBackGuaranteeBody : "",
      moneyBackGuaranteeLinkUrl:
        typeof doc?.moneyBackGuaranteeLinkUrl === "string" ? doc.moneyBackGuaranteeLinkUrl : "",
      platformCourseCategories,
      aboutPageTitle: aboutTitle,
      aboutPageBody: aboutBody,
      aboutPageBlocks,
      defaultAboutPageTitle: DEFAULT_ABOUT_PAGE_TITLE,
      defaultAboutPageBody: DEFAULT_ABOUT_PAGE_BODY,
      defaultAboutPageBlocks: DEFAULT_ABOUT_PAGE_BLOCKS,
      whyLearnTitle: typeof doc?.whyLearnTitle === "string" ? doc.whyLearnTitle : "",
      whyLearnTitleHighlight:
        typeof doc?.whyLearnTitleHighlight === "string" ? doc.whyLearnTitleHighlight : "",
      whyLearnSubtitle: typeof doc?.whyLearnSubtitle === "string" ? doc.whyLearnSubtitle : "",
      whyLearnCards,
      defaultWhyLearn: DEFAULT_WHY_LEARN,
      siteDisplayName: typeof doc?.siteDisplayName === "string" ? doc.siteDisplayName : "",
      heroBadgeText: typeof doc?.heroBadgeText === "string" ? doc.heroBadgeText : "",
      heroTitleLine1: typeof doc?.heroTitleLine1 === "string" ? doc.heroTitleLine1 : "",
      heroTitleHighlight: typeof doc?.heroTitleHighlight === "string" ? doc.heroTitleHighlight : "",
      heroSubtitle: typeof doc?.heroSubtitle === "string" ? doc.heroSubtitle : "",
      heroImageUrl: typeof doc?.heroImageUrl === "string" ? doc.heroImageUrl : "",
      heroPrimaryCtaLabel: typeof doc?.heroPrimaryCtaLabel === "string" ? doc.heroPrimaryCtaLabel : "",
      heroSecondaryCtaLabel: typeof doc?.heroSecondaryCtaLabel === "string" ? doc.heroSecondaryCtaLabel : "",
      heroTrustLine1: typeof doc?.heroTrustLine1 === "string" ? doc.heroTrustLine1 : "",
      heroTrustLine2: typeof doc?.heroTrustLine2 === "string" ? doc.heroTrustLine2 : "",
      heroTrustLine3: typeof doc?.heroTrustLine3 === "string" ? doc.heroTrustLine3 : "",
      defaultBranding: DEFAULT_BRANDING,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/** Public, no auth — for home page banner. */
/** Public, no auth — for /about. */
export const getPublicAbout = async (req, res) => {
  try {
    const doc = await SiteSettings.findById("global").lean();
    const p = getPublicAboutPayload(doc);
    return res.status(200).json({
      title: p.title,
      useBlocks: p.useBlocks,
      blocks: p.blocks,
      body: p.body,
      updatedAt: doc?.updatedAt ? doc.updatedAt.toISOString() : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPublicHomeAnnouncement = async (req, res) => {
  try {
    let doc = await SiteSettings.findById("global").select("homeAnnouncement updatedAt").lean();
    if (!doc) {
      return res.status(200).json({ text: "", updatedAt: null });
    }
    const text = typeof doc.homeAnnouncement === "string" ? doc.homeAnnouncement.trim() : "";
    return res.status(200).json({
      text: text.slice(0, 400),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/** Public — site name + hero copy for header / home (single-tenant branding). */
export const getPublicSiteBranding = async (req, res) => {
  try {
    const doc = await SiteSettings.findById("global").lean();
    const branding = getPublicBrandingPayload(doc);
    return res.status(200).json({
      ...branding,
      updatedAt: doc?.updatedAt ? doc.updatedAt.toISOString() : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/** Public, no auth — home "Why learn" section. */
export const getPublicWhyLearn = async (req, res) => {
  try {
    const doc = await SiteSettings.findById("global").lean();
    const p = getPublicWhyLearnPayload(doc || {});
    return res.status(200).json({
      title: p.title,
      titleHighlight: p.titleHighlight,
      subtitle: p.subtitle,
      cards: p.cards,
      updatedAt: doc?.updatedAt ? doc.updatedAt.toISOString() : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/** Public — optional trust / checkout messaging (not legal advice; admin writes copy). */
export const getPublicMoneyBackGuarantee = async (req, res) => {
  try {
    const doc = await SiteSettings.findById("global").lean();
    if (!doc || !doc.moneyBackGuaranteeEnabled) {
      return res.status(200).json({ enabled: false });
    }
    const titleRaw = typeof doc.moneyBackGuaranteeTitle === "string" ? doc.moneyBackGuaranteeTitle.trim() : "";
    const bodyRaw = typeof doc.moneyBackGuaranteeBody === "string" ? doc.moneyBackGuaranteeBody.trim() : "";
    const linkRaw = typeof doc.moneyBackGuaranteeLinkUrl === "string" ? doc.moneyBackGuaranteeLinkUrl.trim() : "";
    let linkUrl = "";
    if (linkRaw) {
      const p = parseHttpUrl(linkRaw);
      if (p.ok) linkUrl = p.value;
    }
    return res.status(200).json({
      enabled: true,
      title: titleRaw.slice(0, 120) || "Money-back guarantee",
      body: bodyRaw.slice(0, 600),
      linkUrl: linkUrl || null,
      updatedAt: doc?.updatedAt ? doc.updatedAt.toISOString() : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const patchSiteSettings = async (req, res) => {
  try {
    const {
      commentsGloballyDisabled,
      ratingsGloballyDisabled,
      homeAnnouncement,
      platformCourseCategories,
      aboutPageTitle,
      aboutPageBody,
      aboutPageBlocks,
      whyLearnTitle,
      whyLearnTitleHighlight,
      whyLearnSubtitle,
      whyLearnCards,
      refundsEnabled,
      refundWindowDays,
      maxCompletionPercentForRefund,
      refundPercent,
      refundAutoApprove,
      refundReasonRequired,
      moneyBackGuaranteeEnabled,
      moneyBackGuaranteeTitle,
      moneyBackGuaranteeBody,
      moneyBackGuaranteeLinkUrl,
      siteDisplayName,
      heroBadgeText,
      heroTitleLine1,
      heroTitleHighlight,
      heroSubtitle,
      heroImageUrl,
      heroPrimaryCtaLabel,
      heroSecondaryCtaLabel,
      heroTrustLine1,
      heroTrustLine2,
      heroTrustLine3,
    } = req.body;
    if (
      commentsGloballyDisabled === undefined &&
      ratingsGloballyDisabled === undefined &&
      homeAnnouncement === undefined &&
      platformCourseCategories === undefined &&
      aboutPageTitle === undefined &&
      aboutPageBody === undefined &&
      aboutPageBlocks === undefined &&
      whyLearnTitle === undefined &&
      whyLearnTitleHighlight === undefined &&
      whyLearnSubtitle === undefined &&
      whyLearnCards === undefined &&
      refundsEnabled === undefined &&
      refundWindowDays === undefined &&
      maxCompletionPercentForRefund === undefined &&
      refundPercent === undefined &&
      refundAutoApprove === undefined &&
      refundReasonRequired === undefined &&
      moneyBackGuaranteeEnabled === undefined &&
      moneyBackGuaranteeTitle === undefined &&
      moneyBackGuaranteeBody === undefined &&
      moneyBackGuaranteeLinkUrl === undefined &&
      siteDisplayName === undefined &&
      heroBadgeText === undefined &&
      heroTitleLine1 === undefined &&
      heroTitleHighlight === undefined &&
      heroSubtitle === undefined &&
      heroImageUrl === undefined &&
      heroPrimaryCtaLabel === undefined &&
      heroSecondaryCtaLabel === undefined &&
      heroTrustLine1 === undefined &&
      heroTrustLine2 === undefined &&
      heroTrustLine3 === undefined
    ) {
      return res
        .status(400)
        .json({ message: "No valid fields to update" });
    }

    const $set = {};
    if (commentsGloballyDisabled !== undefined) {
      $set.commentsGloballyDisabled = Boolean(commentsGloballyDisabled);
    }
    if (ratingsGloballyDisabled !== undefined) {
      $set.ratingsGloballyDisabled = Boolean(ratingsGloballyDisabled);
    }
    if (homeAnnouncement !== undefined) {
      $set.homeAnnouncement =
        typeof homeAnnouncement === "string"
          ? homeAnnouncement.trim().slice(0, 400)
          : "";
    }
    if (platformCourseCategories !== undefined) {
      $set.platformCourseCategories = normalizePlatformCourseCategoryList(
        platformCourseCategories,
      );
    }
    if (aboutPageTitle !== undefined) {
      $set.aboutPageTitle =
        typeof aboutPageTitle === "string" ? aboutPageTitle.trim().slice(0, 200) : "";
    }
    if (aboutPageBody !== undefined) {
      $set.aboutPageBody =
        typeof aboutPageBody === "string" ? aboutPageBody.slice(0, 20000) : "";
    }
    if (aboutPageBlocks !== undefined) {
      $set.aboutPageBlocks = normalizeAboutPageBlocks(aboutPageBlocks);
    }
    if (whyLearnTitle !== undefined) {
      $set.whyLearnTitle =
        typeof whyLearnTitle === "string" ? whyLearnTitle.trim().slice(0, 200) : "";
    }
    if (whyLearnTitleHighlight !== undefined) {
      $set.whyLearnTitleHighlight =
        typeof whyLearnTitleHighlight === "string"
          ? whyLearnTitleHighlight.trim().slice(0, 120)
          : "";
    }
    if (whyLearnSubtitle !== undefined) {
      $set.whyLearnSubtitle =
        typeof whyLearnSubtitle === "string" ? whyLearnSubtitle.trim().slice(0, 500) : "";
    }
    if (whyLearnCards !== undefined) {
      $set.whyLearnCards = normalizeWhyLearnCards(whyLearnCards);
    }
    if (siteDisplayName !== undefined) {
      $set.siteDisplayName =
        typeof siteDisplayName === "string" ? siteDisplayName.trim().slice(0, 48) : "";
    }
    if (heroBadgeText !== undefined) {
      $set.heroBadgeText = typeof heroBadgeText === "string" ? heroBadgeText.trim().slice(0, 120) : "";
    }
    if (heroTitleLine1 !== undefined) {
      $set.heroTitleLine1 = typeof heroTitleLine1 === "string" ? heroTitleLine1.trim().slice(0, 120) : "";
    }
    if (heroTitleHighlight !== undefined) {
      $set.heroTitleHighlight =
        typeof heroTitleHighlight === "string" ? heroTitleHighlight.trim().slice(0, 80) : "";
    }
    if (heroSubtitle !== undefined) {
      $set.heroSubtitle = typeof heroSubtitle === "string" ? heroSubtitle.trim().slice(0, 600) : "";
    }
    if (heroImageUrl !== undefined) {
      const raw = typeof heroImageUrl === "string" ? heroImageUrl.trim() : "";
      if (!raw) {
        $set.heroImageUrl = "";
      } else {
        const p = parseHttpUrl(raw);
        if (!p.ok) {
          return res.status(400).json({ message: p.message || "Invalid hero image URL" });
        }
        $set.heroImageUrl = p.value.slice(0, 500);
      }
    }
    if (heroPrimaryCtaLabel !== undefined) {
      $set.heroPrimaryCtaLabel =
        typeof heroPrimaryCtaLabel === "string" ? heroPrimaryCtaLabel.trim().slice(0, 40) : "";
    }
    if (heroSecondaryCtaLabel !== undefined) {
      $set.heroSecondaryCtaLabel =
        typeof heroSecondaryCtaLabel === "string" ? heroSecondaryCtaLabel.trim().slice(0, 40) : "";
    }
    if (heroTrustLine1 !== undefined) {
      $set.heroTrustLine1 = typeof heroTrustLine1 === "string" ? heroTrustLine1.trim().slice(0, 80) : "";
    }
    if (heroTrustLine2 !== undefined) {
      $set.heroTrustLine2 = typeof heroTrustLine2 === "string" ? heroTrustLine2.trim().slice(0, 80) : "";
    }
    if (heroTrustLine3 !== undefined) {
      $set.heroTrustLine3 = typeof heroTrustLine3 === "string" ? heroTrustLine3.trim().slice(0, 80) : "";
    }
    if (refundsEnabled !== undefined) {
      $set.refundsEnabled = Boolean(refundsEnabled);
    }
    if (refundWindowDays !== undefined) {
      const n = Number(refundWindowDays);
      if (!Number.isFinite(n) || n < 1 || n > 365) {
        return res.status(400).json({ message: "refundWindowDays must be between 1 and 365" });
      }
      $set.refundWindowDays = Math.floor(n);
    }
    if (maxCompletionPercentForRefund !== undefined) {
      const n = Number(maxCompletionPercentForRefund);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        return res.status(400).json({ message: "maxCompletionPercentForRefund must be 0–100" });
      }
      $set.maxCompletionPercentForRefund = Math.round(n);
    }
    if (refundPercent !== undefined) {
      const n = Number(refundPercent);
      if (!Number.isFinite(n) || n < 1 || n > 100) {
        return res.status(400).json({ message: "refundPercent must be between 1 and 100" });
      }
      $set.refundPercent = Math.round(n);
    }
    if (refundAutoApprove !== undefined) {
      $set.refundAutoApprove = Boolean(refundAutoApprove);
    }
    if (refundReasonRequired !== undefined) {
      $set.refundReasonRequired = Boolean(refundReasonRequired);
    }
    if (moneyBackGuaranteeEnabled !== undefined) {
      $set.moneyBackGuaranteeEnabled = Boolean(moneyBackGuaranteeEnabled);
    }
    if (moneyBackGuaranteeTitle !== undefined) {
      $set.moneyBackGuaranteeTitle =
        typeof moneyBackGuaranteeTitle === "string" ? moneyBackGuaranteeTitle.trim().slice(0, 120) : "";
    }
    if (moneyBackGuaranteeBody !== undefined) {
      $set.moneyBackGuaranteeBody =
        typeof moneyBackGuaranteeBody === "string" ? moneyBackGuaranteeBody.trim().slice(0, 600) : "";
    }
    if (moneyBackGuaranteeLinkUrl !== undefined) {
      if (typeof moneyBackGuaranteeLinkUrl === "string" && moneyBackGuaranteeLinkUrl.trim()) {
        const p = parseHttpUrl(moneyBackGuaranteeLinkUrl.trim());
        if (!p.ok) {
          return res.status(400).json({ message: p.message || "Invalid guarantee link" });
        }
        $set.moneyBackGuaranteeLinkUrl = p.value;
      } else {
        $set.moneyBackGuaranteeLinkUrl = "";
      }
    }

    const doc = await SiteSettings.findOneAndUpdate(
      { _id: "global" },
      { $set },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    if (commentsGloballyDisabled !== undefined) {
      invalidateCommentSettingsCache();
    }

    const platformList = Array.isArray(doc?.platformCourseCategories)
      ? doc.platformCourseCategories
      : await getPlatformCategoryNamesForApi();

    const aboutBlockList = Array.isArray(doc?.aboutPageBlocks) ? doc.aboutPageBlocks : [];

    const whyLearnList = Array.isArray(doc?.whyLearnCards) ? doc.whyLearnCards : [];
    const rawRpOut = Number(doc?.refundPercent);
    const policyRefundPercentOut = !Number.isFinite(rawRpOut) ? 100 : Math.min(100, Math.max(1, Math.round(rawRpOut)));

    return res.status(200).json({
      commentsGloballyDisabled: Boolean(doc?.commentsGloballyDisabled),
      ratingsGloballyDisabled: Boolean(doc?.ratingsGloballyDisabled),
      homeAnnouncement: typeof doc?.homeAnnouncement === "string" ? doc.homeAnnouncement : "",
      refundsEnabled: Boolean(doc?.refundsEnabled),
      refundWindowDays: Math.min(365, Math.max(1, Number(doc?.refundWindowDays) || 14)),
      maxCompletionPercentForRefund: Math.min(
        100,
        Math.max(0, Number(doc?.maxCompletionPercentForRefund) ?? 20),
      ),
      refundPercent: policyRefundPercentOut,
      refundAutoApprove: Boolean(doc?.refundAutoApprove),
      refundReasonRequired: doc?.refundReasonRequired !== false,
      moneyBackGuaranteeEnabled: Boolean(doc?.moneyBackGuaranteeEnabled),
      moneyBackGuaranteeTitle:
        typeof doc?.moneyBackGuaranteeTitle === "string" ? doc.moneyBackGuaranteeTitle : "",
      moneyBackGuaranteeBody:
        typeof doc?.moneyBackGuaranteeBody === "string" ? doc.moneyBackGuaranteeBody : "",
      moneyBackGuaranteeLinkUrl:
        typeof doc?.moneyBackGuaranteeLinkUrl === "string" ? doc.moneyBackGuaranteeLinkUrl : "",
      platformCourseCategories: platformList,
      aboutPageTitle: typeof doc?.aboutPageTitle === "string" ? doc.aboutPageTitle : "",
      aboutPageBody: typeof doc?.aboutPageBody === "string" ? doc.aboutPageBody : "",
      aboutPageBlocks: aboutBlockList,
      defaultAboutPageTitle: DEFAULT_ABOUT_PAGE_TITLE,
      defaultAboutPageBody: DEFAULT_ABOUT_PAGE_BODY,
      defaultAboutPageBlocks: DEFAULT_ABOUT_PAGE_BLOCKS,
      whyLearnTitle: typeof doc?.whyLearnTitle === "string" ? doc.whyLearnTitle : "",
      whyLearnTitleHighlight:
        typeof doc?.whyLearnTitleHighlight === "string" ? doc.whyLearnTitleHighlight : "",
      whyLearnSubtitle: typeof doc?.whyLearnSubtitle === "string" ? doc.whyLearnSubtitle : "",
      whyLearnCards: whyLearnList,
      defaultWhyLearn: DEFAULT_WHY_LEARN,
      siteDisplayName: typeof doc?.siteDisplayName === "string" ? doc.siteDisplayName : "",
      heroBadgeText: typeof doc?.heroBadgeText === "string" ? doc.heroBadgeText : "",
      heroTitleLine1: typeof doc?.heroTitleLine1 === "string" ? doc.heroTitleLine1 : "",
      heroTitleHighlight: typeof doc?.heroTitleHighlight === "string" ? doc.heroTitleHighlight : "",
      heroSubtitle: typeof doc?.heroSubtitle === "string" ? doc.heroSubtitle : "",
      heroImageUrl: typeof doc?.heroImageUrl === "string" ? doc.heroImageUrl : "",
      heroPrimaryCtaLabel: typeof doc?.heroPrimaryCtaLabel === "string" ? doc.heroPrimaryCtaLabel : "",
      heroSecondaryCtaLabel: typeof doc?.heroSecondaryCtaLabel === "string" ? doc.heroSecondaryCtaLabel : "",
      heroTrustLine1: typeof doc?.heroTrustLine1 === "string" ? doc.heroTrustLine1 : "",
      heroTrustLine2: typeof doc?.heroTrustLine2 === "string" ? doc.heroTrustLine2 : "",
      heroTrustLine3: typeof doc?.heroTrustLine3 === "string" ? doc.heroTrustLine3 : "",
      defaultBranding: DEFAULT_BRANDING,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
